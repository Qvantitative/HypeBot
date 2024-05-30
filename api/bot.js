// api/bot.js
require('dotenv').config();

// Import necessary libraries
const { MongoClient } = require('mongodb');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require("discord-player");
const { get } = require("https");
const fs = require('fs');
const config = require('../config.json');
const path = require('path');

// Connection URI for MongoDB
const uri = 'mongodb://localhost:27017';
const mongoClient = new MongoClient(uri);

// Connect to MongoDB
async function connectToMongo() {
    try {
        await mongoClient.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error; // Re-throw the error to propagate it to the caller
    }
}

// Function to log subscription into MongoDB
async function logSubscription(user) {
    try {
        const database = mongoClient.db('subscriptions');
        const collection = database.collection('subscriptions');
        // Save subscription data to MongoDB
        await collection.insertOne({
            user_id: user.id,
            username: user.username,
            guild_id: user.guild.id,
            subscription_date: new Date()
        });
        console.log('Subscription logged in MongoDB');
        return await collection.find({}).toArray();
    } catch (error) {
        console.error('Error logging subscription to MongoDB:', error);
    }
}

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ],
});

client.config = require('../config.json');

client.commands = new Collection();
client.aliases = new Collection();
client.emotes = config.emoji;

// List of all commands
const commands = [];
client.commands = new Collection();
// Adjusted path to the commands directory
const commandsPath = path.join(__dirname, "../commands");

// Error handling for fs.readdir
fs.readdir(commandsPath, (err, files) => {
    if (err) {
        console.error('Error reading commands directory:', err);
        return;
    }
    const jsFiles = files.filter(f => f.endsWith('.js')); // Filter JS files
    if (jsFiles.length <= 0) {
        console.log('No command files found.');
        return;
    }

    // Load each command file asynchronously
    jsFiles.forEach(file => {
        try {
            const command = require(path.join(commandsPath, file));
            console.log(`Loaded ${file}`);
            client.commands.set(command.name, command);
            if (command.aliases) {
                command.aliases.forEach(alias => client.aliases.set(alias, command.name));
            }
        } catch (error) {
            console.error(`Error loading command from file ${file}:`, error);
        }
    });
});

try {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    commandFiles.forEach(file => {
        try {
            const command = require(path.join(commandsPath, file));
            if (command && command.data && command.data.name) {
                // New structure with data property
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
            } else if (command && command.name) {
                // Old structure without data property
                client.commands.set(command.name, command);
                commands.push(command);
            } else {
                console.error(`Command file ${file} does not export a valid command object.`);
            }
        } catch (error) {
            console.error(`Error loading command from file ${file}:`, error);
        }
    });
} catch (error) {
    console.error('Error reading commands directory synchronously:', error);
}

// This is the entry point for discord-player based application
const player = new Player(client);

client.player = player;

client.on('guildDelete', guild => {
    // Remove guild from cache
    client.guilds.cache.delete(guild.id);
    console.log(`Left the guild: ${guild.name}`);
});

client.on("ready", async (c) => {
    console.log(`Bot is logged in as ${c.user.tag}`);

    try {
        // Connect to MongoDB before proceeding with other tasks
        await connectToMongo();

        // Fetch all members and presences to ensure they are cached
        await client.guilds.cache.forEach(guild => {
            guild.members.fetch({ withPresences: true })
                .then(fetchedMembers => {
                    const totalOnline = fetchedMembers.filter(member => member.presence?.status === 'online');
                    console.log(`There are currently ${totalOnline.size} members online in the guild '${guild.name}'!`);
                })
                .catch(console.error);
        });

        // Get all ids of the servers
        const guild_ids = client.guilds.cache.map(guild => guild.id);

        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
        for (const guildId of guild_ids) {
            rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
                { body: commands })
                .then(() => console.log(`Successfully updated commands for guild ${guildId}`))
                .catch(error => console.error(`Failed to update commands for guild ${guildId}`, error));
        }

        // Load default extractors (including YouTube)
        await player.extractors.loadDefault();
    } catch (error) {
        console.error('Error during bot setup:', error);
    }
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Check if the user has the required role to execute the command
    const member = interaction.member;
    if (!member) return; // Ensure member exists

    // Define the required role name
    const requiredRoleName = 'Admin'; // Change this to the name of the required role

    // Check if any of the member's roles has the required role name
    const hasRequiredRole = member.roles.cache.some(role => role.name === requiredRoleName);

    if (!hasRequiredRole) {
        // If the user doesn't have the required role, simply return without replying
        return;
    }

    try {
        // If the command is 'subscribe', log the subscription
        if (command.name === 'subscribe') {
            await logSubscription(interaction.user);
        }
        await command.execute({ client, interaction });
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: "There was an error executing this command" });
    }
});

// Create an undici client
const undiciClient = get(`https://discord.com/api/v10/gateway`, ({ statusCode }) => {
    if (statusCode === 429) {
        process.kill(1);
    }
});

// Function to handle ECONNRESET error
function handleECONNRESETError(error) {
    console.error('ECONNRESET error occurred:', error);
    // Handle the error appropriately
}

// Assuming undiciClient is the BodyReadable instance where the error occurs
undiciClient.on('error', handleECONNRESETError);

function handleRateLimit() {
    try {
        // Make an HTTP request using the undici client
        undiciClient.end();
    } catch (error) {
        // Handle any errors that occur during the HTTP request
        console.error('Error occurred during HTTP request:', error);
        // Optionally, attempt to reconnect or handle the error in another way
    }
}

handleRateLimit();
setInterval(handleRateLimit, 3e5); //3e5 = 300000 (3 w/ 5 zeros)

client.login(process.env.TOKEN)
    .then(() => {
        console.log('Bot is logged in.');
    })
    .catch(error => {
        console.error('Error occurred during login:', error);
    });

module.exports = { logSubscription };