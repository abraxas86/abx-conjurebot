const { executeSelect, executeUpdate } = require('./database-handler');
//const { createYugi } = require('./card-creator.js');

//const fs = require('fs');
//const path = require('path');
//const { getBuiltinModule } = require('process');

let NSFW  = false;
const generalNegativePrompts = [
    "lowres", "text", "error", "cropped", "worst quality", "low quality", "jpeg artifacts",
    "ugly", "duplicate", "morbid", "mutilated", "out of frame", "extra fingers",
    "mutated hands", "poorly drawn hands", "poorly drawn face", "mutation", "deformed",
    "blurry", "dehydrated", "bad anatomy", "bad proportions", "extra limbs", "cloned face",
    "disfigured", "gross proportions", "malformed limbs", "missing arms", "missing legs",
    "extra arms", "extra legs", "fused fingers", "too many fingers", "long neck", "username",
    "watermark", "signature"
]

function allowNSFW(state){
    if (state.toLowerCase() == "no" ||  state.toLowerCase() == "false" || state.toLowerCase() == "off" || state == "0") NSFW = false;
    else if (state.toLowerCase() == "yes" ||  state.toLowerCase() == "true" || state.toLowerCase() == "on" || state == "1") NSFW = true;
    else console.log(`[ABX-CONJURE: conjure-handler] ERROR Flipping NSFW. State (${state}) not recognized`);

    console.log(`[ABX-CONJURE: conjure-handler] Allow NSFW: ${NSFW}`);
    return NSFW;
}

async function addToQueue(requestor, command, prompt, modifier, negativePrompts) {
    const timestamp = Date.now();
    const cardName = await getCardName();
    const cardType = await getCardType();

    // Check if the prompt includes user-provided negative prompts after "###"
    let userNegativePrompts = [];
    if (prompt.includes("###")) {
        [prompt, userNegativePrompts] = prompt.split("###");
        userNegativePrompts = userNegativePrompts.split(", ").map(item => item.trim().toLowerCase());
    }

    // Ensure negativePrompts is an empty string if it's null
    negativePrompts = negativePrompts ? negativePrompts.toLowerCase() : '';

    // Process general negative prompts and passed negative prompts
    let promptText = prompt.toLowerCase();
    let fullNegativePrompts = [
        ...new Set([
            ...generalNegativePrompts.map(item => item.toLowerCase()), 
            ...userNegativePrompts, 
            ...negativePrompts.split(", ").map(item => item.trim())
        ])
    ];

    // Remove negative prompts that conflict with phrases in the main prompt
    let filteredNegativePrompts = fullNegativePrompts.filter(negPrompt => 
        !promptText.includes(negPrompt) // This checks for multi-word phrases like 'poorly drawn'
    );

    // Rebuild the modifier with the final negative prompts
    modifier = `${modifier} ###${filteredNegativePrompts.join(", ")}`;

    console.log(`DEBUGGING NEGATIVE PROMPTS:  ${filteredNegativePrompts}`);
    console.log(`Final Modifier: ${modifier}`);
    console.log("----------------");

    // Convert boolean NSFW to string 'true' or 'false'
    const nsfwValue = NSFW ? '1' : '0';

    console.log(`Censored Value: ${nsfwValue}`);

    const insertQuery = `
        INSERT INTO Jobs (timestamp, requestor, command, prompt, modifier, nsfw, name, type, status, generationId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, Null)`;

    await executeUpdate(insertQuery, [timestamp, requestor, command, prompt, modifier, nsfwValue, cardName, cardType]);
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

module.exports = { addToQueue, allowNSFW };