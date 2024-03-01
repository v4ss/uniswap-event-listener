// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
pragma experimental ABIEncoderV2;

interface IERC20 {
    function transfer(address _to, uint256 _amount) external returns (bool);
}

contract Multicall {
    // owner f contract
    address private owner;

    // structure call
    struct Call {
        address target;
        bytes callData;
        uint256 ethToSell;
        uint256 gasToUse;
    }

    // set owner
    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    // multicall returns
    //  blockNumber: number of the block
    //  returnData: [calls results]
    //  gasUsed: [gas used by each call]
    function aggregate(
        Call[] memory calls
    )
        public
        onlyOwner
        returns (
            uint256 blockNumber,
            bytes[] memory returnData,
            uint256[] memory gasUsed
        )
    {
        blockNumber = block.number;
        returnData = new bytes[](calls.length);
        gasUsed = new uint256[](calls.length);
        uint256 startGas = gasleft();
        bytes memory ris = hex"00";
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.call{
                value: calls[i].ethToSell,
                gas: calls[i].gasToUse
            }(calls[i].callData);
            if (!success) {
                ret = ris;
            }
            returnData[i] = ret;
            gasUsed[i] = startGas - gasleft();
            startGas = gasleft();
        }
    }

    // helpers
    function getEthBalance(address addr) public view returns (uint256 balance) {
        balance = addr.balance;
    }

    function getBlockHash(
        uint256 blockNumber
    ) public view returns (bytes32 blockHash) {
        blockHash = blockhash(blockNumber);
    }

    function getLastBlockHash() public view returns (bytes32 blockHash) {
        blockHash = blockhash(block.number - 1);
    }

    function getCurrentBlockTimestamp()
        public
        view
        returns (uint256 timestamp)
    {
        timestamp = block.timestamp;
    }

    function currentBlockDifficulty() public view returns (uint256 difficulty) {
        difficulty = block.prevrandao;
    }

    function getCurrentGasLimit() public view returns (uint256 gasLimit) {
        gasLimit = block.gaslimit;
    }

    function getCurrentBlockCoinbase() public view returns (address coinbase) {
        coinbase = block.coinbase;
    }

    // allow the contract to receive funds
    receive() external payable {}

    function rescueETH(uint256 amount) external onlyOwner {
        payable(msg.sender).transfer(amount);
    }

    function withdrawToken(
        address _tokenContract,
        uint256 _amount
    ) external onlyOwner {
        IERC20 tokenContract = IERC20(_tokenContract);
        tokenContract.transfer(msg.sender, _amount);
    }
}
