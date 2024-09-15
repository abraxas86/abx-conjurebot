const { executeSelect } = require('./database-handler');
const { addToQueue, allowNSFW } = require('./conjure-handler.js');
const { getJob, getImage, sendRequest, checkJob, saveImage } = require('./aihorde-handler.js');

const { createYugi } = require('./card-creator.js');

let commands = [];
let adminCommands = [];

// Load commands from the database
async function setCommands() {
    commands = await executeSelect('SELECT command, modifier, botResponse FROM commands ORDER BY command ASC');
    adminCommands = ['!getImage','!saveImage', '!nsfw', '!refresh-conjure']
    console.log('[ABX-Conjurebot: command-handler] Commands loaded: ', commands);
}

// Handle command execution based on user message and auth level
async function handleCommands(client, message, username, userAuthLevel, userstate, channel){ 
    const matchedCommand = commands.find(cmd => message.trim().toLowerCase().startsWith(cmd.command.toLowerCase()));
    //const matchedAdminCommand = adminCommands.find(cmd => message.trim().toLowerCase().startsWith(cmd.adminCommand.toLowerCase()))

    // Broadcaster-only commands
    if (userAuthLevel >= 4){ //} && matchedAdminCommand) {
        // update conjure commands
        if (message === '!refresh-conjure' || message === '!conjure-refresh'){
            await setCommands();
            client.say(channel, `Conjurations updated by ${username}`);
            console.log(`[ABX-Conjurebot: command-handler] Commands refreshed by ${username}`);
        }

        // toggle NSFW
        if (message.toLowerCase().startsWith('!nsfw')){
            const nsfwState = message.slice(5).trim();
            const NSFW =  allowNSFW(nsfwState);
            
            client.say(channel, `NSFW conjuring is currently ${NSFW ? "enabled" : "disabled"}`);
        }

        // init job
        if (message.toLowerCase().startsWith('!initjob')){
            const [job] = await getJob();
            if (!job){
                client.say(channel, "No pending jobs to initialize.");
                return;
            }

            client.say(channel,`Sending request from ${job.requestor} for ${job.prompt} to the AI...`);

            const genID = await sendRequest(job);
            client.say(channel,`genID: ${genID}`);
        }

        // check job
        if (message.toLowerCase().startsWith('!checkjob')){
            const genID = message.slice(9).trim()
            const status = await checkJob(genID);
            console.log(status);
            
            if (status.done){
                client.say(channel, 'job complete! Let me get the link.');
                const packet = await getImage(genID);
                const imgUrl = packet.generations[0].img
                client.say(channel, `Click at your own risk: ${imgUrl}`);
                console.log(packet);
                saveImage(imgUrl, genID);
            } else {
                client.say(channel, 'Still in the queue...');
            }

        
        }
         
        // Get packet from completed job
        if (message.toLowerCase().startsWith('!getimage')){
            const ID = message.slice(9).trim()
            const packet = await getImage(ID);
            const imgUrl = packet.generations[0].img
            client.say(channel, `Click at your own risk: ${imgUrl}`);
            console.log(packet);
            saveImage(imgUrl, ID);
        }

        if (message.toLowerCase().startsWith('!debug')){
            const blurb = message.slice(6).trim()

            createYugi(blurb);
        }


    }

    if (matchedCommand) {
        client.say(channel, matchedCommand.botResponse ?? "Let's see what I can conjure up...");
        const prompt = message.slice(matchedCommand.command.length).trim();

        addToQueue(username, prompt, matchedCommand.modifier);

        console.log(`[ABX-Conjurebot: command-handler] ${username} used ${matchedCommand.command}: ${prompt}`);
    }
}



module.exports = { setCommands, handleCommands };