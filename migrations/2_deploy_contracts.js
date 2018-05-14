var Wall = artifacts.require("Wall");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(Wall);
};