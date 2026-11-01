// @vitest-environment jsdom
// Phaser は内蔵テクスチャを data URI の画像で読み込むので、jsdom に画像の読み込みを許可する
// @vitest-environment-options {"resources":"usable"}
import Phaser from 'phaser';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { formatRecipe } from '../src/domain/recipe.ts';
import { targetColorOf } from '../src/domain/stages.ts';
import type { Stage } from '../src/domain/types.ts';
import { FinalResultScene } from '../src/scenes/FinalResultScene.ts';
import { GameScene, type GameSceneData, type RoundResult } from '../src/scenes/GameScene.ts';
import { ResultScene } from '../src/scenes/ResultScene.ts';
import { TitleScene } from '../src/scenes/TitleScene.ts';
import { CHARACTER_TEXTURE, toHex } from '../src/ui/common.ts';

// Phaser の更新で、型は通るのに実行時に壊れる退行を拾うためのテスト。描画結果までは見ない

let game: Phaser.Game;
let errors: unknown[];
const recordError = (event: ErrorEvent) => errors.push(event.error);

beforeEach(() => {
  errors = [];
  vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args));
  window.addEventListener('error', recordError);
  // jsdom には public/ を配信するサーバーがなく、画像の読み込みは何も言わずに失敗する。
  // 手元でたまたま動いているサーバーに結果を左右されないよう、通信せずに空のテクスチャで代える
  // タイトルへ戻ると preload がもう一度走る。本物の Loader と同じく、読み込み済みなら何もしない
  vi.spyOn(TitleScene.prototype, 'preload').mockImplementation(function (this: TitleScene) {
    if (this.textures.exists(CHARACTER_TEXTURE)) return;
    this.textures.addCanvas(CHARACTER_TEXTURE, document.createElement('canvas'));
  });
  game = new Phaser.Game({
    type: Phaser.HEADLESS,
    banner: false,
    autoFocus: false,
    audio: { noAudio: true },
    scene: [TitleScene, GameScene, ResultScene, FinalResultScene],
  });
});

afterEach(() => {
  game.destroy(true);
  window.removeEventListener('error', recordError);
  vi.restoreAllMocks();
});

async function waitForScene(key: string): Promise<Phaser.Scene> {
  await vi.waitFor(() => expect(game.scene.getScenes(true).map((scene) => scene.scene.key)).toEqual([key]));
  return game.scene.getScene(key);
}

// ボタンの実装に依存しないよう、ラベルの文字から一番近い押せる図形を押す。
// 色相環の目印と絵の具のように同じ文字が複数あるときは、押せる図形に一番近い文字をラベルとみなす
function press(scene: Phaser.Scene, label: string): void {
  const objects = scene.children.list;
  const texts = objects.filter(
    (object): object is Phaser.GameObjects.Text => object instanceof Phaser.GameObjects.Text && object.text === label,
  );
  if (texts.length === 0) throw new Error(`「${label}」が見つかりません`);
  const interactives = objects.filter(
    (object): object is Phaser.GameObjects.Shape => object instanceof Phaser.GameObjects.Shape && !!object.input?.enabled,
  );
  const candidates = texts.flatMap((text) =>
    interactives.map((shape) => ({ shape, distance: Phaser.Math.Distance.Between(shape.x, shape.y, text.x, text.y) })),
  );
  const nearest = candidates.reduce((best, candidate) => (candidate.distance < best.distance ? candidate : best));
  nearest.shape.emit('pointerdown');
}

it('タイトルで難易度を選んで調色し、結果を見て次のステージへ進める', async () => {
  press(await waitForScene('TitleScene'), '中級');

  const gameScene = await waitForScene('GameScene');
  press(gameScene, '緑');
  press(gameScene, '橙');
  press(gameScene, '水色');
  press(gameScene, '完成！');

  press(await waitForScene('ResultScene'), '次のステージ');

  await vi.waitFor(() =>
    expect(game.scene.getScene('GameScene').scene.settings.data).toMatchObject({ difficulty: 'intermediate', stageIndex: 1 }),
  );
  expect(errors).toEqual([]);
});

it('「色について」を開いて閉じると、難易度を選べる', async () => {
  const titleScene = await waitForScene('TitleScene');
  const hasText = (label: string) =>
    titleScene.children.list.some((object) => object instanceof Phaser.GameObjects.Text && object.text === label);

  press(titleScene, '色について');
  expect(hasText('色の3つのものさし')).toBe(true);
  press(titleScene, '閉じる');
  expect(hasText('色の3つのものさし')).toBe(false);

  press(titleScene, '初級');
  await waitForScene('GameScene');
  expect(errors).toEqual([]);
});

