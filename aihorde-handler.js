const { AIHorde } = require('@zeldafan0225/ai_horde');
const { executeSelect, executeUpdate } = require('./database-handler')
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // Use CommonJS-compatible import
const { io } = require('./server-handler'); // Adjust path as needed

const stableHordeApiKey = process.env.CONJURE_STABLEHORDE_API_KEY;
const client_agent = process.env.CONJURE_CLIENT_AGENT

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
    cache_interval: 1000 * 10,
    cache: {
        generations_check: 1000 * 30,
    },
    client_agent: client_agent
});


async function getWorkers(searchParams) {
    try {
        const workers = await ai_horde.getWorkers();

        // Sort workers by name
        workers.sort((a, b) => a.name.localeCompare(b.name));

        // If both searchParams.worker and searchParams.model are null, return all workers
        if (!searchParams.worker && !searchParams.model) {
            return workers;
        }

        // Filter workers based on search parameters
        const filteredWorkers = workers.filter(item => {
            const matchesWorker = searchParams.worker 
                ? item.name.toLowerCase().includes(searchParams.worker.toLowerCase()) 
                : true;

            const matchesModel = searchParams.model 
                ? item.models && item.models.some(model => model.toLowerCase().includes(searchParams.model.toLowerCase())) 
                : true; 

            return matchesWorker && matchesModel;
        });

        // Check if any workers were found after filtering
        if (filteredWorkers.length > 0) {
            return filteredWorkers;
        } else {
            return `No workers found with the specified criteria.`;
        }
    } catch (error) {
        console.error('Error fetching workers:', error);
        return 'Error fetching workers';
    }
}


async function getModels(model = null) {
    try {
        // Call to get models from ai_horde
        const models = await ai_horde.getModels();
        // Sort models by performance (descending)
        models.sort((a, b) => b.performance - a.performance);

        // If a specific model or keyword is passed, filter models based on that
        if (model) {
            // Convert the search keyword to lowercase for case-insensitive comparison
            const lowerCaseModel = model.toLowerCase();
            
            // Filter models to find all that include the keyword (fuzzy search)
            const filteredModels = models.filter(item => item.name.toLowerCase().includes(lowerCaseModel));
            
            if (filteredModels.length > 0) {
                return filteredModels;  // Return all matching models
            } else {
                return `No models found with the keyword "${model}".`;
            }
        }
        
        // If no model is passed, return all models
        return models;
    } catch (error) {
        console.error('Error fetching models:', error);
        return 'Error fetching models';
    }
}


async function cancelJob(generationID){
    try {
        const response = await ai_horde.deleteImageGenerationRequest(generationID);
        console.log("AI Horde cancel response:", response);  // Add this for debugging
        
        if (response?.success) { // Check based on the structure of the response
            console.log(`Job successfully canceled: ${generationID}`);
            await executeUpdate('UPDATE Jobs SET status = 99 WHERE generationID = ?', [generationID]);
        } else {
            console.error(`Error canceling request! ${generationID}`);
        }

        return response;

    } catch (error) {
        console.error(`Exception while canceling job ${generationID}:`, error);
        return false;
    }
}


async function getJob() {
        const job = await executeSelect("SELECT *, _rowid_ AS rowid FROM jobs WHERE status = 0 ORDER BY timestamp ASC LIMIT 1");

        //console.log(`[ABX-Conjurebot: aihorde-handler] Job fetched!`);
        //console.log(`${colours.blue}------ JOB DETAILS ------${colours.reset}`);
        //console.log(job);
        //console.log(`${colours.blue}-------------------------${colours.reset}\n`);
        return job;
}


