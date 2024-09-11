const { RefreshingAuthProvider } = require('@twurple/auth');
const { ChatClient } = require('@twurple/chat');
require('dotenv').config()

const client_id = process.env.CONJURE_TWITCH_CLIENT_ID;
const client_secret = process.env.CONJURE_TWITCH_CLIENT_SECRET;
const accessToken = process.env.CONJURE_TWITCH_ACCESS_TOKEN;
const refreshToken = process.env.CONJURE_TWITCH_REFRESH_TOKEN;
const channels = process.env.CONJURE_TWITCH_CHANNELS.split(',');

async function connectToTwitch() {
    const authProvider = new RefreshingAuthProvider({
        clientId: client_id,
        clientSecret: client_secret
    });

    await authProvider.addUserForToken({
        accessToken: accessToken,
        refreshToken: refreshToken
    }, ['chat']);

    const client = new ChatClient({ authProvider, channels });
    await client.connect();
    return { client, authProvider };
}

module.exports = { connectToTwitch };