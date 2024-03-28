const { SlashCommandBuilder } = require("@discordjs/builders")
const {useQueue} = require("discord-player");

module.exports = {
	data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skips the current song"),

	execute: async ({  interaction }) => {

        // Get the queue for the server
		const queue = useQueue(interaction.guild.id);

        // If there is no queue, return
		if (!queue)
        {
            await interaction.reply("There are no songs in the queue");
            return;
        }

        const currentSong = queue.currentTrack

        // Skip the current song
		queue.node.skip()

        // Return an embed to the user saying the song has been skipped
        return interaction.reply({
			content: `⏩ | I have **skipped** ${currentSong}`
		});
	},
}
