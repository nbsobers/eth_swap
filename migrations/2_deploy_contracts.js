const EthSwap = artifacts.require("EthSwap");
const Token = artifacts.require("Token");

module.exports = async function(deployer) {
  // Deploy Token
  await deployer.deploy(Token);
  const token = await Token.deployed();

  // Deploy EthSwap
  await deployer.deploy(EthSwap, token.address);
  const ethSwap = await EthSwap.deployed();

  console.log("token.address=>", token.address);
  const balance = await token.balanceOf(
    "0x8503bbd6fA8554e513E992faa85D88Ce1b2820A5"
  );
  console.log("balance==>", balance.toString());
  //await token.transfer(ethSwap.address, balance.toString());

  await token.transfer(ethSwap.address, "1000000000000000000000000");
};