it('答えを見ると、その問題には再挑戦できなくなる', async () => {
  press(await waitForScene('TitleScene'), '初級');
  const gameScene = await waitForScene('GameScene');
  press(gameScene, '緑');
  press(gameScene, '完成！');

  const resultScene = await waitForScene('ResultScene');
  const { result } = resultScene.scene.settings.data as { result: RoundResult };
  press(resultScene, '答えを見る');
  const texts = resultScene.children.list.filter((object) => object instanceof Phaser.GameObjects.Text);
  expect(texts.some((text) => text.text.startsWith(`答え：${formatRecipe(result.stage.recipe)}`))).toBe(true);

  press(resultScene, 'もう一度');
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(game.scene.getScenes(true).map((scene) => scene.scene.key)).toEqual(['ResultScene']);
  expect(errors).toEqual([]);
});

it('5ステージを終えると結果発表へ進み、再挑戦した結果は最後のものだけが残る', async () => {
  press(await waitForScene('TitleScene'), '初級');

  const playOneDrop = async (label: string) => {
    const gameScene = await waitForScene('GameScene');
    press(gameScene, label);
    press(gameScene, '完成！');
    return waitForScene('ResultScene');
  };

  press(await playOneDrop('黒'), 'もう一度');
  press(await playOneDrop('緑'), '次のステージ');
  for (let stage = 2; stage <= 4; stage++) press(await playOneDrop('緑'), '次のステージ');
  press(await playOneDrop('緑'), '結果発表へ');

  const finalScene = await waitForScene('FinalResultScene');
  const { results } = finalScene.scene.settings.data as { results: RoundResult[] };
  const { stages } = game.scene.getScene('GameScene').scene.settings.data as GameSceneData;
  expect(results.map((result) => result.stage)).toEqual(stages);
  expect(results[0].history).toEqual(['green']);

  press(finalScene, 'もう一度遊ぶ');
  await vi.waitFor(() =>
    expect(game.scene.getScene('GameScene').scene.settings.data).toMatchObject({
      difficulty: 'beginner',
      stageIndex: 0,
      results: [],
    }),
  );
  expect(errors).toEqual([]);
});

it('「ヒント」で色相環と明度バーをお題の位置ごと出し入れでき、出した状態は次のステージへ持ち越す', async () => {
  press(await waitForScene('TitleScene'), '初級');
  const meterLayerOf = (scene: Phaser.Scene) => (scene as unknown as { meterLayer: Phaser.GameObjects.Layer }).meterLayer;
  const hasTargetMarker = (scene: Phaser.Scene) => {
    const targetHex = toHex(targetColorOf((scene as unknown as { stage: Stage }).stage));
    // お題の色見本と区別するため、小さい四角だけを数える
    const markers = meterLayerOf(scene)
      .getChildren()
      .filter((object) => object instanceof Phaser.GameObjects.Rectangle && object.fillColor === targetHex && object.width < 20);
    return markers.length === 2;
  };

  const swatchHeightOf = (scene: Phaser.Scene) =>
    (scene as unknown as { currentSwatch: Phaser.GameObjects.Rectangle }).currentSwatch.height;

  const gameScene = await waitForScene('GameScene');
  expect(meterLayerOf(gameScene).visible).toBe(false);
  const heightWithoutMeters = swatchHeightOf(gameScene);
  press(gameScene, 'ヒント');
  expect(meterLayerOf(gameScene).visible).toBe(true);
  // 隠している間は、空いた場所まで色見本を伸ばしている
  expect(swatchHeightOf(gameScene)).toBeLessThan(heightWithoutMeters);
  expect(hasTargetMarker(gameScene)).toBe(true);
  press(gameScene, '隠す');
  expect(meterLayerOf(gameScene).visible).toBe(false);
  press(gameScene, 'ヒント');

  press(gameScene, '緑');
  press(gameScene, '完成！');
  press(await waitForScene('ResultScene'), '次のステージ');
  const nextScene = await waitForScene('GameScene');
  expect(meterLayerOf(nextScene).visible).toBe(true);
  expect(hasTargetMarker(nextScene)).toBe(true);
  expect(errors).toEqual([]);
});

it('プレイ中に「タイトルへ」を押すと確認が出て、続ければそのまま遊べ、やめればタイトルへ戻る', async () => {
  press(await waitForScene('TitleScene'), '初級');
  const gameScene = await waitForScene('GameScene');
  const hasText = (label: string) =>
    gameScene.children.list.some((object) => object instanceof Phaser.GameObjects.Text && object.text === label);
  const confirmMessage = 'ゲームをやめますか？\nここまでの結果は消えます';
  const history = () => (gameScene as unknown as { round: { history: string[] } }).round.history;

  press(gameScene, '緑');
  press(gameScene, 'タイトルへ');
  expect(hasText(confirmMessage)).toBe(true);
  press(gameScene, '続ける');
  expect(hasText(confirmMessage)).toBe(false);
  expect(history()).toEqual(['green']);
  press(gameScene, '白');
  expect(history()).toEqual(['green', 'white']);

  press(gameScene, 'タイトルへ');
  press(gameScene, 'やめる');
  await waitForScene('TitleScene');
  expect(errors).toEqual([]);
});
