const { executeSelect, executeUpdate } = require('./database-handler');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, 'public', 'images');

async function createYugi(generationID) {
    // Get path of saved webp: filename will contain the generationID
    const imagePath = await findImagePath(generationID);

    if (!imagePath) {
        console.log('[ABX-Conjurebot: conjure-handler] No path returned');
        return;
    }

    // Card text info
    const [cardData] = await executeSelect('SELECT * FROM Jobs WHERE generationId = ?', [generationID]);
    const flavourLines = wrapText(`"${cardData.prompt}"`, 55);

    // Image variables
    const template = path.join(imageDir, 'template.png');
    const myCard = path.join(imageDir, 'myCard.png');
    const fileOut = imagePath.slice(0, -5) + '_yugi.png';

    console.log(`Debug imagePath: ${imagePath}`);

    try {
        // Step 1: Resize the generated image
        const resizedImageBuffer = await sharp(imagePath)
            .resize(333, 333)
            .toBuffer();

        // Step 2: Add card name, type, and flavor text
        const { width: templateWidth, height: templateHeight } = await sharp(template).metadata();

        console.log(`debug template height: ${templateHeight} | width: ${templateWidth}`);

        // Calculate text positioning for the bottom-right
        const lineHeight = 20; // Adjust this value as needed
        const bottomRightPadding = 30; // Padding from the right and bottom edges

        // Calculate the width of the "requestor" text to position it correctly
        const requestorText = `-${cardData.requestor}`;
        const requestorSvg = `<svg xmlns="http://www.w3.org/2000/svg" font-family="ITC Stone Serif Std Medium" font-size="13" fill="black"><text x="0" y="0">${requestorText}</text></svg>`;
        const requestorBuffer = Buffer.from(requestorSvg);
        const { width: requestorTextWidth } = await sharp(requestorBuffer).metadata();

        const textLinesSvg = flavourLines.map((line, index) => `
            <text x="30" y="${490 + (index * lineHeight)}" font-family="ITC Stone Serif Std Medium" font-size="13" fill="black">${line}</text>
        `).join('');

        const textSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${templateWidth}" height="${templateHeight}">
                <text x="30" y="55" font-family="Matrix" font-size="30" fill="black">${cardData.name}</text>
                <text x="33" y="475" font-family="Matrix" font-size="15" fill="black">[${cardData.type}]</text>
                ${textLinesSvg}
                <text x="${templateWidth - requestorTextWidth - bottomRightPadding}" y="${templateHeight - bottomRightPadding - 30}" font-family="ITC Stone Serif Std Medium" font-size="13" fill="black">${requestorText}</text>
            </svg>
        `;

        // Step 3: Composite layers (imagePath -> text -> template)
        const finalCardBuffer = await sharp({
                create: {
                    width: templateWidth,
                    height: templateHeight,
                    channels: 4,
                    background: 'transparent'
                }
            })
            .composite([
                // Place the resized generated image first (bottom layer)
                { input: resizedImageBuffer, left: 44, top: 110 },

                // Overlay the template image (middle layer)
                { input: template, blend: 'over' },

                // Overlay the text (top layer)
                { input: Buffer.from(textSvg), gravity: 'northwest' }
            ])
            .png()
            .toBuffer();

        // Save the final output image
        await sharp(finalCardBuffer).toFile(myCard);

        // Copy the final card image to the output path
        fs.copyFileSync(myCard, fileOut);
        
        setJobCompleted(generationID);

        console.log('[ABX-Conjurebot: conjure-handler] Card created and saved to:', fileOut);
    } catch (error) {
        console.error('[ABX-Conjurebot: conjure-handler] Error processing images:', error);
    }
}

// Wrap text to properly fit in card boundaries
function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    // Loop through each word and wrap text
    for (const word of words) {
        // If adding this word exceeds maxWidth, push the current line and start a new line
        if ((currentLine + ' ' + word).length > maxWidth) {
            lines.push(currentLine.trim()); // Trim to remove any extra spaces
            currentLine = word; // Start a new line with the current word
        } else {
            currentLine += (currentLine ? ' ' : '') + word; // Add the word to the current line
        }
    }

    // Add the last line if there's any remaining text
    if (currentLine) lines.push(currentLine.trim());

    return lines;
}

async function setJobCompleted(generationID){
    await executeUpdate('UPDATE Jobs SET status = ? WHERE generationId = ?',[3, generationID]);
}

async function findImagePath(searchString) {
    //console.log(`imageDir: ${imageDir}`);
    //console.log(`searchString: ${searchString}`);

    async function searchDirectory(currentDir) {
        const files = await fs.promises.readdir(currentDir, { withFileTypes: true });
        
        // console.log(`Files in directory: ${currentDir}`);
        //console.dir(files, { depth: null }); // Detailed logging of files

        for (const file of files) {
            const fullPath = path.join(currentDir, file.name);
            
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

module.exports = { createYugi };