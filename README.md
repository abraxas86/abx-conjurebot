### Note: This project is still *very* WIP

# ABX-Conjurebot 
This script combines AI_Horde and NodeJS to allow users in Twitch to create fake Yugioh cards using AI

## Setting up:
Edit the .env_template file to suit your needs.  Save as `.env`

## How to start the bot:
`./start.sh`

## Setting up in OBS:
Create a browser source that points to the address and port that you configured in your `.env` file

## How to use in chat:
Twitch chat users fire off any of the given commands you have created, and a prompt.  The script will handle the rest.

Negative prompts can be added by entering `###` followed by whatever negative prompts you want (ie: !conjure a person ###extra fingers, missign fingers, disfigured hand).  Note that the script already contains some negative prompts by default, and will try to strip out any duplicates or conflict terms that match words in the prompt. (This is far from perfect, though).

The broadcaster has the ability to manually process a job via:

1. `!initjob`: Grabs the oldest unprocessed job and sends to AI.  The GenerationID will be returned in the chat.   
2. `!checkjob [generationID]`: Will check the status of the job.  If completed, it will automatically fire the getImage process.  
3. `!getimage [generationID]`: Will save the image locally and post the link to the image in chat.  
4. `!yugi [generationID]`: Will run the script to create and save the Yugioh card, and fire off the socket emit to trigger the website animation

Jobs can also be canceled via  `!canceljob [generationID]`

The broadcaster can output information on models by using `!checkmodel [model name]`. This will perform a fuzzy search by default.

## Online job monitor
Heading to `http://[address]:[port]/jobmonitor` will take you to the online job monitor, which will show information specific to active jobs (username of requestor, position in queue, ETA, and prompt).  This can be added as a browser source in OBS.

## Online card gallery
Heading to `http://[address]:[port]/images` will take you to the card gallery, where you will see all of the generated cards.  Clicking on them will take you through to the full-sized version.
