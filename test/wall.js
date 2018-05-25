var Wall = artifacts.require("Wall"),
  _ = require('lodash');

  function add (a, b) {
    let res = '', c = 0
    a = a.split('')
    b = b.split('')
    while (a.length || b.length || c) {
      c += ~~a.pop() + ~~b.pop()
      res = c % 10 + res
      c = c > 9
    }
    return res
  }

  async function didComplete(callback, args) {
    try {
      await callback.apply(this, args);
      return true;
    } catch (e) {
      return false;
    }
  }

  function color(r, g, b) {
    return {r, g, b};
  }

  function ostr(a) {
    return JSON.stringify(a);
  }

  function cstr(r, g, b) {
    return ostr(color(r.toNumber(), g.toNumber(), b.toNumber()));
  }

  contract('Wall', async (accounts) => {
    var wall;

    beforeEach('deploy new contract', async () => {
      wall = await Wall.new();
    });

    it('should allow users to write on a wall', async () => {
      let text = 'This is a line';
      let col = color(12, 200, 100);
      let font = 3;
      await wall.createPost(text, font, col.r, col.g, col.b, {from: accounts[1]});
      let post = await wall.posts.call(0);
      assert.equal(post[0].valueOf(), text, 'text is set');
      assert.equal(post[1].valueOf(), font, 'font is set');
      assert.equal(cstr(post[2], post[3], post[4]), ostr(col), 'color is set');
      assert.equal(post[5].valueOf(), accounts[1], 'address is set');
    });

    it('should allow users to update post', async () => {
      let text = 'This is a second line';
      let col = color(12, 200, 100);
      let font = 3;
      await wall.createPost('Some text', 5, 0, 12, 99, {from: accounts[1]});
      await wall.updatePost(0, text, font, col.r, col.g, col.b, {from: accounts[1]});
      let post = await wall.posts.call(0);
      assert.equal(post[0].valueOf(), text, 'text is set');
      assert.equal(post[1].valueOf(), font, 'font is set');
      assert.equal(cstr(post[2], post[3], post[4]), ostr(col), 'color is set');
      assert.equal(post[5].valueOf(), accounts[1], 'address is set');
    });

    it('should prevent others from changing a post', async () => {
      let text = 'This is a line';
      let col = color(12, 200, 100);
      let font = 1;
      await wall.createPost(text, font, col.r, col.g, col.b, {from: accounts[1]});
      let completed = await didComplete(wall.updatePost, [0, 'Some text', 5, 12, 200, 100, {from: accounts[2]}]);
      assert.isFalse(completed, 'prevented another from changing post');
      let post = await wall.posts.call(0);
      assert.equal(post[0].valueOf(), text, 'text is set');
      assert.equal(post[1].valueOf(), font, 'font is set');
      assert.equal(cstr(post[2], post[3], post[4]), ostr(col), 'color is set');
      assert.equal(post[5].valueOf(), accounts[1], 'address is set');
    });
  
    it('should allow a user to sell a post', async () => {
      let text = 'This is a line';
      let col = color(12, 200, 100);
      let font = 1;
      let cost = 500;
      await wall.createPost(text, font, col.r, col.g, col.b, {from: accounts[1]});
      let resp = await wall.sellPost(0, cost, {from: accounts[1]});
      let logIndex = _.findIndex(resp.logs, {event: 'NewListening'});
      assert.notEqual(logIndex, -1, 'new listening event');
      assert.equal(resp.logs[logIndex].args.index.toNumber(), 0, 'index for sale');
      assert.equal(resp.logs[logIndex].args.price.toNumber(), cost, 'price for sale');

      let sellerBalance = await web3.eth.getBalance(accounts[1]);

      resp = await wall.buyPost(0, {from: accounts[2], value: cost});
      logIndex = _.findIndex(resp.logs, {event: 'SoldPost'});
      assert.notEqual(logIndex, -1, 'sold event');
      assert.equal(resp.logs[logIndex].args.index.toNumber(), 0, 'index for sale');
      assert.equal(resp.logs[logIndex].args.price.toNumber(), cost, 'price for sale');

      let post = await wall.posts.call(0);
      assert.equal(post[5].valueOf(), accounts[2], 'address is set');

      let sellerNewBalance = await web3.eth.getBalance(accounts[1]);
      assert.equal(sellerNewBalance.valueOf(), add(sellerBalance.valueOf(), Math.floor(cost * .99) + ""), 'funds transfered');

      let contractBalance = await web3.eth.getBalance(wall.address);
      assert.equal(contractBalance.valueOf(), Math.floor(cost * .01) + "", 'contract held funds');
    });

    it('should not allow user to buy post that isnt for sale', async () => {
      await wall.createPost('Some text', 5, 12, 200, 100, {from: accounts[1]});
      let completed = await didComplete(wall.buyPost, [0, {from: accounts[2], value: 500}]);
      assert.isFalse(completed, 'cannot buy post that isnt for sale');
    });

    it('should not allow user to sell a post they dont own', async () => {
      await wall.createPost('Some text', 5, 12, 200, 100, {from: accounts[1]});
      let completed = await didComplete(wall.sellPost, [0, 500, {from: accounts[2]}]);
      assert.isFalse(completed, 'cannot buy post that isnt for sale');
    });

    it('should reject strings that are too long', async () => {
      let completed = await didComplete(wall.createPost, [_.times(101, _.constant('a')).join(''), 5, 12, 200, 100, {from: accounts[1]}]);
      assert.isFalse(completed, 'cannot post long strings');
    });

    it('should allow a user to delete a sale', async () => {
      await wall.createPost('Some text', 5, 12, 200, 100, {from: accounts[1]});
      await wall.sellPost(0, 500, {from: accounts[1]});
      let price = await wall.forSale.call(0);
      assert.equal(price.toNumber(), 500, 'sale open');

      await wall.closePostSale(0, {from: accounts[1]});
      price = await wall.forSale.call(0);
      assert.equal(price.toNumber(), 0, 'sale closed');
    });

    it('should have a post get method', async () => {
      await wall.createPost('Some text', 5, 12, 200, 100, {from: accounts[1]});
      await wall.sellPost(0, 500, {from: accounts[1]});
      let post = await wall.getPost.call(0);
      assert.equal(post[0].valueOf(), 'Some text', 'text retrieved');
      assert.equal(post[6].toNumber(), 500, 'sale price retrieved');
    });

    it('should allow the owner to withdraw any funds', async() => {
      await web3.eth.sendTransaction({from: accounts[1], to: wall.address, value:web3.toWei(1, "ether")});
      let balance1 = await web3.eth.getBalance(accounts[0]);
      await wall.withdraw(web3.toWei(1, "ether"), {from: accounts[0]});
      let balance2 = await web3.eth.getBalance(accounts[0]);
      assert.isAbove(balance2.toNumber(), balance1.toNumber(), 'balance added');
    });

    it('should only allow the owner to withdraw any funds', async() => {
      await web3.eth.sendTransaction({from: accounts[1], to: wall.address, value:web3.toWei(1, "ether")});
      let completed = await didComplete(wall.withdraw, web3.toWei(1, "ether"), {from: accounts[2]});
      assert.isFalse(completed, 'cannot withdraw any funds');
    });
  });