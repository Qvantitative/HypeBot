require('dotenv').config();

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { Player } = require("discord-player");
const { get } = require("https");
const fs = require('fs');
const config = require('./config.json')
const path = require('path');

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

client.config = require('./config.json')

client.commands = new Collection();
client.aliases = new Collection();
client.emotes = config.emoji;

// List of all commands
const commands = [];
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");

// Error handling for fs.readdir
fs.readdir('./commands/', (err, files) => {
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
            const command = require(`./commands/${file}`);
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

// Error handling for synchronous fs.readdirSync
try {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    commandFiles.forEach(file => {
        try {
            const command = require(path.join(commandsPath, file));
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
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

client.on("ready", () => {
    console.log(`Bot is logged in as ${client.user.tag}`);

    // Define a function to asynchronously handle the bot setup tasks
    const setupBot = () => {
        return new Promise(async (resolve, reject) => {
            try {
                // Fetch all members and presences to ensure they are cached
                await Promise.all(client.guilds.cache.map(async guild => {
                    try {
                        const fetchedMembers = await guild.members.fetch({ withPresences: true });
                        const totalOnline = fetchedMembers.filter(member => member.presence?.status === 'online');
                        console.log(`There are currently ${totalOnline.size} members online in the guild '${guild.name}'!`);
                    } catch (error) {
                        console.error(`Error fetching members for guild '${guild.name}':`, error);
                    }
                }));

                // Get all ids of the servers
                const guild_ids = client.guilds.cache.map(guild => guild.id);

                const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);
                await Promise.all(guild_ids.map(async guildId => {
                    try {
                        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), { body: commands });
                        console.log(`Successfully updated commands for guild ${guildId}`);
                    } catch (error) {
                        console.error(`Failed to update commands for guild ${guildId}`, error);
                    }
                }));

                // Load default extractors (including YouTube)
                await player.extractors.loadDefault();

                resolve(); // Resolve the promise once setup is complete
            } catch (error) {
                reject(error); // Reject the promise if there's an error
            }
        });
    };

    // Call the asynchronous function
    setupBot()
        .then(() => console.log('Bot setup completed successfully.'))
        .catch(error => console.error('Error during bot setup:', error));
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
    // Make an HTTP request using the undici client
    undiciClient.end();
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