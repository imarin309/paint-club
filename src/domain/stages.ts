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

// 上級は、全12色を使っても MASTER に5滴以上かかる色にする。茶・黄土・黄緑で作れる色は中級の9色でもほぼ作れるため、塗料の数では難しさが変わらない
const ADVANCED_STAGES: readonly Stage[] = [
  { id: 'advanced-01', name: '暗い赤紫', recipe: ['red', 'red', 'purple', 'purple', 'purple', 'black'] },
  { id: 'advanced-02', name: 'くすみローズ', recipe: ['red', 'purple', 'yellowOchre', 'white', 'white'] },
  { id: 'advanced-03', name: '茜色', recipe: ['red', 'red', 'red', 'red', 'red', 'red', 'purple', 'white'] },
  { id: 'advanced-04', name: '強い黄みの赤', recipe: ['red', 'red', 'orange', 'yellowOchre', 'white', 'white'] },
  { id: 'advanced-05', name: '明るい灰みの赤', recipe: ['red', 'lightBlue', 'yellowOchre', 'white', 'white', 'white'] },
  { id: 'advanced-06', name: '明るい黄赤', recipe: ['red', 'orange', 'orange', 'yellow', 'white', 'white'] },
  { id: 'advanced-07', name: '浅い黄赤', recipe: ['red', 'yellow', 'white', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-08', name: 'ゴールデンイエロー', recipe: ['orange', 'orange', 'orange', 'yellow', 'yellowOchre', 'white', 'white', 'white'] },
  { id: 'advanced-09', name: '卵色', recipe: ['orange', 'yellow', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-10', name: '鮮やかな黄', recipe: ['yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellow', 'yellowGreen', 'yellowOchre'] },
  { id: 'advanced-11', name: '明るい黄みの黄緑', recipe: ['yellow', 'yellowGreen', 'yellowGreen', 'yellowGreen', 'yellowOchre', 'white', 'white', 'white'] },
  { id: 'advanced-12', name: '若葉色', recipe: ['yellowGreen', 'lightBlue', 'yellowOchre', 'yellowOchre', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-13', name: '明るい緑みの黄緑', recipe: ['yellow', 'yellowGreen', 'yellowGreen', 'green', 'white', 'white', 'white'] },
  { id: 'advanced-14', name: '明るい緑', recipe: ['yellowGreen', 'green', 'green', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-15', name: '浅い青緑', recipe: ['green', 'lightBlue', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-16', name: '柔らかい緑みの青', recipe: ['green', 'lightBlue', 'lightBlue', 'lightBlue', 'lightBlue', 'lightBlue', 'blue', 'white'] },
  { id: 'advanced-17', name: '浅い青', recipe: ['lightBlue', 'blue', 'purple', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-18', name: '瑠璃色', recipe: ['red', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'purple'] },
  { id: 'advanced-19', name: '強い青紫', recipe: ['lightBlue', 'lightBlue', 'purple', 'purple', 'white'] },
  { id: 'advanced-20', name: '明るい灰みの紫', recipe: ['lightBlue', 'purple', 'purple', 'yellowOchre', 'white', 'white', 'white'] },
  { id: 'advanced-21', name: 'モーブ', recipe: ['red', 'lightBlue', 'purple', 'purple', 'purple', 'purple', 'white', 'white'] },
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
