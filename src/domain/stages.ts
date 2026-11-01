import { mixColor } from './paintMixing.ts';
import type { Difficulty, Pigment, RgbColor, Stage } from './types.ts';

export type Course = { label: string; pigments: readonly Pigment[]; stages: readonly Stage[] };

export const STAGES_PER_RUN = 5;

// 正解レシピはプレイヤーに見せない。お題名は JIS の慣用色名から近い色を選び、近いものがなければ系統色名にしている。
// どのお題も、その難易度で使える塗料の単色1滴では高得点にならない（scoring.test.ts で確認）
// 初級は比率を考えずに済むよう、6色から2色を1滴ずつ選ぶ15通りだけにしている
const BEGINNER_STAGES: readonly Stage[] = [
  { id: 'beginner-01', name: 'ごく暗い紫みの赤', recipe: ['red', 'black'] },
  { id: 'beginner-02', name: '強い赤', recipe: ['red', 'white'] },
  { id: 'beginner-03', name: '鮮やかな黄赤', recipe: ['red', 'yellow'] },
  { id: 'beginner-04', name: '暗い緑みの黄', recipe: ['yellow', 'black'] },
  { id: 'beginner-05', name: '菜の花色', recipe: ['yellow', 'white'] },
  { id: 'beginner-06', name: '暗い灰みの黄緑', recipe: ['red', 'green'] },
  { id: 'beginner-07', name: '鮮やかな緑みの黄緑', recipe: ['yellow', 'green'] },
  { id: 'beginner-08', name: 'くすんだ緑', recipe: ['yellow', 'blue'] },
  { id: 'beginner-09', name: '若竹色', recipe: ['green', 'white'] },
  { id: 'beginner-10', name: 'ごく暗い緑', recipe: ['green', 'black'] },
  { id: 'beginner-11', name: 'くすんだ青みの青緑', recipe: ['green', 'blue'] },
  { id: 'beginner-12', name: '強い青', recipe: ['blue', 'white'] },
  { id: 'beginner-13', name: '濃紺', recipe: ['blue', 'black'] },
  { id: 'beginner-14', name: '暗い青紫', recipe: ['red', 'blue'] },
  { id: 'beginner-15', name: '墨', recipe: ['white', 'black'] },
];

// 中級は3〜4滴で、橙・水色・紫のどれかを使う。お題どうしを ΔE 20 以上離し、似た色で数を水増ししない
const INTERMEDIATE_STAGES: readonly Stage[] = [
  { id: 'intermediate-01', name: '暗い灰みの赤紫', recipe: ['red', 'purple', 'black', 'black'] },
  { id: 'intermediate-02', name: '灰みの赤紫', recipe: ['red', 'lightBlue', 'white'] },
  { id: 'intermediate-03', name: '暗い赤みの赤紫', recipe: ['red', 'red', 'lightBlue', 'purple'] },
  { id: 'intermediate-04', name: '真紅', recipe: ['red', 'red', 'purple'] },
  { id: 'intermediate-05', name: 'テラコッタ', recipe: ['orange', 'purple', 'white'] },
  { id: 'intermediate-06', name: '緋色', recipe: ['red', 'red', 'red', 'orange'] },
  { id: 'intermediate-07', name: '暗い黄みの赤', recipe: ['red', 'orange', 'black'] },
  { id: 'intermediate-08', name: '暗い黄赤', recipe: ['orange', 'orange', 'orange', 'black'] },
  { id: 'intermediate-09', name: '明るい灰みの黄赤', recipe: ['yellow', 'purple', 'white', 'white'] },
  { id: 'intermediate-10', name: '強い赤みの黄', recipe: ['orange', 'yellow', 'yellow', 'purple'] },
  { id: 'intermediate-11', name: 'マリーゴールド', recipe: ['orange', 'yellow', 'yellow', 'yellow'] },
  { id: 'intermediate-12', name: '強い緑みの黄', recipe: ['orange', 'yellow', 'yellow', 'lightBlue'] },
  { id: 'intermediate-13', name: '強い黄緑', recipe: ['orange', 'yellow', 'yellow', 'green'] },
  { id: 'intermediate-14', name: '明るい黄緑', recipe: ['yellow', 'lightBlue', 'white'] },
  { id: 'intermediate-15', name: '明るい灰みの緑', recipe: ['orange', 'lightBlue', 'lightBlue', 'white'] },
  { id: 'intermediate-16', name: '強い緑', recipe: ['yellow', 'green', 'green', 'lightBlue'] },
  { id: 'intermediate-17', name: '柔らかい青みの緑', recipe: ['green', 'green', 'lightBlue', 'white'] },
  { id: 'intermediate-18', name: '浅葱色', recipe: ['green', 'lightBlue', 'lightBlue', 'lightBlue'] },
  { id: 'intermediate-19', name: '浅い緑みの青', recipe: ['lightBlue', 'lightBlue', 'lightBlue', 'white'] },
  { id: 'intermediate-20', name: '柔らかい紫みの青', recipe: ['lightBlue', 'lightBlue', 'purple', 'white'] },
  { id: 'intermediate-21', name: '強い紫みの青', recipe: ['lightBlue', 'blue', 'blue', 'blue'] },
  { id: 'intermediate-22', name: '紺青', recipe: ['blue', 'blue', 'purple', 'black'] },
  { id: 'intermediate-23', name: '紫', recipe: ['purple', 'purple', 'purple', 'white'] },
];

