const { connectToTwitch } = require('./twitch-handler');
const { setCommands, handleCommands } = require('./command-handler.js');
const { colours } = require ('./colours.js');

require('dotenv').config();


const AuthLevel = {
    USER: 0,
    REGULAR: 1,
    SUBSCRIBER: 2,
    VIP: 2,
    MOD: 3,
    BROADCASTER: 5,
};

const prefix = `${colours.cyan}[Conjure-Server]: `;


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