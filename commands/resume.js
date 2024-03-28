const { SlashCommandBuilder } = require("@discordjs/builders")
const { useQueue, useTimeline } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
        .setName("resume")
        .setDescription("Resumes the current song"),
	execute: async ({ interaction }) => {
        // Get the queue for the server
		const queue = useQueue(interaction.guild.id);
        const timeline = useTimeline(interaction.guild.id);

        // Check if the queue is empty
		if (!queue)
		{
			await interaction.reply("There are no songs in the queue")
			return;
		}

        // Pause the current song
		timeline.paused ? timeline.resume() : timeline.resume();
        const state = timeline.resume();
        return interaction.reply({ content: `**Playback** has been **${state ? 'paused' : 'resumed'}**` });
	},
}
