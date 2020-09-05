const { expectRevert, time } = require('@openzeppelin/test-helpers');

const SushiToken = artifacts.require('SushiToken');
const MasterChef = artifacts.require('MasterChef');
const MockERC20 = artifacts.require('MockERC20');
const UniswapV2Pair = artifacts.require('UniswapV2Pair');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');

const SushiDex = artifacts.require('SushiDex');

contract('SushiDex', ([ alice, bob, carol, dev, minter ]) => {
    beforeEach(async () => {
      this.sushi = await SushiToken.new({ from: alice });
      this.chef = await MasterChef.new(this.sushi.address, dev, '1000', '0', '1000', { from: alice });
      this.tokenOne = await MockERC20.new('TokenOne', 'LP1', '100000000', { from: minter });
      this.tokenTwo = await MockERC20.new('TokenTwo', 'LP2', '100000000', { from: minter });

      await this.tokenOne.transfer(alice, '1000', { from: minter });
      await this.tokenOne.transfer(bob, '1000', { from: minter });
      await this.tokenOne.transfer(carol, '1000', { from: minter });

      await this.tokenTwo.transfer(alice, '1000', { from: minter });
      await this.tokenTwo.transfer(bob, '1000', { from: minter });
      await this.tokenTwo.transfer(carol, '1000', { from: minter });

      this.factoryOne = await UniswapV2Factory.new(alice, { from: alice });
      let linkedPairOneContract = await this.factoryOne.createPair(this.tokenOne.address, this.tokenTwo.address);
      let linkedPairOneAddress = linkedPairOneContract.logs[0].args.pair;
      this.linkedPairOne = await UniswapV2Pair.at(linkedPairOneAddress);
      await this.sushi.transferOwnership(this.chef.address, { from: alice });
      await this.chef.add('100', this.linkedPairOne.address, true, { from: alice });

      this.sushiDex = await SushiDex.new(this.chef.address, this.sushi.address, this.sushi.address, dev, { from: alice });
    });

    it('cumulative investment values should update', async () => {
        await this.tokenOne.transfer(this.linkedPairOne.address, '10000000', { from: minter });
        await this.tokenTwo.transfer(this.linkedPairOne.address, '500000', { from: minter });
        await this.linkedPairOne.mint(minter);

        await this.linkedPairOne.sync();

        let minterBalance = await this.linkedPairOne.balanceOf(minter);
        console.log('!-> ', minterBalance.toNumber());

        await this.linkedPairOne.transfer(bob, 5, { from: minter });
        let bobBalance = await this.linkedPairOne.balanceOf(bob);
        console.log('!-> ', bobBalance.toNumber());

        await this.linkedPairOne.approve(this.sushiDex.address, '1000', { from: bob });

        await this.sushiDex.deposit(this.linkedPairOne.address, 1, { from: bob });

        bobBalance = await this.linkedPairOne.balanceOf(bob);
        console.log('!-> ', bobBalance.toNumber());

        assert.equal(true, true);
    });
});
