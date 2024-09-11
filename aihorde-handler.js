const { AIHorde } = require('@zeldafan0225/ai_horde');
const { executeSelect, executeUpdate } = require('./database-handler')
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // Use CommonJS-compatible import


const stableHordeApiKey = process.env.CONJURE_STABLEHORDE_API_KEY;

const colours = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
};

const ai_horde = new AIHorde({
    api_key: stableHordeApiKey,
    cache_interval: 1000 * 10,
    cache: {
        generations_check: 1000 * 30,
    },
    client_agent: "abx-conjureBot:v0.0.1:abraxas86OnTwitch"
});


async function getJob() {
        const job = await executeSelect("SELECT *, _rowid_ AS rowid FROM jobs WHERE status = 0 ORDER BY timestamp ASC LIMIT 1");

        console.log(`[ABX-Conjurebot: aihorde-handler] Job fetched!`);
        console.log(`${colours.blue}------ JOB DETAILS ------${colours.reset}`);
        console.log(job);
        console.log(`${colours.blue}-------------------------${colours.reset}`);
        return job;
}

async function sendRequest(job) {
    const allow_downgrade = true;
    const prompt = `${job.prompt}${job.modifier}`;

    try {
        // Convert the '0'/'1' value from the database to a boolean
        const nsfwBoolean = job.nsfw === '1';  // '1' => true, '0' => false

        const response = await ai_horde.postAsyncImageGenerate({
            prompt: prompt,
            nsfw: nsfwBoolean,  // Pass as boolean
            allow_downgrade: allow_downgrade,
            replacement_filter: true,
            token: stableHordeApiKey
        });

        const generationId = response.id;
        await executeUpdate('UPDATE jobs SET generationId = ?, status = 1 WHERE rowid = ?', [generationId, job.rowid]);
        return generationId;
    } catch (err) {
        console.error("[ABX-Conjurebot: conjure-server] Error sending request:", err);
    }
}

async function checkJob(generationID) {
    try {
        const response = await ai_horde.getImageGenerationCheck(generationID);
        console.log(`[ABX-Conjurebot: aihorde-handler]`);
        console.log(`${colours.magenta}---- CHECKJOB RESULTS ----${colours.reset}`);
        console.log(response);
        console.log(`${colours.magenta}--------------------------${colours.reset}`);
        return response;
    } catch (err) {
        console.error("[ABX-Conjurebot: aihorde-handler] Error checking job status:", err);
    }
}

async function getImage(generationID) {
    try {
        const response = await ai_horde.getImageGenerationStatus(generationID);
        console.log(`${colours.green}---- GETIMAGE RESULTS ----${colours.reset}`);
        console.log(response);
        console.log(`${colours.green}--------------------------${colours.reset}`);

        if (response.generations && response.generations.length > 0) {
            const imageUrl = response.generations[0].img; // Access the first generation's image
            return response;
        } else {
            console.log("[ABX-Conjurebot: aihorde-handler] No image found in generations.");
            return null;
        }
    } catch (err) {
        console.error("[ABX-Conjurebot: aihorde-handler] Error getting image:", err);
    }
}

async function saveImage(imageURL, generationId){
    [jobInfo] = await executeSelect('SELECT * FROM Jobs WHERE generationId = ?', [generationId]);
    const imageDir = path.join(__dirname, 'public', 'images')

    const isoTime = formatDateToIso(jobInfo.timestamp);
    const fileName = `${isoTime}-${generationId}-${jobInfo.requestor}`;

    // Download and process the image
    const imageFetchResponse = await fetch(imageURL);
    const buffer = await imageFetchResponse.buffer();
    const imagePath = path.join(imageDir, `${fileName}.webp`);

    fs.writeFileSync(imagePath, buffer);

    console.log(`image saved: ${imagePath}`);
}

function formatDateToIso(epochtime){
    // Convert the epoch timestamp to a JavaScript Date object
    const date = new Date(epochtime);

    // Extract local time components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Format as yyyy-mm-dd_hh.mm.ss
    return `${year}-${month}-${day}_${hours}.${minutes}.${seconds}`;

}



module.exports = { getJob, sendRequest, checkJob, getImage, saveImage };