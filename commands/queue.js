const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Shows first 10 songs in the queue"),

    execute: async ({ interaction }) => {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.tracks || queue.tracks.size === 0) {
            return interaction.reply({ content: "There is no queue to display.", ephemeral: true });
        }

        const queueString = queue.tracks
            .filter(song => song && song.requestedBy && song.requestedBy.id)
            .map((song, i) => {
                return `${i}) [${song.duration}]\` ${song.title} - <@${song.requestedBy.id}>`;
            })
            .join("\n");

        const currentSong = queue.currentTrack;

        const messageContent = `**Currently Playing**\n` +
            (currentSong ? `\`[${currentSong.duration}]\` ${currentSong.title} - <@${currentSong.requestedBy.id}>` : "None") +
            `\n\n**Queue**\n${queueString}`;

        const embed = new MessageEmbed()
            .setDescription(messageContent)
            .setThumbnail(currentSong ? currentSong.thumbnail : '');

        return interaction.reply({ embeds: [embed] });
    }
};