const ADVANCED_STAGES: readonly Stage[] = [
  { id: 'advanced-01', name: '強い紫みの赤紫', recipe: ['red', 'purple', 'purple', 'white', 'white', 'white'] },
  { id: 'advanced-02', name: 'ごく薄い紫みの赤紫', recipe: ['red', 'lightBlue', 'white', 'white', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-03', name: 'ごく暗い赤紫', recipe: ['red', 'red', 'purple', 'purple', 'black', 'black', 'black'] },
  { id: 'advanced-04', name: 'くすんだ赤みの赤紫', recipe: ['yellow', 'purple', 'purple', 'purple', 'purple', 'yellowOchre'] },
  { id: 'advanced-05', name: 'ワインレッド', recipe: ['red', 'red', 'red', 'purple', 'purple', 'white'] },
  { id: 'advanced-06', name: 'くすみローズ', recipe: ['red', 'purple', 'yellowOchre', 'white', 'white', 'white'] },
  { id: 'advanced-07', name: '茜色', recipe: ['red', 'red', 'red', 'red', 'red', 'orange', 'brown'] },
  { id: 'advanced-08', name: 'セピア', recipe: ['red', 'red', 'red', 'orange', 'yellow', 'black', 'black', 'black'] },
  { id: 'advanced-09', name: '珊瑚色', recipe: ['red', 'yellowOchre', 'white', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-10', name: '強い黄みの赤', recipe: ['red', 'red', 'orange', 'orange', 'white', 'white', 'white'] },
  { id: 'advanced-11', name: '鮮やかな黄みの赤', recipe: ['red', 'red', 'orange', 'orange', 'orange', 'orange', 'orange', 'yellow'] },
  { id: 'advanced-12', name: '煉瓦色', recipe: ['red', 'red', 'red', 'yellowGreen', 'yellowGreen', 'yellowGreen', 'brown', 'yellowOchre'] },
  { id: 'advanced-13', name: '浅い赤みの黄赤', recipe: ['red', 'orange', 'orange', 'white', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-14', name: 'くすんだ黄赤', recipe: ['yellow', 'yellow', 'lightBlue', 'purple', 'purple', 'brown', 'brown', 'brown'] },
  { id: 'advanced-15', name: '強い黄赤', recipe: ['red', 'orange', 'orange', 'orange', 'yellow', 'yellow', 'yellow', 'yellowGreen'] },
  { id: 'advanced-16', name: '強い黄みの黄赤', recipe: ['orange', 'orange', 'orange', 'yellowGreen', 'yellowGreen', 'brown', 'brown'] },
  { id: 'advanced-17', name: '山吹色', recipe: ['orange', 'orange', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'white'] },
  { id: 'advanced-18', name: '柔らかい黄', recipe: ['lightBlue', 'purple', 'yellowOchre', 'yellowOchre', 'yellowOchre', 'yellowOchre', 'white', 'white'] },
  { id: 'advanced-19', name: '芥子色', recipe: ['yellowGreen', 'yellowOchre', 'yellowOchre', 'yellowOchre', 'yellowOchre', 'yellowOchre', 'white'] },
  { id: 'advanced-20', name: 'オリーブグリーン', recipe: ['yellow', 'yellow', 'yellow', 'yellow', 'yellowGreen', 'black', 'black', 'black'] },
  { id: 'advanced-21', name: '暗い灰みの黄みの黄緑', recipe: ['orange', 'orange', 'yellow', 'blue', 'black', 'black', 'black'] },
  { id: 'advanced-22', name: 'クリーム色', recipe: ['yellowGreen', 'yellowOchre', 'white', 'white', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-23', name: '抹茶色', recipe: ['yellowGreen', 'yellowGreen', 'yellowOchre', 'white', 'white', 'white'] },
  { id: 'advanced-24', name: '若草色', recipe: ['yellow', 'yellowGreen', 'yellowGreen'] },
  { id: 'advanced-25', name: '強い黄みの黄緑', recipe: ['orange', 'orange', 'yellow', 'yellowGreen', 'green'] },
  { id: 'advanced-26', name: '松葉色', recipe: ['yellowGreen', 'lightBlue', 'lightBlue', 'yellowOchre', 'yellowOchre'] },
  { id: 'advanced-27', name: '明るい緑みの黄緑', recipe: ['yellow', 'yellowGreen', 'green', 'white', 'white', 'white'] },
  { id: 'advanced-28', name: '鮮やかな黄みの緑', recipe: ['yellow', 'yellowGreen', 'yellowGreen', 'yellowGreen', 'green', 'green', 'green'] },
  { id: 'advanced-29', name: '明るい灰みの黄みの緑', recipe: ['yellow', 'lightBlue', 'lightBlue', 'white', 'white', 'white', 'black'] },
  { id: 'advanced-30', name: '常磐色', recipe: ['yellowGreen', 'green', 'green', 'green', 'brown'] },
  { id: 'advanced-31', name: 'ボトルグリーン', recipe: ['orange', 'green', 'green', 'green', 'green', 'green', 'black', 'black'] },
  { id: 'advanced-32', name: 'ミントグリーン', recipe: ['yellowGreen', 'green', 'lightBlue', 'white', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-33', name: 'ピーコックグリーン', recipe: ['green', 'green', 'green', 'lightBlue', 'lightBlue', 'lightBlue', 'white'] },
  { id: 'advanced-34', name: 'ごく薄い青緑', recipe: ['lightBlue', 'lightBlue', 'lightBlue', 'yellowOchre', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-35', name: '暗い青緑', recipe: ['green', 'green', 'green', 'blue', 'blue', 'black'] },
  { id: 'advanced-36', name: '柔らかい緑みの青', recipe: ['green', 'green', 'lightBlue', 'lightBlue', 'lightBlue', 'lightBlue', 'lightBlue', 'blue'] },
  { id: 'advanced-37', name: '縹色', recipe: ['green', 'lightBlue', 'lightBlue', 'lightBlue', 'lightBlue', 'lightBlue', 'blue', 'blue'] },
  { id: 'advanced-38', name: 'マリンブルー', recipe: ['yellowGreen', 'green', 'blue', 'blue', 'blue', 'blue', 'blue', 'purple'] },
  { id: 'advanced-39', name: 'スカイブルー', recipe: ['lightBlue', 'lightBlue', 'lightBlue', 'purple', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-40', name: 'コバルトブルー', recipe: ['lightBlue', 'lightBlue', 'lightBlue', 'lightBlue', 'lightBlue', 'blue', 'blue', 'purple'] },
  { id: 'advanced-41', name: 'ウルトラマリンブルー', recipe: ['blue', 'blue', 'blue', 'blue', 'purple', 'purple', 'purple', 'white'] },
  { id: 'advanced-42', name: 'ごく暗い青紫', recipe: ['blue', 'purple', 'purple', 'purple', 'black', 'black'] },
  { id: 'advanced-43', name: '強い青紫', recipe: ['lightBlue', 'purple', 'purple', 'purple', 'white', 'white', 'white'] },
  { id: 'advanced-44', name: '江戸紫', recipe: ['green', 'purple', 'purple', 'purple', 'purple', 'purple', 'purple', 'white'] },
  { id: 'advanced-45', name: '柔らかい青紫', recipe: ['red', 'lightBlue', 'lightBlue', 'purple', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-46', name: '灰みの青紫', recipe: ['lightBlue', 'lightBlue', 'purple', 'purple', 'purple', 'yellowOchre', 'yellowOchre'] },
  { id: 'advanced-47', name: '暗い赤みの紫', recipe: ['red', 'red', 'red', 'blue', 'purple', 'purple', 'purple', 'purple'] },
  { id: 'advanced-48', name: '青みの黒', recipe: ['green', 'blue', 'black', 'black', 'black', 'black', 'black', 'black'] },
  { id: 'advanced-49', name: '緑みの暗い灰色', recipe: ['lightBlue', 'yellowOchre', 'white', 'white', 'white', 'black', 'black'] },
  { id: 'advanced-50', name: '赤みのごく暗い灰色', recipe: ['red', 'red', 'red', 'yellow', 'blue', 'blue', 'blue', 'yellowOchre'] },
];

// 塗料の並びは types.ts の PIGMENTS の順に揃える（ボタンの並びになる）。
// 初級は三原色と緑・白・黒だけにして、混ぜ方の基本に絞る。中級で中間色を、上級で茶系と黄緑を足す
export const COURSES: Record<Difficulty, Course> = {
  beginner: {
    label: '初級',
    pigments: ['red', 'yellow', 'green', 'blue', 'white', 'black'],
    stages: BEGINNER_STAGES,
  },
  intermediate: {
    label: '中級',
    pigments: ['red', 'orange', 'yellow', 'green', 'lightBlue', 'blue', 'purple', 'white', 'black'],
    stages: INTERMEDIATE_STAGES,
  },
  advanced: {
    label: '上級',
    pigments: [
      'red',
      'orange',
      'yellow',
      'yellowGreen',
      'green',
      'lightBlue',
      'blue',
      'purple',
      'brown',
      'yellowOchre',
      'white',
      'black',
    ],
    stages: ADVANCED_STAGES,
  },
};

/** 重複なしで選ぶ。random はテストで結果を固定するために差し替えられる */
export function pickStages(stages: readonly Stage[], count: number, random: () => number = Math.random): Stage[] {
  const pool = [...stages];
  const picked: Stage[] = [];
  while (picked.length < count && pool.length > 0) {
    const [stage] = pool.splice(Math.floor(random() * pool.length), 1);
    picked.push(stage);
  }
  return picked;
}

export function targetColorOf(stage: Stage): RgbColor {
  const color = mixColor(stage.recipe);
  if (!color) throw new Error(`${stage.id} のレシピが空です`);
  return color;
}
