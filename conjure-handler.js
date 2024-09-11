const { executeSelect, executeUpdate } = require('./database-handler');
const { createYugi } = require('./card-creator.js');
const fs = require('fs');
const path = require('path');

let NSFW = false;
const imageDir = path.join(__dirname, 'public', 'images');

function allowNSFW(state){
    if (state.toLowerCase() == "no" ||  state.toLowerCase() == "false" || state.toLowerCase() == "off" || state == "0") NSFW = false;
    else if (state.toLowerCase() == "yes" ||  state.toLowerCase() == "true" || state.toLowerCase() == "on" || state == "1") NSFW = true;
    else console.log(`[ABX-CONJURE: conjure-handler] ERROR Flipping NSFW. State (${state}) not recognized`);

    console.log(`[ABX-CONJURE: conjure-handler] Allow NSFW: ${NSFW}`);
    return NSFW;
}

async function addToQueue(requestor, prompt, modifier) {
    const timestamp = Date.now();
    const cardName = await getCardName();
    const cardType = await getCardType();

    // Convert boolean NSFW to string 'true' or 'false'
    const nsfwValue = NSFW ? '1' : '0';

    console.log(`NSFW Value: ${nsfwValue}`);

    const insertQuery = `
        INSERT INTO Jobs (timestamp, requestor, prompt, modifier, nsfw, name, type, status, generationId)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, Null)`;

    await executeUpdate(insertQuery, [timestamp, requestor, prompt, modifier, nsfwValue, cardName, cardType]);
    return;
}

async function getCardName() {
        const query1 = "SELECT name FROM Names WHERE position = 1 ORDER BY RANDOM() LIMIT 1";
        const query2 = "SELECT name FROM Names WHERE position = 2 ORDER BY RANDOM() LIMIT 1";
        let name, name2;

        const namePick = Math.random();

        [name] = await executeSelect(query2);
        [name2] = await executeSelect(query1);

        // This is dumb, but it works so whatever
        name = name.name;
    
        if (namePick > 0.5) name = `${name2.name} ${name}`;

        return name;
}

async function getCardType() {
        const [type] = await executeSelect("SELECT type FROM Type ORDER BY RANDOM() LIMIT 1");
        return type.type;
}





async function findImagePath(searchString) {
    //console.log(`imageDir: ${imageDir}`);
    //console.log(`searchString: ${searchString}`);

    async function searchDirectory(currentDir) {
        const files = await fs.promises.readdir(currentDir, { withFileTypes: true });
        
        // console.log(`Files in directory: ${currentDir}`);
        console.dir(files, { depth: null }); // Detailed logging of files

        for (const file of files) {
            const fullPath = path.join(currentDir, file.name);
            //console.log(`fullPath: ${fullPath}`);
            
            if (file.isDirectory()) {
                // Recursively search subdirectories
                const result = await searchDirectory(fullPath);
                if (result) return result; // Return if the file is found
            } else if (file.name.includes(searchString)) {
                // Check if the file name contains the searchString
                return fullPath; // Return the found file path
            }
        }

        return null; // Return null if no file is found
    }

    return searchDirectory(imageDir);
}


module.exports = { addToQueue, allowNSFW };