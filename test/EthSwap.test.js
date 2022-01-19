const { assert } = require("chai");
const { default: Web3 } = require("web3");

const Token = artifacts.require("Token");
const EthSwap = artifacts.require("EthSwap");

require("chai")
  .use(require("chai-as-promised"))
  .should();

function tokens(n) {
  return web3.utils.toWei(n, "ether");
}

//contract("EthSwap", (accounts) => {
contract("EthSwap", ([deployer, investor]) => {
  let token, ethSwap;
  //console.log("accounts==>", accounts);
  before(async () => {
    token = await Token.new();
    ethSwap = await EthSwap.new(token.address);
    await token.transfer(ethSwap.address, tokens("1000000"));
    console.log("ethSwap.address=>", ethSwap.address);
  });

  describe("Token deployed", async () => {
    it("contract has name", async () => {
      const name = await token.name();
      assert.equal(name, "DApp Token");
    });

    it("contract token has transferred", async () => {
      const balance = await token.balanceOf(deployer);
      assert.equal(balance.toString(), 0);
    });
  });

  describe("EthSwap deployed", async () => {
    it("contract has name", async () => {
      const name = await ethSwap.name();
      assert.equal(name, "EthSwap Instant Exchange");
    });

    it("contract has token", async () => {
      const balance = await token.balanceOf(ethSwap.address);
      assert.equal(balance, tokens("1000000"));
    });
  });

  describe("buyToken()", async () => {
    let result;
    before(async () => {
      result = await ethSwap.buyTokens({ from: investor, value: tokens("1") });
    });

    it("Allows user to instantly purchase tokens from ethSwap for a fixed price", async () => {
      let investorBalance = await token.balanceOf(investor);
      console.log("investorBalance==>", investorBalance.toString());
      assert.equal(investorBalance.toString(), tokens("100"));

      let ethSwapBalance = await token.balanceOf(ethSwap.address);
      console.log("ethSwapBalance==>", ethSwapBalance.toString());

      let etherBalance = await web3.eth.getBalance(ethSwap.address);
      console.log("etherBalance==>", etherBalance.toString());
      assert.equal(etherBalance.toString(), web3.utils.toWei("1", "Ether"));

      let investorEthrBalance = await web3.eth.getBalance(investor);
      console.log("investorEthrBalance==>", investorEthrBalance.toString());

      console.log("result=>", result.logs[0].args);
    });
  });

  describe("sellToken()", async () => {
    let result;
    before(async () => {
      await token.approve(ethSwap.address, tokens("100"), { from: investor });
      result = await ethSwap.sellTokens(tokens("100"), { from: investor });
    });

    it("Allows user to instantly sell tokens to ethSwap for a fixed price", async () => {
      // Check ethSwap balance after purchase
      let ethSwapBalance;
      ethSwapBalance = await token.balanceOf(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), tokens("1000000"));
      ethSwapBalance = await web3.eth.getBalance(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), web3.utils.toWei("0", "Ether"));

      // Check logs to ensure event was emitted with correct data
      const event = result.logs[0].args;
      assert.equal(event.account, investor);
      assert.equal(event.token, token.address);
      assert.equal(event.amount.toString(), tokens("100").toString());
      assert.equal(event.rate.toString(), "100");

      // FAILURE: investor can't sell more tokens than they have
      await ethSwap.sellTokens(tokens("500"), { from: investor }).should.be
        .rejected;
    });
  });
});
