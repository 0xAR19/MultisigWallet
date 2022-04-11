const Multisig = artifacts.require("MultisigWallet");

module.exports = function (deployer) {
  deployer.deploy(Multisig);
};
