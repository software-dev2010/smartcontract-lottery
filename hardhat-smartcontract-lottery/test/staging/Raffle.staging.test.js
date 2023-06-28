const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle, raffleEntranceFee, deployer;

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              raffle = await ethers.getContract("Raffle", deployer);
              raffleEntranceFee = await raffle.getEntranceFee();
          });

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async () => {
                  // just enter the raffle because chainlink keepers and chainlink vrf are going to be the ones to kick of this lottery
                  const startingTimeStamp = await raffle.getLatestTimeStamp();
                  const accounts = await ethers.getSigners();
                  // setup the listener before entering the raffle
                  // just in case the blockchain moves really fast
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!");
                          try {
                              const recentWiner = await raffle.getRecentWinner();
                              const raffleState = await raffle.getRaffleState();
                              const endingTimeStamp = await raffle.getLatestTimeStamp();

                              await expect(raffle.getPlayer(0)).to.be.reverted;
                              assert.equal(recentWiner.toString(), accounts[0].address);
                              assert.equal(raffleState, 0);
                              assert(endingTimeStamp > startingTimeStamp);
                              resolve();
                          } catch (error) {
                              console.log(error);
                              reject(error);
                          }
                      });
                      // entering the raffle
                      await raffle.enterRaffle({ value: raffleEntranceFee });
                      const winnerStartingBalance = await accounts[0].getBalance();
                      // this code wont complete until this listener has finished listeneing
                  });
              });
          });
      });
