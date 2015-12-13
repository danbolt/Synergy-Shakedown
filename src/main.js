var Preload = function() {};
Preload.prototype = {
  init: function() {
    //
  },
  preload: function() {
    this.game.load.bitmapFont('font', 'asset/bitmapFont/font.png', 'asset/bitmapFont/font.json');
  },
  create: function() {
    this.game.stage.backgroundColor = '#191919';

    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.scale.refresh();

    this.game.scale.pageAlignHorizontally = true;
    this.game.scale.pageAlignVertically = true;

    this.game.stage.smoothed = false;

    PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST; //for WebGL

    var loadText = this.game.add.bitmapText(this.game.width / 2, this.game.height / 2 + 4, 'font', 'loading...\n\n(this might take a moment!)', 8);
    loadText.anchor.x = 0.5;
    loadText.align = 'center';
    this.game.time.events.loop(250, function () { loadText.renderable = !(loadText.renderable); });

    this.game.input.gamepad.start();

    this.game.state.start('Load', false);
  }
};

var Load = function() {};
Load.prototype = {
  preload: function() {

    this.game.load.audio('encourage0', 'asset/sfx/encourage0.wav');
    this.game.load.audio('encourage1', 'asset/sfx/encourage1.wav');
    this.game.load.audio('encourage2', 'asset/sfx/encourage2.wav');

    this.game.load.audio('demotivate0', 'asset/sfx/demotivate0.wav');
    this.game.load.audio('demotivate1', 'asset/sfx/demotivate1.wav');
    this.game.load.audio('demotivate2', 'asset/sfx/demotivate2.wav');

    this.game.load.audio('playerLose' , 'asset/sfx/playerLose.wav');

    this.game.load.audio('blip' , 'asset/sfx/blip.wav');

    this.game.load.audio('revive', 'asset/sfx/revive.wav');

    this.game.load.audio('winRound', 'asset/sfx/winRound.wav');

    this.game.load.audio('background_melody', 'asset/bgm/melody.mp3');

    this.game.load.image('tiles', 'asset/tiles.png');
    this.game.load.image('logo', 'asset/gameLogo.png');

    this.game.load.spritesheet('sheet', 'asset/spriteSheet.png', 16, 32);
    this.game.load.spritesheet('carts', 'asset/carts.png', 64, 40);
    this.game.load.spritesheet('cutscenes', 'asset/cutscenes.png', 320, 128);

    this.game.load.tilemap('level0', 'asset/level0.json', undefined, Phaser.Tilemap.TILED_JSON);
  },
  create: function() {
    this.game.bgmMelody = this.game.add.audio('background_melody', 0.8, true);
    this.game.bgmMelody.play();

    this.game.state.start('CutScene');
  }
};

var CutScene = function () {};
CutScene.prototype = {
  create: function () {
    this.currentScene = 0;

    this.dialogues = ['you called for me mr.shadowboss?', 'i want you to help the doomed team', 'but they\'re doomed...   ', 'grow some synergy or\nyou\'re fired!!!'];

    var scneneSprite = this.game.add.sprite(0, 32, 'cutscenes', 0);

    var enterAnim = this.game.add.sprite(128, 32, 'cutscenes', 4);
    var enterTween = this.game.add.tween(enterAnim);
    enterTween.to({x: -16}, 1000);
    enterTween.start();

    var blipSound = this.game.add.audio('blip', 0.5);

    var dialogueText = this.game.add.bitmapText(32, 186, 'font', '', 8);

    var gamepadText = this.game.add.bitmapText(this.game.width - 4, this.game.height - 4, 'font', '(ESC) to skip', 8);
    gamepadText.anchor.setTo(1);
    gamepadText.align = 'right';
    this.gamepadText = gamepadText;

    var escKey = this.game.input.keyboard.addKey(Phaser.KeyCode.ESC);
    escKey.onDown.add(function () {
      this.game.state.start('TitleScreen');
      escKey.onDown.removeAll();
    }, this);


    var bip = 0;
    var bipLoop = undefined;
    var bipAndLoopFunction = function () {
      dialogueText.text = this.dialogues[this.currentScene].substring(0, bip);
      bip++;
      blipSound.play();

      if (bip === this.dialogues[this.currentScene].length + 1) {
        this.game.time.events.remove(bipLoop);

        this.game.time.events.add((this.currentScene === 4) ? 3500 : 750, function () {

          this.currentScene++;
          bip = 0;

          if (this.currentScene === 4) {
            this.game.state.start('TitleScreen');
          } else {
            if (this.currentScene === 1) {
              enterAnim.kill();
            }
            scneneSprite.frame = this.currentScene;
            bipLoop = this.game.time.events.loop(100, bipAndLoopFunction, this);
            dialogueText.text = '';
          }

        }, this);
      }
    };

    this.game.input.gamepad.onDownCallback = function (buttonCode) {
      if (buttonCode === Phaser.Gamepad.XBOX360_START) {
        this.game.state.start('TitleScreen');
        escKey.onDown.removeAll();
      }
    };

    bipLoop = this.game.time.events.loop(100, bipAndLoopFunction, this);
  }
};

