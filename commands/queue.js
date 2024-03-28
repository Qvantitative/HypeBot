const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Shows first 10 songs in the queue"),

    execute: async ({ interaction }) => {
        const queue = useQueue(interaction.guild.id);

        if (!queue) {
            return interaction.reply({content: "I am not in a voice channel", ephemeral: true});
        }

        if (!queue.tracks || queue.tracks.size === 0) {
            return interaction.reply({ content: "There is no queue to display.", ephemeral: true });
        }

        let pagesNum = Math.ceil(queue.tracks.size / 5);
        if (pagesNum <= 0) pagesNum = 1;

        const tracks = queue.tracks.map((track, idx) => `**${++idx})** [${track.title}](${track.url})`);
        const paginatedMessages = [];

        for (let i = 0; i < pagesNum; i++) {
            const list = tracks.slice(i * 5, i * 5 + 5).join('\n');

            const embed = new MessageEmbed()
                .setColor('Red')
                .setDescription(`**Queue** for **session** in **${queue.channel?.name}:**\n${list === '' ? '\n*• No more queued tracks*' : `\n${list}`}\n**Now Playing:** [${queue.currentTrack?.title}](${queue.currentTrack?.url})\n`)
                .setFooter(`${queue.tracks.size} track(s) in queue`);

            paginatedMessages.push(embed);
        }

        return interaction.reply({ embeds: paginatedMessages });
    }
};