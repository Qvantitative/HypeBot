module.exports = {
    name: 'subscribe',
    description: 'Subscribe to the bot',
    async execute({ interaction }) {
        try {
            // Import the logSubscription function from index.js
            const { logSubscription } = require('../index.js');

            // Call the logSubscription function to log the subscription
            await logSubscription(interaction.user);

            // Subscription logged successfully, send a response to the user
            await interaction.reply({ content: 'You have successfully subscribed to the bot!' });
        } catch (error) {
            // Handle errors if logging subscription fails
            console.error('Error logging subscription:', error);
            await interaction.reply({ content: 'An error occurred while processing your subscription.' });
        }
    },
};