const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const { useMainPlayer, QueryType } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song from YouTube.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("search")
                .setDescription("Searches for a song and plays it")
                .addStringOption(option =>
                    option.setName("searchterms").setDescription("Search keywords").setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("playlist")
                .setDescription("Plays a playlist from YouTube")
                .addStringOption(option => option.setName("url").setDescription("The playlist's URL").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("song")
                .setDescription("Plays a single song from YouTube")
                .addStringOption(option => option.setName("url").setDescription("The song's URL").setRequired(true))
        ),

    execute: async ({ client, interaction }) => {
        const player = useMainPlayer();
        const channel = interaction.member.voice.channel;

        // Make sure the user is inside a voice channel
        if (!channel) {
            return interaction.reply("You need to be in a Voice Channel to play a song.");
        }

        // Create a play queue for the server
        const queue = await client.player.nodes.create(interaction.guild);

        // Wait until you are connected to the channel
        if (!queue.connection) {
            await queue.connect(channel);
        }

        const embed = new EmbedBuilder();

        try {
            const subcommand = interaction.options.getSubcommand();
            let result;

            if (subcommand === "song") {
                let url = interaction.options.getString("url", true);

                // Search for the song using the discord-player
                result = await client.player.search(url, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO
                });

                // Check if the result object is empty or undefined
                if (!result || result.tracks.length === 0) {
                    console.log("No results found.");
                    return interaction.reply("No results");
                }

                // Add the track to the queue
                const song = result.tracks[0];
                await queue.addTrack(song);
                embed
                    .setDescription(`**[${song.title}](${song.url})** has been added to the Queue`)
                    .setThumbnail(song.thumbnail)
                    .setFooter({ text: `Duration: ${song.duration}` });
            }
            else if (subcommand === "playlist") {
                let url = interaction.options.getString("url", true);

                // Search for the playlist using the discord-player
                result = await client.player.search(url, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO
                });

                if (result.tracks.length === 0) {
                    console.log(`No playlists found with URL: ${url}`);
                    return interaction.reply(`No playlists found with ${url}`);
                }

                // Add the tracks to the queue
                await queue.addTrack(result.tracks);
                embed
                    .setDescription(`**${result.tracks.length} songs from [${result.playlist.title}](${result.playlist.url})** have been added to the Queue`)
                    .setThumbnail(result.playlist.thumbnail);
            }
            else if (subcommand === "search") {
                let searchTerms = interaction.options.getString("searchterms", true);

                // Search for the song using the discord-player
                result = await client.player.search(searchTerms, {
                    requestedBy: interaction.user,
                    searchEngine: QueryType.AUTO
                });

                // Log the length of the search results
                console.log("Number of tracks found:", result.tracks.length);

                // Finish if no tracks were found
                if (result.tracks.length === 0) {
                    console.log("No results found.");
                    return interaction.reply("No results");
                }

                // Add the track to the queue
                const song = result.tracks[0];
                await queue.addTrack(song);
                embed
                    .setDescription(`**[${song.title}](${song.url})** has been added to the Queue`)
                    .setThumbnail(song.thumbnail)
                    .setFooter({ text: `Duration: ${song.duration}` });
            }

            // Respond with the embed containing information about the player
            await interaction.reply({ embeds: [embed] }); // Changed embed.build() to embed

            // Determine the query based on the subcommand
            let query;
            if (subcommand === "search") {
                query = interaction.options.getString("searchterms", true);
            } else {
                query = interaction.options.getString("url", true);
            }

            try {
                const { track } = await player.play(channel, query, {
                    nodeOptions: {
                        // nodeOptions are the options for guild node (aka your queue in simple word)
                        metadata: interaction // we can access this metadata object using queue.metadata later on
                    }
                });

                return interaction.followUp(`**${track.title}** starting!`);
            } catch (e) {
                // Emit "playerError" event with the error information
                player.events.emit('playerError', queue, null, e);
                // let's return error if something failed
                return interaction.followUp(`Something went wrong: ${e}`);
            }

        } catch (error) {
            console.error("Error while executing play command:", error);
        }
    }
};