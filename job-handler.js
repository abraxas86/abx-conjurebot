/*
const { executeSelect, executeUpdate } = require('./database-handler');
const { getJob, sendRequest, checkJob, getImage } = require('./aihorde-handler');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // Use CommonJS-compatible import

const imageDir = path.join(__dirname, 'public', 'images');
const checkInterval = 5000; // 5 seconds


async function processJobs() {
    try {
        const jobs = await getJob(); // Get jobs from the database

        if (!jobs || jobs.length === 0) {
            console.log("No jobs available.");
            return;
        }

        // Assuming the jobs array contains at least one job object
        const job = jobs[0];

        if (job.status === 0) {
            // Job is in the queue, submit it to the AI Horde
            const generationId = await sendRequest(job);

            // Poll for job completion
            let jobCompleted = false;
            while (!jobCompleted) {
                const statusResponse = await checkJob(generationId);
                jobCompleted = statusResponse.done === true;

                if (!jobCompleted) {
                    await new Promise(resolve => setTimeout(resolve, checkInterval));
                }
            }

            // Once complete, fetch the image URL
            const imageUrl = await getImage(generationId);

            // Download and process the image
            const imageFetchResponse = await fetch(imageUrl);
            const buffer = await imageFetchResponse.buffer();
            const imagePath = path.join(imageDir, `${generationId}.png`);

            fs.writeFileSync(imagePath, buffer);

            // Process the image using ImageMagick
d

            // Update job status to 1 (submitted)
            await executeUpdate(`UPDATE Jobs SET status = 1, generationId = ? WHERE rowid = ?`, [generationId, job.rowid]);

        } else if (job.status === 1) {
            // Job has been submitted but image is not fetched yet
            const imageUrl = await getImage(job.generationId);

            // Download and process the image
            const imageFetchResponse = await fetch(imageUrl);
            const buffer = await imageFetchResponse.buffer();
            const imagePath = path.join(imageDir, `${job.generationId}.png`);

            fs.writeFileSync(imagePath, buffer);

            // Process with ImageMagick
            const processedImagePath = path.join(imageDir, `processed_${job.generationId}.png`);
            ImageMagick.convert([imagePath, '-resize', '300x400', processedImagePath], (err) => {
                if (err) {
                    console.error('Error processing image with ImageMagick:', err);
                } else {
                    console.log(`Image processed: ${processedImagePath}`);
                    io.emit('jobComplete', job.generationId, `/images/processed_${job.generationId}.png`);
                }
            });

            // Update job status to 2 (image fetched and processed)
            await executeUpdate(`UPDATE Jobs SET status = 2 WHERE rowid = ?`, [job.rowid]);

        } else if (job.status === 2) {
            console.log("Job already processed and image fetched.");
        } else {
            console.log("Unknown job status.");
        }

    } catch (error) {
        console.error('Error processing job:', error);
    }
}

setInterval(processJobs, checkInterval);
*/