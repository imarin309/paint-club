import Phaser from 'phaser';
import { PIGMENT_COLORS } from '../domain/paintMixing.ts';
import { COURSES } from '../domain/stages.ts';
import { DIFFICULTIES, type Difficulty, PIGMENTS } from '../domain/types.ts';
import { CHARACTER_TEXTURE, COLORS, GAME_HEIGHT, GAME_WIDTH, LOGO_FONT, TEXT_COLORS, TextButton, setupCamera, textStyle, toHex } from '../ui/common.ts';
import { newRun } from './GameScene.ts';

// 滴の上限や「1滴戻す」「完成！」は、ゲーム画面の表示とボタンで分かるので、ここには書かない
const GOAL = 'お題と同じ色を絵の具を混ぜて作ろう！';

// 「2色を1滴ずつ」のように正解の形が分かる書き方は、ヒントになるので避ける
const DIFFICULTY_NOTES: Record<Difficulty, string> = {
  beginner: 'まずは2色の組み合わせから',
  intermediate: '混ぜる割合がカギ',
  advanced: 'くすんだ色・淡い色に挑戦',
};

const COLOR_TERMS = [
  {
    name: '色相（しきそう）',
    lines: ['赤み・黄み・青みといった、色味の違い。', '色相の違う絵の具を混ぜると、', 'その間の色味になる。'],
  },
  { name: '明度（めいど）', lines: ['色の明るさ。', '白を混ぜると上がり、黒を混ぜると下がる。'] },
  {
    name: '彩度（さいど）',
    lines: ['色の鮮やかさ。', '色相環で反対側にある色（補色）を混ぜると、', '下がって、くすむ。', '白や黒を混ぜても、少し下がる。'],
  },
];

export class TitleScene extends Phaser.Scene {
  private leaving = false;
  private helpObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('TitleScene');
  }

  init(): void {
    this.leaving = false;
    this.helpObjects = [];
  }

  // 結果画面でも使うので、最初の Scene でまとめて読み込む
  preload(): void {
    this.load.image(CHARACTER_TEXTURE, 'images/paint-anpan.png');
    this.load.font(LOGO_FONT.family, LOGO_FONT.url, 'woff');
  }

  create(): void {
    setupCamera(this);

    this.add.image(GAME_WIDTH / 2, 100, CHARACTER_TEXTURE).setDisplaySize(150, 150);
    this.add.text(GAME_WIDTH / 2, 205, 'ぬりぬりくらぶ', textStyle(48, TEXT_COLORS.ink, 'logo')).setOrigin(0.5);

    this.add.rectangle(GAME_WIDTH / 2, 335, 300, 100).setRounded(16).setFillStyle(COLORS.surface).setStrokeStyle(2, COLORS.line);
    PIGMENTS.forEach((pigment, index) => {
      const column = index % 6;
      const row = Math.floor(index / 6);
      this.add
        .circle(GAME_WIDTH / 2 + (column - 2.5) * 44, 313 + row * 44, 15, toHex(PIGMENT_COLORS[pigment]))
        .setStrokeStyle(1.5, COLORS.ink, 0.3);
    });

    const goal = this.add.text(GAME_WIDTH / 2, 435, GOAL, textStyle(20)).setOrigin(0.5);
    this.add.rectangle(GAME_WIDTH / 2, goal.y + goal.height / 2 + 4, goal.width, 2, COLORS.ink);

    new TextButton(this, GAME_WIDTH / 2, 497, 180, 44, '色について', () => this.openHelp(), 'secondary');

    this.add.text(GAME_WIDTH / 2, 557, '難易度を選んでスタート', textStyle(16, TEXT_COLORS.subInk)).setOrigin(0.5);
    DIFFICULTIES.forEach((difficulty, index) => {
      const y = 612 + index * 70;
      const { label, pigments } = COURSES[difficulty];
      new TextButton(this, 110, y, 120, 56, label, () => this.start(difficulty));
      this.add.text(190, y - 11, DIFFICULTY_NOTES[difficulty], textStyle(18)).setOrigin(0, 0.5);
      this.add.text(190, y + 14, `絵の具 ${pigments.length}色`, textStyle(14, TEXT_COLORS.subInk)).setOrigin(0, 0.5);
    });
  }

  // 閉じたら作り直す。非表示にするだけだと、テストが押せる図形を探すときに残ってしまう
  private openHelp(): void {
    if (this.helpObjects.length > 0) return;

    // 後ろの難易度ボタンに押下を通さないため、背景も押せる図形にする
    const backdrop = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.ink, 0.4).setInteractive();
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 420, 600)
      .setRounded(16)
      .setFillStyle(COLORS.surface)
      .setStrokeStyle(2, COLORS.line);
    const title = this.add.text(GAME_WIDTH / 2, 145, '色の3つのものさし', textStyle(24, TEXT_COLORS.ink, 'mincho')).setOrigin(0.5);
    const terms = COLOR_TERMS.flatMap(({ name, lines }, index) => {
      const y = 195 + index * 140;
      return [
        this.add.text(70, y, name, { ...textStyle(20), fontStyle: 'bold' }),
        this.add.text(70, y + 32, lines.join('\n'), { ...textStyle(16, TEXT_COLORS.subInk), lineSpacing: 4 }),
      ];
    });
    const closeButton = new TextButton(this, GAME_WIDTH / 2, 650, 160, 48, '閉じる', () => this.closeHelp());

    this.helpObjects = [backdrop, panel, title, ...terms, ...closeButton.objects];
  }

  private closeHelp(): void {
    for (const object of this.helpObjects) object.destroy();
    this.helpObjects = [];
  }

  private start(difficulty: Difficulty): void {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.start('GameScene', newRun(difficulty));
  }
}
