const { connectToTwitch } = require('./twitch-handler');
const { setCommands, handleCommands } = require('./command-handler.js');
const { handleJob, POLL_INTERVAL } = require('./job-handler');
const { server } = require ('./server-handler');


require('dotenv').config();

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

const AuthLevel = {
    USER: 0,
    REGULAR: 1,
    SUBSCRIBER: 2,
    VIP: 2,
    MOD: 3,
    BROADCASTER: 5,
};

const prefix = `${colors.cyan}[Conjure-Server]: `;


async function main() {
    try {
        console.log(`${prefix} Entering main...`);
        console.log(`${prefix} Connecting to Twitch...`);
        const { client } = await connectToTwitch();

        console.log(`${prefix} Getting commands...`);
        await setCommands();

        client.onMessage(async (channel, username, message, userstate) => {
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
        console.error('An error occurred in main(): ', error);
    }
}

main();