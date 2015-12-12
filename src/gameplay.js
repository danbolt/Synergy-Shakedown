var Gameplay = function () {};
Gameplay.prototype = {
  motivateKey: null,
  moveKey: null,

  developers: null,
  player: null,

  developerCount: 6,
  playerMoveSpeed: 200,
  playerCloseDistance: 8,
  initialDevMotivation: 20,
  baseDevMotiovationScale: 1.5,
  maxDevMotivation: 20,
  motivationPerPress: 1.5,

  targetPlayerIndex: 0,
  movingForward: false,
  timeSinceLastDownPress: 0,

  motivateDev: function () {
    if (this.game.input.keyboard.isDown(Phaser.KeyCode.X) || this.game.input.gamepad.pad1.isDown(Phaser.Gamepad.BUTTON_5)) {
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

  reverseDirection: function () {
    if (this.timeSinceLastDownPress < 500) {
      this.movingForward = !this.movingForward;

      this.targetPlayerIndex = (this.movingForward ? (this.targetPlayerIndex + 1) : (this.targetPlayerIndex - 1 + this.developers.length)) % this.developers.length;
    }

    this.timeSinceLastDownPress = 0;
  },

  create: function () {
    this.game.stage.backgroundColor = '#DDDDDD';

    this.player = this.game.add.sprite(64, 64, null);
    this.game.physics.arcade.enable(this.player);
    this.player.body.setSize(16, 16);

    this.motivateKey = this.game.input.keyboard.addKey(Phaser.KeyCode.C);
    this.motivateKey.onDown.add(this.motivateDev, this);
    this.moveKey = this.game.input.keyboard.addKey(Phaser.KeyCode.X);
    this.moveKey.onDown.add(this.reverseDirection, this);
    this.game.input.gamepad.onDownCallback = function (buttonCode) { if (buttonCode === 4) { this.motivateDev(); } if (buttonCode === 5) { this.reverseDirection(); } };
    this.game.input.gamepad.callbackContext = this;

    this.developers = [];
    for (var i = 0; i < this.developerCount; i++) {
      var newDev = this.game.add.sprite(~~(this.game.width / 2 + 100 * (Math.cos(i / this.developerCount * Math.PI * 2))), ~~(this.game.height / 2 + 70 * (Math.sin(i / this.developerCount * Math.PI * 2))), null);
      this.game.physics.arcade.enable(newDev);
      newDev.body.setSize(16, 16);
      newDev.motivation = 20;
      newDev.motivationScale = this.baseDevMotiovationScale + Math.random() * 0.45 - 0.234;

      this.developers.push(newDev);
    }

    this.targetPlayerIndex = 0;
    this.movingForward = true;
    this.timeSinceLastDownPress = 0;
  },
  update: function () {
    this.timeSinceLastDownPress += this.game.time.physicsElapsedMS;
    // move toward the next developer
    if (this.game.input.keyboard.isDown(Phaser.KeyCode.X) || this.game.input.gamepad.pad1.isDown(Phaser.Gamepad.BUTTON_5)) {
      var target = this.developers[this.targetPlayerIndex];

      Phaser.Point.subtract(target.position, this.player.position, this.player.body.velocity);
      this.player.body.velocity = Phaser.Point.normalize(this.player.body.velocity);
      this.player.body.velocity.setMagnitude(this.playerMoveSpeed);
    } else {
      this.player.body.velocity.set(0);
    }

    // if the player gets super close to the developer or a developer stops working, switch the target to the next one
    if (this.developers[this.targetPlayerIndex].alive === false || Phaser.Point.distance(this.player.position, this.developers[this.targetPlayerIndex].position) < this.playerCloseDistance) {
      var loopLimiter = 0;
      do {
        this.targetPlayerIndex = (this.movingForward ? (this.targetPlayerIndex + 1) : (this.targetPlayerIndex - 1 + this.developers.length)) % this.developers.length;
        loopLimiter++;
      } while (loopLimiter < this.developers.length && this.developers[this.targetPlayerIndex].alive === false);
    }

    this.developers.forEach(function(dev) {
      if (dev.motivation > 0) {
        dev.motivation -= this.game.time.physicsElapsed * dev.motivationScale;
      } else {
        dev.kill();
      }
    }, this);

    // round position values later
  },
  render: function () {
    this.game.debug.body(this.player, 'blue');

    this.developers.forEach(function (dev) {
      if (dev.alive === false) { return; }
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
    this.moveKey.removeAll();
    this.moveKey = null;
  }
};