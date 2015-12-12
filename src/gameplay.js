var Gameplay = function () {};
Gameplay.prototype = {
  motivateKey: null,

  developers: null,
  player: null,

  developerCount: 6,
  playerMoveSpeed: 100,
  playerCloseDistance: 8,
  initialDevMotivation: 20,
  baseDevMotiovationScale: 0.7,
  maxDevMotivation: 20,
  motivationPerPress: 1.2,

  targetPlayerIndex: 0,

  motivateDev: function () {
    if (this.game.input.keyboard.isDown(Phaser.KeyCode.X)) {
      return;
    }

    var closestDev = this.developers[this.targetPlayerIndex];
    for (var i = 0; i < this.developers.length; i++) {
      if (Phaser.Point.distance(this.player.position, this.developers[i].position) < Phaser.Point.distance(this.player.position, closestDev.position) ) {
        closestDev = this.developers[i];
      }
    }

    if (Phaser.Point.distance(this.player.position, closestDev.position) < 32) {
      closestDev.motivation = Math.min(this.maxDevMotivation, closestDev.motivation + this.motivationPerPress);
    }
  },

  create: function () {
    this.game.stage.backgroundColor = '#DDDDDD';

    this.player = this.game.add.sprite(64, 64, null);
    this.game.physics.arcade.enable(this.player);
    this.player.body.setSize(16, 16);

    var motivateKey = this.game.input.keyboard.addKey(Phaser.KeyCode.C);
    motivateKey.onDown.add(this.motivateDev, this);

    this.developers = [];
    for (var i = 0; i < this.developerCount; i++) {
      var newDev = this.game.add.sprite(~~(this.game.width / 2 + 100 * (Math.cos(i / this.developerCount * Math.PI * 2))), ~~(this.game.height / 2 + 100 * (Math.sin(i / this.developerCount * Math.PI * 2))), null);
      this.game.physics.arcade.enable(newDev);
      newDev.body.setSize(16, 16);
      newDev.motivation = 20;
      newDev.motivationScale = this.baseDevMotiovationScale;

      this.developers.push(newDev);
    }
  },
  update: function () {
    // move toward the next developer
    if (this.game.input.keyboard.isDown(Phaser.KeyCode.X)) {
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

    this.developers.forEach(function(dev) {
      if (dev.motivation > 0) {
        dev.motivation -= this.game.time.physicsElapsed * dev.motivationScale;
      }
    }, this);

    // round position values later
  },
  render: function () {
    this.game.debug.body(this.player, 'blue');

    this.developers.forEach(function (dev) {
      this.game.debug.geom(new Phaser.Rectangle(dev.x - 8, dev.y - 32, 8, 32), 'black');
      this.game.debug.geom(new Phaser.Rectangle(dev.x - 8, dev.y - 32, 8, 32 * (dev.motivation / 20)), 'red');
      this.game.debug.body(dev, 'green');
    }, this);
  },
  shutdown: function () {
    this.player = null;
    this.developers = null;

    this.targetPlayerIndex = 0;

    this.motivateKey.removeAll();
    this.motivateKey = null;
  }
};