#Conjurebo
This script combines AI_Horde and NodeJS to allow users in Twitch to create fake Yugioh cards using AI

## Setting up:
Edit the .env_template file to suit your needs.  Save as `.env`

## How to start the bot:
`node conjure-server.js`

## Setting up in OBS:
Create a browser source that points to the address and port that you configured in your `.env` file

## How to use in chat:
Twitch chat fires off any of the given commands and a prompt.  The script will handle the rest.

Negative prompts can be added by entering `###` followed by whatever negative prompts you want (ie: !conjure a person ###extra fingers, missign fingers, disfigured hand)

The broadcaster has the ability to manually process a job via `!initjob`, `!checkjob [generationID]`, `!getimage [generationID]`
