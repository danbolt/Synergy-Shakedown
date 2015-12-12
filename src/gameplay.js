var Gameplay = function () {};
Gameplay.prototype = {
  motivateKey: null,
  moveKey: null,

  developers: null,
  player: null,
  playerSprite: null,

  guiSprites: null,
  workGlimmers: null,
  yayEmitter: null,
  encourageWords: null,

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
  baseTimeLeft: 30,
  encourageSounds: [],

  gameStates: ['getReady', 'gameplay', 'playerLose', 'playerWinRound'],

  currentState: 'undef',
  targetPlayerIndex: 0,
  movingForward: false,
  timeSinceLastDownPress: 0,
  gameProgress: 0, /* between 0 and 1 */
  cartRoll: 0,
  timeLeft: 30,
  currentRound: 0,

  motivateDev: function () {
    if (this.game.input.keyboard.isDown(Phaser.KeyCode.X) || this.game.input.gamepad.pad1.isDown(Phaser.Gamepad.BUTTON_5)) {
      return;
    }

    if (this.currentState !== 'gameplay') {
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

      this.playerSprite.animations.play('encourage');

      this.yayEmitter.emitParticle();

      var encourage = this.encourageWords.getFirstDead();
      if (encourage) {
        encourage.x = this.playerSprite.x - 8 + ~~(Math.random() * 16);
        encourage.y = this.playerSprite.y;
        encourage.revive();
        encourage.text = encourage.wordOptions[~~(Math.random() * encourage.wordOptions.length)];
        encourage.text.align = 'center';
        encourage.anchor.x = 0.5;
        var ey = encourage.y;
        var textTween = this.game.add.tween(encourage);
        textTween.to({y: ey - 16}, 200);
        textTween.onComplete.add(function() { encourage.kill(); });
        textTween.start();
      }
    }

    this.encourageSounds[~~(Math.random() * this.encourageSounds.length)].play();
  },

  reverseDirection: function () {
    if (this.timeSinceLastDownPress < 500) {
      this.movingForward = !this.movingForward;

      this.targetPlayerIndex = (this.movingForward ? (this.targetPlayerIndex + 1) : (this.targetPlayerIndex - 1 + this.developers.length)) % this.developers.length;
    }

    this.timeSinceLastDownPress = 0;
  },

  addGameProgress: function (value) {
    if (this.currentState !== 'gameplay') {
      return;
    }

    this.gameProgress += value;

    if (this.gameProgress > 1) {
      this.gameProgress = 1;
      this.transition_playerWinRound();
    }
  },

  // state transitions
  transition_getReady: function () {
    if (this.currentState !== 'undef' && this.currentState !== 'playerWinRound') {
      return;
    }

    this.getReadyText.text = 'THE DEVS ARE TIRED\n\nBUT WE GOTTA SHIP!!!';
    this.getReadyText.renderable = true;
    this.getReadyText.y = -30;
    var moveTextDownTween = this.game.add.tween(this.getReadyText);
    moveTextDownTween.to({y: ~~(this.game.height * 0.333)}, 500);
    var moveTextUpTween = this.game.add.tween(this.getReadyText);
    moveTextUpTween.to({y: -30}, 350, undefined, false, 1500);
    moveTextDownTween.chain(moveTextUpTween);
    moveTextUpTween.onComplete.add(function() {
      this.getReadyText.renderable = false;

      this.game.time.events.add(350, function () {
        this.transition_startGameplay();
      }, this);
    }, this);
    moveTextDownTween.start();

    this.gameProgress = 0;
    this.cartRoll = ~~(Math.random() * 6);
    this.progress.frame = this.cartRoll;

    this.timeLeft = this.baseTimeLeft;
    this.timerText.text = this.timeLeft.toString();

    this.roundText.text = this.currentRound.toString();

    this.currentState = 'getReady';
  },
  transition_startGameplay: function () {
    this.developers.forEach(function (dev) { dev.startWorking(); }, this);

    this.timeSubtractLoop = this.game.time.events.loop(1000, function() {
      this.timeLeft--;
      this.timerText.text = this.timeLeft.toString();
    }, this);

    this.currentState = 'gameplay';
  },
  transition_playerLose: function (message) {
    this.developers.forEach(function (dev) { if (dev.alive === false) { return; } dev.stopWorking(); }, this);

    this.getReadyText.text = message;
    this.getReadyText.renderable = true;
    this.getReadyText.y = -30;
    var moveTextDownTween = this.game.add.tween(this.getReadyText);
    moveTextDownTween.to({y: ~~(this.game.height * 0.333)}, 500);
    var moveTextUpTween = this.game.add.tween(this.getReadyText);
    moveTextUpTween.to({y: -30}, 350, undefined, false, 1500);
    moveTextDownTween.chain(moveTextUpTween);
    moveTextUpTween.onComplete.add(function() {
      this.getReadyText.renderable = false;

      this.game.time.events.add(500, function () {
        this.game.state.start('TitleScreen');
      }, this);
    }, this);
    moveTextDownTween.start();

    this.playerSprite.animations.play('sad');

    this.game.time.events.remove(this.timeSubtractLoop);
    this.timerText.text = 'xxx';

    this.currentState = 'playerLose';
  },
  transition_playerWinRound: function () {
    this.developers.forEach(function (dev) { dev.stopWorking(); }, this);

    this.getReadyText.text = 'Nice one!\nNext game coming up!';
    this.getReadyText.renderable = true;
    this.getReadyText.y = -30;
    var moveTextDownTween = this.game.add.tween(this.getReadyText);
    moveTextDownTween.to({y: ~~(this.game.height * 0.333)}, 500);
    var moveTextUpTween = this.game.add.tween(this.getReadyText);
    moveTextUpTween.to({y: -30}, 350, undefined, false, 1500);
    moveTextDownTween.chain(moveTextUpTween);
    moveTextUpTween.onComplete.add(function() {
      this.getReadyText.renderable = false;

      this.game.time.events.add(350, function () {
        this.transition_getReady();
      }, this);
    }, this);
    moveTextDownTween.start();

    this.game.time.events.remove(this.timeSubtractLoop);
    this.timerText.text = '---';

    this.currentRound++;

    this.currentState = 'playerWinRound';
  },

  create: function () {
    this.game.stage.backgroundColor = '#191919';

    this.map = this.game.add.tilemap('level0');
    this.map.addTilesetImage('tiles', 'tiles');

    this.encourageSounds = [];
    this.encourageSounds.push(this.game.add.audio('encourage0'));
    this.encourageSounds.push(this.game.add.audio('encourage1'));
    this.encourageSounds.push(this.game.add.audio('encourage2'));

    var backgroundLayer = this.map.createLayer('background');
    var foregroundLayer = this.map.createLayer('foreground');

    this.motivateKey = this.game.input.keyboard.addKey(Phaser.KeyCode.C);
    this.motivateKey.onDown.add(this.motivateDev, this);
    this.moveKey = this.game.input.keyboard.addKey(Phaser.KeyCode.X);
    this.moveKey.onDown.add(this.reverseDirection, this);
    this.game.input.gamepad.onDownCallback = function (buttonCode) { if (buttonCode === 4) { this.motivateDev(); } if (buttonCode === 5) { this.reverseDirection(); } };
    this.game.input.gamepad.callbackContext = this;

    this.guiSprites = this.game.add.group();

    this.currentRound = 1;

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
              newGlimmer.tint = this.cartPalette[this.cartRoll];
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
        newDev.events.onKilled.add(function () { this.stopWorking(); this.healthBar.kill(); }, newDev);

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

    this.yayEmitter = this.game.add.emitter(px, py, 100);
    this.yayEmitter.makeParticles('sheet', [24, 25]);
    this.yayEmitter.minRotation = 0;
    this.yayEmitter.maxRotation = 0;
    this.yayEmitter.setYSpeed(-100, -150);
    this.yayEmitter.setXSpeed(-150, 150);
    this.yayEmitter.gravity = 120;

    this.player = this.game.add.sprite(px, py + 16, undefined);
    this.game.physics.arcade.enable(this.player);
    this.player.body.setSize(16, 16);
    this.player.renderable = false;

    this.playerSprite = this.game.add.sprite(64, 64, 'sheet', 0);
    this.playerSprite.anchor.setTo(0.5, 0);
    this.playerSprite.animations.add('run', [0, 1], 7, true);
    this.playerSprite.animations.add('encourage', [2, 3, 2, 3], 7, false);
    this.playerSprite.animations.add('sad', [4, 5], 7, true);
    this.playerSprite.animations.play('run');

    var progressText = this.game.add.bitmapText(14 * 16 + 16, 0.75, 'font', 'PROGRESS', 8);
    progressText.cacheAsBitmap = true;
    this.guiSprites.add(progressText);

    this.cartRoll = ~~(Math.random() * 6);
    var progressCart = this.game.add.sprite(14 * 16 + (this.game.width - 14 * 16) / 2, 32, 'carts', this.cartRoll);
    progressCart.anchor.x = 0.5;
    this.progress = progressCart;
    this.progress.crop(new Phaser.Rectangle(0, 0, 64, 0));

    var getReadyText = this.game.add.bitmapText(14 * 16 / 2, 0, 'font', 'foo', 8);
    getReadyText.align = 'center';
    getReadyText.anchor.x = 0.5;
    getReadyText.tint = 0x000000;
    getReadyText.renderable = false;
    this.getReadyText = getReadyText;
    this.guiSprites.addChild(getReadyText);
    this.guiSprites.bringToTop(getReadyText);

    var timerTextLabel = this.game.add.bitmapText(14 * 16 + (this.game.width - (14 * 16)) / 2, this.game.height / 2, 'font', 'TIME', 8);
    timerTextLabel.align = 'center';
    timerTextLabel.anchor.x = 0.5;
    this.guiSprites.addChild(timerTextLabel);

    var timerText = this.game.add.bitmapText(0, 16, 'font', '000', 8);
    timerText.align = 'center';
    timerText.anchor.x = 0.5;
    timerTextLabel.addChild(timerText);
    this.timerText = timerText;

    var roundTextLabel = this.game.add.bitmapText(14 * 16 + (this.game.width - (14 * 16)) / 2, this.game.height / 2 + 48, 'font', 'ROUND', 8);
    roundTextLabel.align = 'center';
    roundTextLabel.anchor.x = 0.5;
    this.guiSprites.addChild(roundTextLabel);

    var roundText = this.game.add.bitmapText(0, 16, 'font', '000', 8);
    roundText.align = 'center';
    roundText.anchor.x = 0.5;
    roundTextLabel.addChild(roundText);
    this.roundText = roundText;

    this.workGlimmers = this.game.add.group();
    for (var i = 0; i < 10; i++) {
      var glimmer = this.game.add.sprite(0, 0, 'sheet', 24);
      glimmer.anchor.set(0.5);
      glimmer.kill();
      glimmer.animations.add('glisten', [24, 25, 26, 27], 8); // 500 ms long
      glimmer.tint = this.cartPalette[this.cartRoll];
      glimmer.alpha = 0.825;
      this.workGlimmers.add(glimmer);
    }

    var encouragement = ['yay', 'go go go', 'nice', 'good', 'ludum', 'ship', 'good', 'nice', 'yay', 'yay', 'woo', 'wow', 'good', 'great', 'yeah', 'game!', 'l33t', 'wow', 'nice', 'good', 'good work'];
    this.encourageWords = this.game.add.group();
    for (var i = 0; i < 10; i++) {
      var word = this.game.add.bitmapText(0, 0, 'font', 'toto', 8);
      word.wordOptions = encouragement;
      word.kill();
      this.encourageWords.add(word);
    }

    this.targetPlayerIndex = 0;
    this.movingForward = true;
    this.timeSinceLastDownPress = 0;

    this.transition_getReady();
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

      this.playerSprite.animations.play('run');
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

    if (this.currentState === 'gameplay') {
      this.developers.forEach(function(dev) {
        if (dev.motivation > 0) {
          dev.motivation -= this.game.time.physicsElapsed * dev.motivationScale;
          dev.bar.height = 30 * dev.motivation / 20;
        } else {
          dev.stopWorking();
          dev.kill();
        }
      }, this);

      var aliveDevsCount = 0;
      for (var i = 0; i < this.developers.length ; i++) {
        if (this.developers[i].alive) {
          aliveDevsCount++;
        }
      }
      if (aliveDevsCount === 0) {
        this.transition_playerLose('No devs left!\n\nThe game didn\'t ship!');
      }

      if (this.timeLeft < 0) {
        this.transition_playerLose('Out of time!\n\nThe game didn\'t ship!');
      }
    }

    this.progress.cropRect.height = 40 * this.gameProgress;
    this.progress.updateCrop();

    // round position values later
    this.playerSprite.x = ~~(this.player.x);
    this.playerSprite.y = ~~(this.player.y);
    this.yayEmitter.x = this.playerSprite.x;
    this.yayEmitter.y = this.playerSprite.y;
  },
  shutdown: function () {
    this.player = null;
    this.playerSprite = null;
    this.developers = null;

    this.guiSprites = null;

    this.targetPlayerIndex = 0;

    this.motivateKey.onDown.removeAll();
    this.motivateKey = null;
    this.moveKey.onDown.removeAll();
    this.moveKey = null;

    this.currentState = 'undef';
  }
};