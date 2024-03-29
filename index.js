require('dotenv').config();

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { VoiceConnectionStatus, entersState  } = require('@discordjs/voice');
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

// Asynchronous approach using fs.readdir
fs.readdir('./commands/', (err, files) => {
    if (err) return console.log('Could not find any commands!');
    const jsFiles = files.filter(f => f.endsWith('.js')); // Filter JS files
    if (jsFiles.length <= 0) return console.log('Could not find any commands!');

    // Load each command file asynchronously
    jsFiles.forEach(file => {
        const command = require(`./commands/${file}`);
        console.log(`Loaded ${file}`);
        client.commands.set(command.name, command);
        if (command.aliases) {
            command.aliases.forEach(alias => client.aliases.set(alias, command.name));
        }
    });
});

// Synchronous approach using fs.readdirSync
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
commandFiles.forEach(file => {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
});

// This is the entry point for discord-player based application
const player = new Player(client);

client.player = player;

connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
	try {
		await Promise.race([
			entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
			entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
		]);
		// Seems to be reconnecting to a new channel - ignore disconnect
	} catch (error) {
		// Seems to be a real disconnect which SHOULDN'T be recovered from
		connection.destroy();
	}
});

client.on('guildDelete', guild => {
    // Remove guild from cache
    client.guilds.cache.delete(guild.id);
    console.log(`Left the guild: ${guild.name}`);
});

client.on("ready", (c) => {
    console.log(`Bot is logged in as ${c.user.tag}`);

    // Define a function to asynchronously handle the bot setup tasks
    const setupBot = async () => {
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
        };

    // Call the asynchronous function
    setupBot().catch(error => console.error('Error during bot setup:', error));
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

client.login(process.env.TOKEN)
    .then(() => {
        console.log('Bot is logged in.');
    })
    .catch(error => {
        console.error('Error occurred during login:', error);
    });