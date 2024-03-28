const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageEmbed } = require("discord.js")
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("shows first 10 songs in the queue"),

    execute: async ({ interaction }) => {
        const queue = useQueue(interaction.guild.Id)

        // Check if there is no queue or no tracks in the queue
        if (!queue) {
            // If there's no queue, reply with an error message indicating that the bot is not in a voice channel
            return interaction.reply({ content: "I am **not** in a voice channel", ephemeral: true });
        }
        if (!queue.tracks || !queue.currentTrack) {
            // If there are no tracks in the queue or no current track playing, reply with an error message indicating that there's no queue to display
            return interaction.reply({ content: "There is **no** queue to **display**", ephemeral: true });
        }

        // Get the first 10 songs in the queue
        const queueString = queue.tracks.map((song, i) => {
            return `${i}) [${song.duration}]\` ${song.title} - <@${song.requestedBy.id}>`
        }).join("\n")

        // Get the current song
        const currentSong = queue.currentTrack

        await interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setDescription(`**Currently Playing**\n` + 
                        (currentSong ? `\`[${currentSong.duration}]\` ${currentSong.title} - <@${currentSong.requestedBy.id}>` : "None") +
                        `\n\n**Queue**\n${queueString}`
                    )
                    .setThumbnail(currentSong.thumbnail)
            ]
        })
    }
}
