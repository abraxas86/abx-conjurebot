const { executeSelect, executeUpdate } = require('./database-handler');
const { addToQueue, allowNSFW, useKudos } = require('./conjure-handler.js');
const { getJob, getImage, sendRequest, checkJob, saveImage, getModels, cancelJob, getWorkers } = require('./aihorde-handler.js');
const { colours } = require('./colours.js');

const { createYugi } = require('./card-creator.js');

let commands = [];
let adminCommands = [];
let botname;

// Load commands from the database
async function setCommands() {
    commands = await executeSelect('SELECT command, modifier, negativePrompts, model, botResponse FROM commands WHERE enabled = ? ORDER BY command ASC',[1]);
    adminCommands = ['!getImage','!saveImage', '!nsfw', '!refresh-conjure']
    console.log('[ABX-Conjurebot: command-handler] Commands loaded: ', commands.map(cmd => cmd.command).join(', ') );
    return;
}

// Handle command execution based on user message and auth level
async function handleCommands(client, message, username, userAuthLevel, userstate, channel){ 
    const matchedCommand = commands.find(cmd => message.trim().toLowerCase().startsWith(cmd.command.toLowerCase()));
    //const matchedAdminCommand = adminCommands.find(cmd => message.trim().toLowerCase().startsWith(cmd.adminCommand.toLowerCase()))

    // Help command to post all available options to chat:
    if (message.toLowerCase() === '!help' || message.toLowerCase() === '!help-conjure' || message.toLowerCase() === '!conjure-help' || message.toLowerCase() === '!conjure-commands'){
        client.say(channel, `Available art conjure commands: ${commands.map(cmd => cmd.command).join(', ')}`);
    }

    // Broadcaster-only commands
    if (userAuthLevel >= 4){
        // update conjure commands
        if (message === '!refresh-conjure' || message === '!conjure-refresh'){
            await setCommands();
            client.say(channel, `Conjurations updated by ${username}`);
            console.log(`[ABX-Conjurebot: command-handler] Commands refreshed by ${username}`);
            const commandList = commands.map(cmd => cmd.command).join(', ');
            client.say(channel, `Here are the available conjure commands: ${commandList}`);
        }

        // toggle NSFW
        if (message.toLowerCase().startsWith('!nsfw')){
            const nsfwState = message.slice(5).trim();
            const NSFW =  allowNSFW(nsfwState);
            
            client.say(channel, `NSFW conjuring is currently ${NSFW ? "enabled" : "disabled"}`);
        }

        // Toggle passing of token
        if (message.toLowerCase().startsWith('!usetoken')){
            const kudosState = message.slice(9).trim();
            const burningTokens =  useKudos(kudosState);
            
            client.say(channel, `You are currently ${burningTokens ? "burning kudos to expedite jobs." : "not burning kudos to expedite jobs."}`);
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

        if (message.toLowerCase().startsWith('!yugi')){
            const genID = message.slice(6).trim()

            createYugi(genID);
        }

        if (message.toLowerCase().startsWith('!checkmodel')) {
            const model = message.slice(12).trim();
        
            const modelStats = await getModels(model);
            
            if (typeof modelStats === 'string') {
                // If the result is a string (e.g., error or "not found"), send that back
                console.log(modelStats);
            } else {
                // Send back the stats for the matching models or all models
                console.log("=== MODEL STATS ===")
                console.log(modelStats);
                console.log("===================");

                return; 
            }
        }

        if (message.toLowerCase().startsWith('!getworkers')) {
            const workerPart = message.slice(12).trim(); // Get everything after "!getworkers"
        
            // Adjust regex to capture everything after "-models"
            const modelMatch = workerPart.match(/-model\s+(.+)/); // Capture all after "-models"
            let query = { worker: null, model: null };
        
            if (modelMatch) {
                query.model = modelMatch[1].trim(); // Capture the full model string
            }
        
            // Remove the model part from workerPart
            query.worker = workerPart.replace(modelMatch ? modelMatch[0] : '', '').trim();
        
            const workerInfo = await getWorkers(query);
            console.log('======== WORKERS ========');
            console.log(workerInfo);
            console.log('Model:', query.model); // Log the extracted model
            console.log('=========================');
        
            return;
        }
        
  
        if (message.toLowerCase().startsWith('!canceljob')) {
            const genID = message.slice(10).trim();
            const canceled = await cancelJob(genID);

            if (canceled){
                client.say(channel, 'Job successfully canceled.');
            } else {
                client.say(channel, 'Error canceling job!');
            }

            return
        }
        
        if (message.toLowerCase().startsWith('!debug')){
            const blurb = message.slice(6).trim();

            await sendTextRequest(blurb);
            return;
        }

        if (message.toLowerCase().startsWith('!cardsbyuser')){
            try{
                const stats = await executeSelect('SELECT requestor, COUNT(*) AS cardcount FROM jobs WHERE status = ? GROUP BY requestor ORDER BY cardcount DESC', [3]);

                if (stats.length === 0 ){
                    client.say(channel,'Nobody has requested any cards yet!');
                    return;
                } else { 
                    let cardCountResponse = '';

                    stats.forEach((row) => {
                        cardCountResponse += `${row.requestor} (${row.cardcount}) `;
                    });

                    client.say(channel, `Card counts per user: ${cardCountResponse}`);
                    return;
                }
            } catch {
                client.say(channel, 'Error returning results');
                return;
            }
        }
    } // end of broadcaster-only commands

    if (message.toLowerCase().startsWith('!cardcount')){
        let user = message.slice(10).trim() || username;

        try{
            [cardCount] = await executeSelect('SELECT COUNT(requestor) AS cardcount FROM jobs WHERE requestor=? AND status=?',[user,3]);
            client.say(channel,`${user} has created ${cardCount.cardcount} cards.`);      
        } catch {
            client.say(channel, `Error fetching results for ${user}.`);
        }

        return;
    }

    if (matchedCommand) {
        const prompt = message.slice(matchedCommand.command.length).trim();
        if (!prompt){
            const commandList = commands.map(cmd => cmd.command).join(', ');
            client.say(channel, `Here are the available conjure commands, don't forget to add a prompt!  ${commandList}`);
            return;
        }
        client.say(channel, matchedCommand.botResponse ?? "Let's see what I can conjure up...");

        await addToQueue(username, matchedCommand.command, prompt, matchedCommand.modifier, matchedCommand.negativePrompts, matchedCommand.model);

        console.log(`[ABX-Conjurebot: command-handler] ${username} used ${matchedCommand.command}: ${prompt}`);

        // Start handling the conjure job
        await handleConjureJob(client, channel, username, prompt);
    }
}

async function handleConjureJob(client, channel, username, prompt) {
    try {
        // Retrieve a job
        const [job] = await getJob();
        if (!job) {
            client.say(channel, "If you see this, it means @abraxas86 screwed up the code and I couldn't find your job...");
            return;
        }

        // Send the request
        const genID = await sendRequest(job);

        console.log(genID);

        // Wait for 5 seconds before checking the job status
        await new Promise(resolve => setTimeout(resolve, 5000));

        let status = await checkJob(genID);

        // Cancel job if not possible
        if (!status.is_possible) {
            await executeUpdate('UPDATE Jobs SET status = 99 WHERE requestor = ? AND generationId IS NULL', [job.requestor]);
            console.error(`Status set to 99: ${genID} - ${job.prompt}`);
            await cancelJob(genID);
            client.say(channel, `Sorry ${job.requestor}, your request for ${job.prompt} was not possible and has been canceled.`);
            return;
        }
        else {
            client.say(channel, `@${job.requestor} the ETA on your job is approximately ${Math.floor(status.wait_time / 60) } minutes and ${status.wait_time % 60} seconds...`);
         }
        // Loop until the job is done
        while (!status.done) {
            // Calculate the dynamic wait time
            let waitTime = status.wait_time / 2;
            if (waitTime > 60) {
                waitTime = 60;
            } else if (waitTime < 5) {
                waitTime = 5;
            }

            console.log(`Job ${genID} not done yet. Checking again in ${Math.floor(waitTime / 60)} minutes and ${waitTime % 60} seconds...`);

            // Wait for the calculated time before checking the status again
            await new Promise(resolve => setTimeout(resolve, waitTime * 1000));

            // Check the job status again
            status = await checkJob(genID);
        }

        // Get the image and process it
        const packet = await getImage(genID);

        if (packet && packet.generations && packet.generations.length > 0) {
            const generation = packet.generations[0];

            // Check if job was censored.  Cancel further processing if it is.
            if (generation.gen_metadata && generation.gen_metadata.length > 0) {
                const metadataItem = generation.gen_metadata[0]; // Access the first item
                if (metadataItem.type.toLowerCase() === 'censorship') {
                    console.error("Job completed, but returned as censored:", metadataItem.value);
                    client.say(channel, `@${job.requestor} your job finished, but was censored. Please try again.`);
                    return;
                }
            }

            const imgUrl = generation.img;

            // Notify the user
            client.say(channel, `${username}: here is your image for: ${prompt}!`);
            client.say(channel, `Click at your own risk: ${imgUrl}`);

            const worker = packet.generations[0]['worker_name']

            if (worker.toLowerCase().includes('ai-braxas')){
                client.say(channel, `Oh, @Abraxas86 's worker '${worker}' made that!  What a good worker!`);
                console.log(`${colours.cyan}Abraxas86's ${colours.magenta}WORKER ${colours.yellow}MADE ${colours.blue}THIS!${colours.reset}`);
            }

            if (worker.toLowerCase().includes('froggi')){
                client.say(channel, `@idkijustwantedareallylong 's worker made that! Thanks!`);
                console.log(`${colours.green}Froggi's worker ${worker} made this!${colours.reset}`);
            }

            // Save the image and create the Yugi card
            await saveImage(imgUrl, genID);
            await createYugi(genID);

        } else {
            client.say(channel, `No image found for this job.`);
        }

    } catch (error) {
        console.error(`An error occurred while processing the job:`, error);
    }
}


module.exports = { setCommands, handleCommands };
