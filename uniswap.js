require("dotenv").config();
const { ethers } = require("ethers");

const INFURA_MAINNET_URL = process.env.INFURA_MAINNET_URL;
const INFURA_KEY = process.env.INFURA_KEY;
const PRIV_KEY = process.env.PRIV_KEY;
const PUB_KEY = process.env.PUB_KEY;
const uniswapFactoryV2Address = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

// const provider = new ethers.providers.JsonRpcProvider(
//   `https://mainnet.infura.io/v3/${INFURA_KEY}`
// );
const provider = new ethers.providers.WebSocketProvider(
  `wss://mainnet.infura.io/ws/v3/${INFURA_KEY}`
);

const getBalance = async () => {
  const balance = await provider.getBalance(PUB_KEY);
  console.log(`Your balance is: ${balance.toBigInt()}`);
};

const wallet = new ethers.Wallet(PRIV_KEY, provider);
const factoryInstance = new ethers.Contract(
  uniswapFactoryV2Address,
  [
    "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
  ],
  wallet
);

// Created pair event listener
factoryInstance.on("PairCreated", async (token0, token1, pairAddress) => {
  console.log(`
  New Pair detected
  =================
  token0: ${token0}
  token1: ${token1}
  pairAddress: ${pairAddress}
  `);
  if (token0 != WETHAddress) {
    console.log("token0 is not WETH");
  } else if (token1 != WETHAddress) {
    console.log("token1 is not WETH");
  } else {
    console.log("no WETH detected in the pair");
  }
});