var TitleScreen = function () {};
TitleScreen.prototype = {
  create: function() {
    this.game.stage.backgroundColor = '#191919';

    var taglines = ['a crunch-time morale boost!', 'you are the manager!', 'last-minute leadership!', 'help your team ship the game!', 'cheer up your team!'];
    var titleText = this.game.add.bitmapText(this.game.width / 2, this.game.height / 2 + 4, 'font', taglines[~~(Math.random() * taglines.length)], 8);
    titleText.anchor.x = 0.5;
    titleText.align = 'center';
    titleText.tint = 0x00beff;

    var gameLogo = this.game.add.image(this.game.width / 2, this.game.height / 2, 'logo');
    gameLogo.anchor.setTo(0.5, 0.75);

    var titleText2 = this.game.add.bitmapText(this.game.width / 2, this.game.height / 2 + 32, 'font', 'You are the dev team lead\nHold X to move\ndouble tap X to turn around\n\nRapidly tap C to encourage a dev', 8);
    titleText2.anchor.x = 0.5;
    titleText2.align = 'center';
    this.titleText2 = titleText2;

    var gamepadText = this.game.add.bitmapText(this.game.width - 4, this.game.height - 4, 'font', 'Gamepad is not detected', 8);
    gamepadText.anchor.setTo(1);
    gamepadText.align = 'right';
    this.gamepadText = gamepadText;

    var copyrightText = this.game.add.bitmapText(this.game.width - 4, this.game.height - 4 - 16, 'font', 'Game by Daniel Savage (ld34)', 8);
    copyrightText.anchor.setTo(1);
    copyrightText.align = 'right';

    var xKey = this.game.input.keyboard.addKey(Phaser.KeyCode.X);
    xKey.onDown.add(function () {
      this.game.state.start('Gameplay');
      xKey.onDown.removeAll();
    }, this);

    this.game.input.gamepad.onDownCallback = function (buttonCode) {
      if (buttonCode === Phaser.Gamepad.XBOX360_START) {
        this.game.state.start('Gameplay');
        xKey.onDown.removeAll();
      }
    };
  },
  update: function () {
    if (this.game.input.gamepad.supported && this.game.input.gamepad.active && this.game.input.gamepad.pad1.connected)
    {
        this.gamepadText.text = 'Gamepad is detected! Press start!';
    }
    else
    {
        this.gamepadText.text = 'Gamepad is not detected';
    }
  }
};

var main = function() {
  console.log('hello, jam! ♡');

  var game = new Phaser.Game(320, 240);
  game.state.add('Preload', Preload, false);
  game.state.add('Load', Load, false);
  game.state.add('TitleScreen', TitleScreen, false);
  game.state.add('CutScene', CutScene, false);
  game.state.add('Gameplay', Gameplay, false);
  game.state.start('Preload');
};