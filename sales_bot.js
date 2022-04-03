const solanaWeb3 = require('@solana/web3.js');
const { Connection, programs } = require('@metaplex/js');
const axios = require('axios');
require("dotenv").config();


const projectPubKey = new solanaWeb3.PublicKey(process.env.PROJECT_ADDRESS);
const url = solanaWeb3.clusterApiUrl('mainnet-beta');
const solanaConnection = new solanaWeb3.Connection(url, 'confirmed');
const metaplexConnection = new Connection('mainnet-beta');
const { metadata: { Metadata } } = programs;
const pollingInterval = 10000; // ms
const marketplaceMap = {
    "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K": "Magic Eden",
    "617jbWo616ggkDxvW1Le8pV38XLbVSyWY8ae6QUmGBAU": "Solsea",
};

const runSalesBot = async () => {
  console.log("starting sales bot...");
  const mostRecentSignature = await solanaConnection.getSignaturesForAddress(
    projectPubKey,
    { limit: 1 }
  );
  let signatures;
  let lastKnownSignature;
  const options = { until: mostRecentSignature[0].signature };
  while (true) {
    try {
      signatures = await solanaConnection.getSignaturesForAddress(
        projectPubKey,
        options
      );
      if (!signatures.length) {
        console.log("polling...");
        await timer(pollingInterval);
        continue;
      }
    } catch (err) {
      console.log("error fetching signatures: ", err);
      continue;
    }

    for (let i = signatures.length - 1; i >= 0; i--) {
      try {
        let { signature } = signatures[i];
        const txn = await solanaConnection.getTransaction(signature);
        if (txn.meta && txn.meta.err != null) {
          continue;
        }

        const dateString = new Date(txn.blockTime * 1000).toLocaleString();
        const price =
          Math.abs(txn.meta.preBalances[0] - txn.meta.postBalances[0]) /
          solanaWeb3.LAMPORTS_PER_SOL;
        const accounts = txn.transaction.message.accountKeys;
        const marketplaceAccount = accounts[accounts.length - 1].toString();

        if (marketplaceMap[marketplaceAccount]) {
          const metadata = await getMetadata(
            txn.meta.postTokenBalances[0].mint
          );
          if (!metadata) {
            console.log("couldn't get metadata");
            continue;
          }

          printSalesInfo(
            dateString,
            price,
            signature,
            metadata.name,
            marketplaceMap[marketplaceAccount],
            metadata.image,
          );
          await postSaleToDiscord(
            metadata.name,
            price,
            dateString,
            signature,
            metadata.image,
            txn.meta.postTokenBalances[0].owner,
          );
        } else {
          console.log("not a supported marketplace sale");
        }
      } catch (err) {
        console.log("error while going through signatures: ", err);
        continue;
      }
    }

    lastKnownSignature = signatures[0].signature;
    if (lastKnownSignature) {
      options.until = lastKnownSignature;
    }
  }
};
runSalesBot();

const printSalesInfo = (
  date,
  price,
  signature,
  title,
  marketplace,
  imageURL
) => {
  console.log("-------------------------------------------");
  console.log(`Sale at ${date} ---> ${price} SOL`);
  console.log("Signature: ", signature);
  console.log("Name: ", title);
  console.log("Image: ", imageURL);
  console.log("Marketplace: ", marketplace);
};

const timer = (ms) => new Promise((res) => setTimeout(res, 5000));

const getMetadata = async (tokenPubKey) => {
  try {
    const addr = await Metadata.getPDA(tokenPubKey);
    const resp = await Metadata.load(metaplexConnection, addr);
    const { data } = await axios.get(resp.data.data.uri);

    return data;
  } catch (error) {
    console.log("error fetching metadata: ", error);
  }
};

const postSaleToDiscord = (title, price, date, signature, imageURL, buyer) => {
  axios.post(process.env.DISCORD_URL, {
    embeds: [
      {
        title: `New Sale!`,
        description: `${title}`,
        fields: [
          {
            name: "Price",
            value: `${price} SOL`,
            inline: true,
          },
          {
            name: "Date",
            value: `${date}`,
            inline: true,
          },
          {
            name: "Buyer",
            value: `${buyer}`,
          },
          {
            name: "Explorer",
            value: `https://explorer.solana.com/tx/${signature}`,
          },
        ],
        image: {
          url: `${imageURL}`,
        },
      },
    ],
  });
};