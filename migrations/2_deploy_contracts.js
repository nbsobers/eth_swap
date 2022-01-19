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
    "0x891A5a1C0DCc822613350341d52139731a769512"
  );
  console.log("balance==>", balance.toString());
  await token.transfer(ethSwap.address, balance.toString());
};
