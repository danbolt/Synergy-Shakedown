var Gameplay = function () {};
Gameplay.prototype = {
  motivateKey: null,
  moveKey: null,

  developers: null,
  player: null,
  playerSprite: null,

  guiSprites: null,
  workGlimmers: null,

  developerCount: 6,
  playerMoveSpeed: 200,
  playerCloseDistance: 8,
  initialDevMotivation: 20,
  baseDevMotiovationScale: 1.5,
  baseDevProgressValue: 0.01,
  baseDevProgressInterval: 700, // ms
  maxDevMotivation: 20,
  motivationPerPress: 1.5,
  cartPalette: [0x0078ff, 0x6b76ff, 0x005e00, 0x4d00c8, 0xff0000, 0x00c500],

  targetPlayerIndex: 0,
  movingForward: false,
  timeSinceLastDownPress: 0,
  gameProgress: 0, /* between 0 and 1 */
  cartRoll: 0,

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

  addGameProgress: function (value) {
    if (this.gameProgress >= 1) { return; }

    this.gameProgress += value;
  },

  create: function () {
    this.game.stage.backgroundColor = '#DDDDDD';

    this.map = this.game.add.tilemap('level0');
    this.map.addTilesetImage('tiles', 'tiles');

    var backgroundLayer = this.map.createLayer('background');
    var foregroundLayer = this.map.createLayer('foreground');

    this.motivateKey = this.game.input.keyboard.addKey(Phaser.KeyCode.C);
    this.motivateKey.onDown.add(this.motivateDev, this);
    this.moveKey = this.game.input.keyboard.addKey(Phaser.KeyCode.X);
    this.moveKey.onDown.add(this.reverseDirection, this);
    this.game.input.gamepad.onDownCallback = function (buttonCode) { if (buttonCode === 4) { this.motivateDev(); } if (buttonCode === 5) { this.reverseDirection(); } };
    this.game.input.gamepad.callbackContext = this;

    this.guiSprites = this.game.add.group();

    var px = 0;
    var py = 0;

    this.developers = [];
    this.map.objects.gameplay.forEach(function(mapObject) {

      if (mapObject.name === 'Player') {
        px = mapObject.x;
        py = mapObject.y;
      } else if (mapObject.name === 'Dev') {
        var that = this;
        var newDev = this.game.add.sprite(~~(mapObject.x + 8), ~~(mapObject.y), 'sheet', 12);
        this.game.physics.arcade.enable(newDev);
        newDev.body.setSize(16, 16);
        newDev.anchor.setTo(0.5, 0);
        newDev.motivation = 20;
        newDev.motivationScale = this.baseDevMotiovationScale + Math.random() * 0.45 - 0.234;
        newDev.progressValue = this.baseDevProgressValue;
        newDev.progressInterval = this.baseDevProgressInterval + (Math.random() * 600 - 300);
        newDev.workLoop = null;
        newDev.addChild(this.game.add.sprite(0, 0, 'sheet', ~~(8 + Math.random() * 4))).anchor.setTo(0.5, 0);
        newDev.startWorking = function () {
          if (newDev.workLoop !== null) { return; }

          var bobbed = false;
          var initY = newDev.y;
          newDev.workLoop = that.game.time.events.loop(newDev.progressInterval, function() {
            that.addGameProgress( newDev.progressValue );
            var newGlimmer = that.workGlimmers.getFirstDead();
            if (newGlimmer) {
              newGlimmer.x = newDev.x;
              newGlimmer.y = newDev.y;
              newGlimmer.revive();
              newGlimmer.animations.play('glisten');
              var glimmerTween = this.game.add.tween(newGlimmer);
              glimmerTween.to({x: this.progress.x - (Math.random() * this.progress.width - this.progress.width / 2), y: this.progress.y + this.progress.height}, 500, undefined, false);
              glimmerTween.onComplete.add(function() { newGlimmer.kill(); }, this);
              glimmerTween.start();
            }
          }, that);
          newDev.bobLoop = that.game.time.events.loop(125, function () { bobbed = !bobbed; newDev.y = initY + (bobbed ? 1 : 0); }, that);
        };
        newDev.stopWorking = function () {
          that.game.time.events.remove(newDev.workLoop);
          that.game.time.events.remove(newDev.bobLoop);
          newDev.workLoop = null;
        };
        newDev.startWorking();
        newDev.events.onKilled.add(function () { this.healthBar.kill(); }, newDev);

        this.developers.push(newDev);

        var devHealthBar = this.game.add.sprite(newDev.x - 16, newDev.y - 32, 'sheet', 29);
        devHealthBar.tint = 0x191919;
        var movingBit = devHealthBar.addChild(this.game.add.sprite(1, 31, 'sheet', 29));
        movingBit.anchor.y = 1;
        movingBit.tint = 0x77beFF;
        movingBit.width = 14;
        movingBit.height = 30;
        newDev.bar = movingBit;
        var flashingBar = devHealthBar.addChild(this.game.add.sprite(0, 0, 'sheet', 30));
        flashingBar.animations.add('flicker', [30, 31], 12, true);
        flashingBar.animations.play('flicker');
        this.guiSprites.add(devHealthBar);
        newDev.healthBar = devHealthBar;
      }
    }, this);

    var cosmeticLayer = this.map.createLayer('cosmetic');

    this.player = this.game.add.sprite(px, py + 16, undefined);
    this.game.physics.arcade.enable(this.player);
    this.player.body.setSize(16, 16);
    this.player.renderable = false;

    this.playerSprite = this.game.add.sprite(64, 64, 'sheet', 0);
    this.playerSprite.anchor.setTo(0.5, 0);
    this.playerSprite.animations.add('run', [0, 1], 7, true);
    this.playerSprite.animations.play('run');

    var progressText = this.game.add.bitmapText(14 * 16 + 16, 0.75, 'font', 'PROGRESS', 8);
    progressText.tint = 0x000000;
    progressText.cacheAsBitmap = true;
    this.guiSprites.add(progressText);

    this.cartRoll = ~~(Math.random() * 6);
    var progressCart = this.game.add.sprite(14 * 16 + (this.game.width - 14 * 16) / 2, 32, 'carts', this.cartRoll);
    progressCart.anchor.x = 0.5;
    this.progress = progressCart;
    this.progress.crop(new Phaser.Rectangle(0, 0, 64, 0));

    this.workGlimmers = this.game.add.group();
    for (var i = 0; i < 10; i++) {
      var glimmer = this.game.add.sprite(0, 0, 'sheet', 24);
      glimmer.anchor.set(0.5);
      glimmer.kill();
      glimmer.animations.add('glisten', [24, 25, 26, 27], 8); // 500 ms long
      glimmer.tint = this.cartPalette[this.cartRoll];
      this.workGlimmers.add(glimmer);
    }

    this.targetPlayerIndex = 0;
    this.movingForward = true;
    this.timeSinceLastDownPress = 0;
  },
  update: function () {

    this.game.world.bringToTop(this.player);
    this.timeSinceLastDownPress += this.game.time.physicsElapsedMS;
    // move toward the next developer
    if (this.game.input.keyboard.isDown(Phaser.KeyCode.X) || this.game.input.gamepad.pad1.isDown(Phaser.Gamepad.BUTTON_5)) {
      var target = this.developers[this.targetPlayerIndex];

      Phaser.Point.subtract(target.position, this.player.position, this.player.body.velocity);
      this.player.body.velocity = Phaser.Point.normalize(this.player.body.velocity);
      this.player.body.velocity.setMagnitude(this.playerMoveSpeed);
      this.playerSprite.scale.x = this.player.body.velocity.x > 0 ? 1 : -1;
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
        dev.bar.height = 30 * dev.motivation / 20;
      } else {
        dev.stopWorking();
        dev.kill();
      }
    }, this);

    this.progress.cropRect.height = 40 * this.gameProgress;
    this.progress.updateCrop();

    // round position values later
    this.playerSprite.x = ~~(this.player.x);
    this.playerSprite.y = ~~(this.player.y);
  },
  render: function () {
    //this.game.debug.geom(new Phaser.Rectangle(0, 0, this.game.width, 16), '#333333');
    //this.game.debug.geom(new Phaser.Rectangle(0, 0, this.game.width * this.gameProgress, 16), 'pink');
  },
  shutdown: function () {
    this.player = null;
    this.playerSprite = null;
    this.developers = null;

    this.guiSprites = null;

    this.targetPlayerIndex = 0;

    this.motivateKey.removeAll();
    this.motivateKey = null;
    this.moveKey.removeAll();
    this.moveKey = null;
  }
};