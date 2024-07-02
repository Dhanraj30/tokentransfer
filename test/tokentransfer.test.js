//import "@openzeppelin/test-helpers";
const expect = require("chai");//import { expect } from "chai";
const ethers = require("hardhat");//import { ethers } from "hardhat";

describe("TokenTransferContract", function () {
  let owner, user1, user2, token, tokenTransferContract;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy ERC20 token
    const ERC20 = await ethers.getContractFactory("ERC20Mock");
    token = await ERC20.deploy("Test Token", "TT", 1000000);
    await token.deployed();

    // Deploy TokenTransferContract
    const TokenTransferContract = await ethers.getContractFactory("TokenTransferContract");
    tokenTransferContract = await TokenTransferContract.deploy();
    await tokenTransferContract.deployed();

    // Add the ERC20 token to the verified tokens list
    await tokenTransferContract.addVerifyToken(token.address);
  });

  describe("transfer", function () {
    it("should emit TransactionCompleted event with correct parameters", async () => {
      const amount = 100;
      const message = "Test transfer";

      // Approve the transfer from user1 to the contract
      await token.approve(tokenTransferContract.address, amount);

      // Listen for TransactionCompleted event
      const filter = tokenTransferContract.filters.TransactionCompleted(
        user1.address,
        user2.address,
        amount,
        message
      );
      const event = await expect(
        tokenTransferContract.transfer(token.address, user2.address, amount, message)
      ).to.emit(tokenTransferContract, filter);

      // Verify the emitted event parameters
      expect(event.args.sender).to.equal(user1.address);
      expect(event.args.receiver).to.equal(user2.address);
      expect(event.args.amount).to.equal(amount);
      expect(event.args.message).to.equal(message);
    });

    it("should revert if sender does not have enough balance", async () => {
      const amount = 1000001;
      const message = "Test transfer";

      // Approve the transfer from user1 to the contract
      await token.approve(tokenTransferContract.address, amount);

      await expect(
        tokenTransferContract.transfer(token.address, user2.address, amount, message)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("should revert if transfer fails", async () => {
      const amount = 100;
      const message = "Test transfer";

      // Do not approve the transfer from user1 to the contract
      await expect(
        tokenTransferContract.transfer(token.address, user2.address, amount, message)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("should revert if token is not verified", async () => {
      const amount = 100;
      const message = "Test transfer";

      // Deploy a new ERC20 token
      const ERC20 = await ethers.getContractFactory("ERC20Mock");
      const newToken = await ERC20.deploy("New Test Token", "NTT", 1000000);
      await newToken.deployed();

      // Approve the transfer from user1 to the contract
      await newToken.approve(tokenTransferContract.address, amount);

      await expect(
        tokenTransferContract.transfer(newToken.address, user2.address, amount, message)
      ).to.be.revertedWith("Token is not verified");
    });

    it("should revert if called by a non-owner", async () => {
      const amount = 100;
      const message = "Test transfer";

      // Approve the transfer from user1 to the contract
      await token.approve(tokenTransferContract.address, amount);

      await expect(
        tokenTransferContract.connect(user2).transfer(token.address, user2.address, amount, message)
      ).to.be.revertedWith("Only owner call this function");
    });
  });
});