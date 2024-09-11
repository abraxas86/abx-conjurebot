const express = require('express');
const path = require('path');
const { AIHorde } = require('@zeldafan0225/ai_horde');
const { connectToTwitch } = require('./twitch-handler');
const { executeSelect, executeUpdate } = require('./database-handler');
const { setCommands, handleCommands } = require('./command-handler.js');
const app = express();

// Load environment variables
require('dotenv').config();

// Set constants from environment variables
const serverAddress = process.env.CONJURE_SERVER_ADDRESS || 'localhost';
const serverPort = process.env.CONJURE_SERVER_PORT || 3000;

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
};

// Auth levels for gating commands
const AuthLevel = {
    USER: 0,
    REGULAR: 1,
    SUBSCRIBER: 2,
    VIP: 2,
    MOD: 3,
    BROADCASTER: 5,
};

const prefix = `${colors.blue}[Conjure-Server]: `;

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve the cardSpin.html file with embedded data
app.get('/', (req, res) => {
    const data = {
        socketAddress: serverAddress,
        socketPort: serverPort
    };
    res.render('cardSpin', data);
});

// Function to mark a job as completed
async function markJobAsCompleted(generationId) {
    try {
        const result = await executeUpdate('UPDATE Jobs SET status = ? WHERE generationId = ?', [1, generationId]);
        console.log('Job status updated:', result);
    } catch (error) {
        console.error('Error updating job status:', error);
    }
}

async function main() {
    try {
        console.log(`${prefix} Entering main...`);

        console.log(`${prefix} Connecting to Twitch...`);
        const { client } = await connectToTwitch();

        console.log(`${prefix} Initializing Express server...`);
        //const server = await startServer(serverAddress, serverPort);

        console.log(`${prefix} Initializing socket server...`);
        //const io = await initializeSocket(server, config);

        // Initializing Commands
        console.log(`${prefix} Getting commands...`)
        await setCommands();

        client.onMessage(async (channel, username, message, userstate) => {
            // Only proceed if message is potentailly a command
            if (!message.startsWith("!")) return;

            let userAuthLevel = AuthLevel.USER;

            if (userstate.userInfo.isBroadcaster) userAuthLevel = AuthLevel.BROADCASTER;
            else if (userstate.userInfo.isMod) userAuthLevel = AuthLevel.MOD;
            else if (userstate.userInfo.isVip) userAuthLevel = AuthLevel.VIP;
            else if (userstate.userInfo.isSubscriber) userAuthLevel = AuthLevel.SUBSCRIBER;
            
            await handleCommands(client, message, username, userAuthLevel, userstate, channel);
        });
        console.log('--- AWAITING CONJURATIONS ---');
    } catch (error) {
        console.error('an error occurred in main(): ', error);
    }
}

main();