async function sendRequest(job) {
    const allow_downgrade = true;
    const prompt = `${job.prompt}${job.modifier}`;

    console.log(`job.command: ${job.command}`);

    const [params] = await executeSelect('SELECT * FROM commands WHERE command = ?', [job.command]);

    console.log(`${colours.magenta} ===== JOB DETAILS =====\n ${colours.cyan}${JSON.stringify(job)}\n${colours.magenta}=======================`);

    try {
        // Convert the '0'/'1' value from the database to a boolean
        const nsfwBoolean = job.nsfw === 1;  // '1' => true, '0' => false
        const extrasSlowWorkersBoolean = job.extra_slow_workers === '1';
        const useKudos = job.useKudos === 1;

        const generationDataPayload = {
            prompt: prompt,
            nsfw: nsfwBoolean,
            allow_downgrade: allow_downgrade,
            replacement_filter: true,
            models: [params.model],
            extra_slow_workers: extrasSlowWorkersBoolean,
            params: {
                steps: params.steps || 30,
                cfg_scale: params.cfg || 5,
                sampler: params.sampler || 'k_euler',
                clip_skip: params.clip_skip || 0,
                hires_fix: params.hires_fix === true,
                karras: params.karras === true,
                height: 832, // Height of the image
                width: 832, // Width of the image
            }
        };

        // Set headers, conditionally adding the token if useKudos is true
        const headers = {
            'Client-Agent': client_agent,
            ...(useKudos && { 'Authorization': `Bearer ${stableHordeApiKey}` })
        };

        console.log(`************************************`);
        console.log(`NSFW: ${job.nsfw} || NSFW BOOLEAN: ${nsfwBoolean}`);
        console.log(`HEADERS:`, headers);
        console.log(`PAYLOAD:`);
        console.log(generationDataPayload);
        console.log(`************************************`);

        // Send the request with headers
        const response = await ai_horde.postAsyncImageGenerate(generationDataPayload, headers);

        const generationId = response.id;

        await executeUpdate('UPDATE jobs SET generationId = ?, status = 1 WHERE rowid = ?', [generationId, job.rowid]);
        return generationId;
    } catch (err) {
        console.error("[ABX-Conjurebot: conjure-server] Error sending request:", err);
    }
}


async function checkJob(generationID) {
    
    const [ reqPrompt ] = await executeSelect('SELECT requestor, prompt FROM jobs WHERE generationId = ?', [generationID]);

    try {
        const response = await ai_horde.getImageGenerationCheck(generationID);
        console.log(`[ABX-Conjurebot: aihorde-handler]`);
        console.log(`${colours.magenta}---- CHECKJOB RESULTS ----${colours.reset}`);
        console.log(response);
        console.log(`${colours.magenta}--------------------------${colours.reset}\n`);

        // Emit the job status update including generationId
        io.emit('jobStatusUpdate', { ...response, generationId: generationID, requestor: reqPrompt.requestor, prompt: reqPrompt.prompt });

        return response;

    } catch (err) {
        console.error("[ABX-Conjurebot: aihorde-handler] Error checking job status:", err);

        if (err.code === 'ETIMEDOUT') {
            console.error("Request timed out. Please check the network or the server.");
        } else if (err.code === 'ECONNREFUSED') {
            console.error("Connection refused. The server may be down.");
        } else {
            console.error("An unexpected error occurred:", err.message);
        }

        // Emit error status including generationId
        io.emit('jobStatusUpdate', { done: false, generationId: generationID });

        return { done: false }; // Adjust based on what your application expects
    }
}


async function getImage(generationID) {
    try {
        const response = await ai_horde.getImageGenerationStatus(generationID);
        console.log(`${colours.green}---- GETIMAGE RESULTS ----${colours.reset}`);
        console.log(response);
        console.log(`${colours.green}--------------------------${colours.reset}\n`);

        if (response.generations && response.generations.length > 0) {
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

function createPayload(params){

    let payload = {
        width:  params.width  || 768,
        height: params.height || 768,
        n:      params.n      || 1,
        steps:  params.steps  || 30,
    }

    switch(params.model.toLowerCase()){
        case "icbinp - i can't believe it's not photography":
            payload = {
            cfg_scale: params.cfg            || 3,
            clip_skip: params['clip_skip']   || 1,
            sampler: params.sampler          || 'k_dpmpp_2',
            karras: params.karras            || true,
            hires_fix: params['highres_fix'] || true,
            };
        break
        
        case "flux.1-schnell fp8 (compact)":
            payload = {
                cfg_scale: params.cfg        || 1,
                steps: param.steps           || 4,
                sampler: params.sampler      || 'k_euler',
                post_processing: params.post || ['RealESGRAN_x2plus'],
            }
            break
    }

    return payload;

}



module.exports = { getJob, sendRequest, checkJob, getImage, saveImage, getModels, cancelJob, getWorkers };
