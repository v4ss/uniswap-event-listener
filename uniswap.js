require("dotenv").config();
const { ethers } = require("ethers");

const INFURA_MAINNET_URL = process.env.INFURA_MAINNET_URL;
const INFURA_KEY = process.env.INFURA_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;
const PRIV_KEY = process.env.PRIV_KEY;
const PUB_KEY = process.env.PUB_KEY;

const uniswapFactoryV2Address = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const teamFinanceLockAddress = "0xE2fE530C047f2d85298b07D9333C05737f1435fB";
const unicryptAddress = "0x663A5C229c09b049E36dCc11a9B0d4a8Eb9db214";
const pinkLockV2Address = "0x71B5759d73262FBb223956913ecF4ecC51057641";

const WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

// const provider = new ethers.providers.JsonRpcProvider(
//   `https://mainnet.infura.io/v3/${INFURA_KEY}`
// );
const provider = new ethers.providers.WebSocketProvider(
  `wss://mainnet.infura.io/ws/v3/${INFURA_KEY}`
);

const wallet = new ethers.Wallet(PRIV_KEY, provider);
const factoryInstance = new ethers.Contract(
  uniswapFactoryV2Address,
  [
    "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
  ],
  wallet
);

// locker contract instance
const teamFinanceLockInstance = new ethers.Contract(
  teamFinanceLockAddress,
  [
    "event Deposit(uint256 id, address indexed tokenAddress, address indexed withdrawalAddress, uint256 amount, uint256 unlockTime)",
    "event LockDurationExtended(uint256 id, uint256 unlockTime)",
  ],
  wallet
);

const unicryptInstance = new ethers.Contract(
  unicryptAddress,
  [
    "event onDeposit(address lpToken, address user, uint256 amount, uint256 lockDate, uint256 unlockDate)",
  ],
  wallet
);

const pinkLockV2Instance = new ethers.Contract(
  pinkLockV2Address,
  [
    "event LockAdded(uint256 indexed id, address token, address owner, uint256 amount, uint256 unlockDate)",
  ],
  wallet
);

const getBalance = async () => {
  const balance = await provider.getBalance(PUB_KEY);
  console.log(`Your balance is: ${balance.toBigInt()}`);
};

const getTotalSupply = async (contractAddress) => {
  const res = await fetch(
    `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${contractAddress}&apikey=${ETHERSCAN_KEY}`
  );
  if (res.ok) {
    const data = await res.json();
    console.log(`Total Supply: ${data.result}`);
  }
};

const getContractAbi = async (contractAddress) => {
  const res = await fetch(
    `https://api.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_KEY}`
  );
  if (res.ok) {
    const data = await res.json();
    if (data.status) {
      console.log("Contract is Verified!");
    }
  }
};

const getTotalLPToken = async (pairAddress) => {
  const res = await fetch(
    `https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=${pairAddress}&apikey=${ETHERSCAN_KEY}`
  );
  if (res.ok) {
    const data = await res.json();
    console.log(`Total LP Token : ${parseInt(data.result)}`);
    return parseInt(data.result);
  }
};

const getWETHinPairAddress = async (pairAddress) => {
  const res = await fetch(
    `https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${WETHAddress}&address=${pairAddress}&tag=latest&apikey=${ETHERSCAN_KEY}`
  );
  if (res.ok) {
    const data = await res.json();
    console.log(`Amount of WETH in ${pairAddress} : ${data.result}`);
    return parseInt(data.result);
  }
};

const getWETHLocked = async (pairAddress, lpTokenAmount) => {
  const amount =
    (lpTokenAmount * (await getWETHinPairAddress(pairAddress))) /
    (await getTotalLPToken(pairAddress));
  console.log(`Amount Locked: ${amount}`);
  return parseInt(amount);
};

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
    await getTotalSupply(token0);
    await getContractAbi(token0);
    const totalLPToken0 = await getTotalLPToken(pairAddress);
    const WETHamountInPairAddress = await getWETHinPairAddress(pairAddress);
  } else if (token1 != WETHAddress) {
    await getTotalSupply(token1);
    await getContractAbi(token1);
    const totalLPToken1 = await getTotalLPToken(pairAddress);
    const WETHamountInPairAddress = await getWETHinPairAddress(pairAddress);
  } else {
    console.log("no WETH detected in the pair");
  }
});

// team finance LP token locked event listener
teamFinanceLockInstance.on(
  "Deposit",
  async (id, tokenAddress, withdrawalAddress, amount, unlockTime) => {
    console.log(`
  ====================================
  New Deposit detected on Team Finance
  ====================================
  id: ${id}
  token pair: ${tokenAddress}
  amount: ${amount}
  unlock time: ${unlockTime}
  `);
  }
);

// unicrypt LP token locked event listener
unicryptInstance.on(
  "onDeposit",
  async (lpToken, user, amount, lockDate, unlockDate) => {
    console.log(`
  =======================
  New Deposit on Unicrypt
  =======================
  token pair: ${lpToken}
  amount: ${amount}
  unlock date: ${unlockDate}
  `);
  }
);

// pink v2 LP token locked event listener
pinkLockV2Instance.on(
  "LockAdded",
  async (id, token, owner, amount, unlockDate) => {
    console.log(`
  =======================
  New Deposit on PinkV2
  =======================
  id: ${id}
  token pair: ${token}
  amount: ${amount}
  unlock date: ${unlockDate}
  `);
  }
);
