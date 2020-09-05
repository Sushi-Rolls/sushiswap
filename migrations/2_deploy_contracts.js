const SushiToken = artifacts.require('SushiToken');
const MasterChef = artifacts.require('MasterChef');
const MockERC20 = artifacts.require('MockERC20');
const UniswapV2Pair = artifacts.require('UniswapV2Pair');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const Migrator = artifacts.require('Migrator');

module.exports = function (deployer, network, [ alice, bob, carol, dev, minter ]) {
  if (network === 'kovan') {
    console.log('Deploying contracts to Kovan.');
    deployer.then(async () => {

      // Deploy contracts necessary for testing the SushiDex.
      let sushi = await deployer.deploy(SushiToken, { from: alice });
      let chef = await deployer.deploy(MasterChef, sushi.address, dev, '1000', '0', '1000', { from: alice });
      let tokenOne = await MockERC20.new('TokenOne', 'LP1', '10000000000', { from: minter });
      let tokenTwo = await MockERC20.new('TokenTwo', 'LP2', '10000000000', { from: minter });
      await tokenOne.transfer(alice, '1000', { from: minter });
      await tokenOne.transfer(bob, '1000', { from: minter });
      await tokenOne.transfer(carol, '1000', { from: minter });
      await tokenTwo.transfer(alice, '1000', { from: minter });
      await tokenTwo.transfer(bob, '1000', { from: minter });
      await tokenTwo.transfer(carol, '1000', { from: minter });

      // Deploy contracts necessary for testing the Migrator.
      let factoryOne = await UniswapV2Factory.new(alice, { from: alice });
      let factoryTwo = await UniswapV2Factory.new(alice, { from: alice });
      let linkedPairOneContract = await factoryOne.createPair(tokenOne.address, tokenTwo.address);
      let linkedPairOneAddress = linkedPairOneContract.logs[0].args.pair;
      let linkedPairOne = await UniswapV2Pair.at(linkedPairOneAddress);
      let linkedPairTwoContract = await factoryTwo.createPair(tokenOne.address, tokenTwo.address);
      let linkedPairTwoAddress = linkedPairTwoContract.logs[0].args.pair;
      let linkedPairTwo = await UniswapV2Pair.at(linkedPairTwoAddress);
      let migrator = await deployer.deploy(Migrator, chef.address, factoryOne.address, factoryTwo.address, '0');
      await sushi.transferOwnership(chef.address, { from: alice });
      await chef.add('100', linkedPairOne.address, true, { from: alice });
    });
  }
};
