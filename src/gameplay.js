var Gameplay = function () {};
Gameplay.prototype = {
  developers: null,
  player: null,

  developerCount: 6,
  playerMoveSpeed: 100,
  playerCloseDistance: 8,

  targetPlayerIndex: 0,

  create: function () {
    this.game.stage.backgroundColor = '#DDDDDD';

    this.player = this.game.add.sprite(64, 64, null);
    this.game.physics.arcade.enable(this.player);
    this.player.body.setSize(16, 16);

    this.developers = [];
    for (var i = 0; i < this.developerCount; i++) {
      var newDev = this.game.add.sprite(~~(this.game.width / 2 + 100 * (Math.cos(i / this.developerCount * Math.PI * 2))), ~~(this.game.height / 2 + 100 * (Math.sin(i / this.developerCount * Math.PI * 2))), null);
      this.game.physics.arcade.enable(newDev);
      newDev.body.setSize(16, 16);

      this.developers.push(newDev);
    }
  },
  update: function () {
    // move toward the next developer
    if (this.game.input.keyboard.isDown(Phaser.KeyCode.SPACEBAR)) {
      Phaser.Point.subtract(this.developers[this.targetPlayerIndex].position, this.player.position, this.player.body.velocity);
      this.player.body.velocity = Phaser.Point.normalize(this.player.body.velocity);
      this.player.body.velocity.setMagnitude(this.playerMoveSpeed);
    } else {
      this.player.body.velocity.set(0);
    }

    // if the player gets super close to the developer, switch the target to the next one
    if (Phaser.Point.distance(this.player.position, this.developers[this.targetPlayerIndex].position) < this.playerCloseDistance) {
      this.targetPlayerIndex = (this.targetPlayerIndex + 1) % this.developers.length;
    }

    // round position values later
  },
  render: function () {
    this.game.debug.body(this.player, 'blue');

    this.developers.forEach(function (dev) {
      this.game.debug.body(dev, 'green');
    }, this);
  },
  shutdown: function () {
    this.player = null;
    this.developers = null;

    this.targetPlayerIndex = 0;
  }
};