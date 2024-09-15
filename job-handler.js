const { getJob, getImage, sendRequest, checkJob, saveImage } = require('./aihorde-handler.js');
const { executeSelect } = require('./database-handler');
const { createYugi } = require('./card-creator.js');

// Configurable timers (in milliseconds)
const POLL_INTERVAL = 3000; // Poll for new jobs every 3 seconds
const INITIAL_CHECK_DELAY = 6000; // Start checking job status after 6 seconds
const STATUS_CHECK_INTERVAL = 20000; // Check job status every 20 seconds if not done

const jobQueue = [];  // Array to track jobs in progress

async function handleJob(client, channel) {
    try {
        // Get the next unprocessed job in the database.
        const [job] = await getJob();
        if (!job) {
            //console.log("No new jobs found.");
            return;
        }

        console.log(`Got request from ${job.requestor} for ${job.prompt}`);

        // Send the job to the AI and get its generationID:
        const genID = await sendRequest(job);
        console.log(`Generation ID: ${genID}`);

        // Add job to queue for checking status
        jobQueue.push({ genID, startTime: Date.now(), status: 'pending' });
        console.log(`Job added to queue: ${JSON.stringify(jobQueue)}`);

        // Start polling for job completion after the initial delay
        setTimeout(() => checkJobStatus(client, channel, genID), INITIAL_CHECK_DELAY);

    } catch (error) {
        console.error('Error in handleJob:', error);
    }
}


async function checkJobStatus(client, channel, genID) {
    try {
        // Check the status of the job
        const status = await checkJob(genID);
        console.log(`Job Status for ${genID}: ${JSON.stringify(status)}`);

        if (status.done) {
            console.log("Job complete! Fetching image...");

            // Finish things up if the job is done
            const packet = await getImage(genID);
            const imgUrl = packet.generations[0].img;
            console.log(`Image URL: ${imgUrl}`);

            // Retrieve the requestor and prompt from the database
            const [result] = await executeSelect('SELECT requestor, prompt FROM Jobs WHERE generationId = ?', [genID]);
            if (!result) {
                console.error(`Requestor and prompt for genID ${genID} not found.`);
                return;
            }
            const { requestor, prompt } = result;

            // Truncate the prompt to the first 500 characters if needed
            const truncatedPrompt = prompt.length > 500 ? `${prompt.substring(0, 500)}` : prompt;

            // Prepare the response message
            const response = `@${requestor}: Here is the image for ${truncatedPrompt}`;

            // Send response message and image URL to chat
            client.say(channel, response);
            client.say(channel, imgUrl);

            // Save the webp generation
            saveImage(genID);

            // Optional: Create Yugioh card
            createYugi(genID);

            // Remove job from queue
            const index = jobQueue.findIndex(job => job.genID === genID);
            if (index !== -1) {
                jobQueue.splice(index, 1);  // Remove the job from the queue
                console.log(`Job with genID ${genID} removed from queue.`);
            }

        } else {
            console.log("Job still in progress, checking again in 15 seconds...");

            // Job not done yet, check again in STATUS_CHECK_INTERVAL milliseconds
            setTimeout(() => checkJobStatus(client, channel, genID), STATUS_CHECK_INTERVAL);
        }
    } catch (error) {
        console.error('Error in checkJobStatus:', error);
    }
}




// Export the functions and configurable timers to be used in the main server script
module.exports = {
    handleJob,
    POLL_INTERVAL,
    INITIAL_CHECK_DELAY,
    STATUS_CHECK_INTERVAL
};