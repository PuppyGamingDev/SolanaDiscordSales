# Solana Discord Webhook Sales Bot
### Initial Setup
First you will need to install the Node.js modules used in this script
```
npm i @solana/web3.js @metaplex/js axios dotenv
```
Also create a new file in the directory called `.env` (literally just a filetype as the name). In the .env file, copy/paste these values and populate them with your values
```
DISCORD_URL=
PROJECT_ADDRESS=
```
For `DISCORD_URL` create a new channel that you want your sales to be posted in, then go to Server Settings > Integrations > Create Webhook. Choose a name/image for it and select the new channel from the drop down then click to Copy the URL and paste it after the '=' for `DISCORD_URL`

For `PROJECT_ADDRESS` on the metadata for one of your collection, on the part for creators, copy the address for the first listed creator and paste it after the '=' for `PROJECT_ADDRESS`

### How To Use
Simply type `node sales_bot.js` into your console and it'll start monitoring for any new transaction signatures on ME and SolSea and any new sale will be posted in your new channel. 

#
##### Credits to the original guide, I simply modified it to my liking.
[Click here for Medium article of original source](https://medium.com/geekculture/building-an-nft-sales-bot-with-javascript-and-solana-3d7add28f995)