// Import necessary libraries
const { logSubscription } = require('../index.js');

module.exports = {
    name: 'subscribe',
    description: 'Subscribe to the bot',
    execute({ interaction }) {
        // Call the logSubscription function to log the subscription
        logSubscription(interaction.user)
            .then(() => {
                // Subscription logged successfully, send a response to the user
                interaction.reply({ content: 'You have successfully subscribed to the bot!' });
            })
            .catch(error => {
                // Handle errors if logging subscription fails
                console.error('Error logging subscription:', error);
                interaction.reply({ content: 'An error occurred while processing your subscription.' });
            });
    },
};