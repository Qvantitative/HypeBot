const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageEmbed } = require("discord.js")
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("shows first 10 songs in the queue"),

    execute: async ({ interaction }) => {
        const queue = useQueue(interaction.guild.Id)

        // Check if the queue exists and if it's not empty
        if (!queue || queue.tracks.size === 0) {
            // If the queue doesn't exist or it's empty, reply with an error message
            return interaction.reply({ content: "There is no queue to display.", ephemeral: true });
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
