const hre = require("hardhat");

async function main() {
    const transfer = await hre.ethers.getContractFactory("tokenTransfer");
    const token = await transfer.deploy();

    await token.deployed();
    console.log(` tokenTransfer: ${token.address}`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});