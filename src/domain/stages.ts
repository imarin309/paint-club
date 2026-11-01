import { mixColor } from './paintMixing.ts';
import type { Difficulty, Pigment, RgbColor, Stage } from './types.ts';

export type Course = { label: string; pigments: readonly Pigment[]; stages: readonly Stage[] };

export const STAGES_PER_RUN = 5;

// 正解レシピはプレイヤーに見せない。お題名は JIS の慣用色名から近い色を選び、近いものがなければ、その色を思い浮かべやすい身近なものの名前にしている。
// どのお題も、その難易度で使える塗料の単色1滴では高得点にならない（scoring.test.ts で確認）
// 初級は比率を考えずに済むよう、6色から2色を1滴ずつ選ぶ15通りだけにしている
const BEGINNER_STAGES: readonly Stage[] = [
  { id: 'beginner-01', name: '赤ワイン', recipe: ['red', 'black'] },
  { id: 'beginner-02', name: 'ローズ', recipe: ['red', 'white'] },
  { id: 'beginner-03', name: 'にんじん', recipe: ['red', 'yellow'] },
  { id: 'beginner-04', name: 'オリーブの実', recipe: ['yellow', 'black'] },
  { id: 'beginner-05', name: '菜の花色', recipe: ['yellow', 'white'] },
  { id: 'beginner-06', name: '海苔', recipe: ['red', 'green'] },
  { id: 'beginner-07', name: '芝生', recipe: ['yellow', 'green'] },
  { id: 'beginner-08', name: 'ほうれん草', recipe: ['yellow', 'blue'] },
  { id: 'beginner-09', name: '若竹色', recipe: ['green', 'white'] },
  { id: 'beginner-10', name: '森の奥', recipe: ['green', 'black'] },
  { id: 'beginner-11', name: '深い湖', recipe: ['green', 'blue'] },
  { id: 'beginner-12', name: 'ヤグルマギク', recipe: ['blue', 'white'] },
  { id: 'beginner-13', name: 'ネイビーブルー', recipe: ['blue', 'black'] },
  { id: 'beginner-14', name: 'ブルーベリー', recipe: ['red', 'blue'] },
  { id: 'beginner-15', name: '墨', recipe: ['white', 'black'] },
];

// 中級は3〜4滴で、橙・水色・紫のどれかを使う。お題どうしを ΔE 20 以上離し、似た色で数を水増ししない
const INTERMEDIATE_STAGES: readonly Stage[] = [
  { id: 'intermediate-01', name: '黒豆', recipe: ['red', 'purple', 'black', 'black'] },
  { id: 'intermediate-02', name: 'ぶどうヨーグルト', recipe: ['red', 'lightBlue', 'white'] },
  { id: 'intermediate-03', name: 'ビーツ', recipe: ['red', 'red', 'lightBlue', 'purple'] },
  { id: 'intermediate-04', name: '真紅', recipe: ['red', 'red', 'purple'] },
  { id: 'intermediate-05', name: 'テラコッタ', recipe: ['orange', 'purple', 'white'] },
  { id: 'intermediate-06', name: '柿色', recipe: ['red', 'orange', 'white'] },
  { id: 'intermediate-07', name: 'しょうゆ', recipe: ['red', 'orange', 'black'] },
  { id: 'intermediate-08', name: 'かりんとう', recipe: ['orange', 'orange', 'orange', 'black'] },
  { id: 'intermediate-09', name: 'ミルクティー', recipe: ['yellow', 'purple', 'white', 'white'] },
  { id: 'intermediate-10', name: 'はちみつ', recipe: ['orange', 'yellow', 'yellow', 'purple'] },
  { id: 'intermediate-11', name: '山吹色', recipe: ['orange', 'yellow', 'yellow', 'yellow'] },
  { id: 'intermediate-12', name: 'からし', recipe: ['orange', 'yellow', 'yellow', 'lightBlue'] },
  { id: 'intermediate-13', name: 'キウイ', recipe: ['orange', 'yellow', 'yellow', 'green'] },
  { id: 'intermediate-14', name: 'メロン', recipe: ['yellow', 'lightBlue', 'white'] },
  { id: 'intermediate-15', name: 'セージ', recipe: ['orange', 'lightBlue', 'lightBlue', 'white'] },
  { id: 'intermediate-16', name: 'ピーマン', recipe: ['yellow', 'green', 'green', 'lightBlue'] },
  { id: 'intermediate-17', name: 'ひすい', recipe: ['green', 'green', 'lightBlue', 'white'] },
  { id: 'intermediate-18', name: '浅葱色', recipe: ['green', 'lightBlue', 'lightBlue', 'lightBlue'] },
  { id: 'intermediate-19', name: '空色', recipe: ['lightBlue', 'white', 'white'] },
  { id: 'intermediate-20', name: 'あじさい', recipe: ['lightBlue', 'lightBlue', 'purple', 'white'] },
  { id: 'intermediate-21', name: 'サファイア', recipe: ['lightBlue', 'blue', 'blue'] },
  { id: 'intermediate-22', name: '紺青', recipe: ['blue', 'blue', 'purple', 'black'] },
];

// 上級は、全12色を使っても MASTER に5滴以上かかる色にする。茶・黄土・黄緑で作れる色は中級の9色でもほぼ作れるため、塗料の数では難しさが変わらない
const ADVANCED_STAGES: readonly Stage[] = [
  { id: 'advanced-01', name: 'ぶどうジュース', recipe: ['red', 'red', 'purple', 'purple', 'purple', 'black'] },
  { id: 'advanced-02', name: 'くすみローズ', recipe: ['red', 'purple', 'yellowOchre', 'white', 'white'] },
  { id: 'advanced-03', name: '茜色', recipe: ['red', 'red', 'red', 'red', 'red', 'red', 'purple', 'white'] },
  { id: 'advanced-04', name: '金魚', recipe: ['red', 'red', 'orange', 'yellowOchre', 'white', 'white'] },
  { id: 'advanced-05', name: 'ミルクココア', recipe: ['red', 'lightBlue', 'yellowOchre', 'white', 'white', 'white'] },
  { id: 'advanced-06', name: 'みかん', recipe: ['red', 'orange', 'orange', 'yellow', 'white', 'white'] },
  { id: 'advanced-07', name: 'あんず', recipe: ['red', 'yellow', 'white', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-08', name: 'ゴールデンイエロー', recipe: ['orange', 'orange', 'orange', 'yellow', 'yellowOchre', 'white', 'white', 'white'] },
  { id: 'advanced-09', name: '卵色', recipe: ['orange', 'yellow', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-11', name: '青りんご', recipe: ['yellow', 'yellowGreen', 'yellowGreen', 'yellowGreen', 'yellowOchre', 'white', 'white', 'white'] },
  { id: 'advanced-12', name: '抹茶ラテ', recipe: ['yellowGreen', 'lightBlue', 'yellowOchre', 'yellowOchre', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-13', name: '枝豆', recipe: ['yellow', 'yellowGreen', 'yellowGreen', 'green', 'white', 'white', 'white'] },
  { id: 'advanced-14', name: '新緑', recipe: ['yellowGreen', 'green', 'green', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-15', name: 'ミントアイス', recipe: ['green', 'lightBlue', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-16', name: '南の海', recipe: ['green', 'lightBlue', 'lightBlue', 'lightBlue', 'lightBlue', 'lightBlue', 'blue', 'white'] },
  { id: 'advanced-17', name: 'ネモフィラ', recipe: ['lightBlue', 'blue', 'purple', 'white', 'white', 'white', 'white'] },
  { id: 'advanced-18', name: '瑠璃色', recipe: ['red', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'purple'] },
  { id: 'advanced-19', name: 'すみれ', recipe: ['lightBlue', 'lightBlue', 'purple', 'purple', 'white'] },
  { id: 'advanced-20', name: '鳩羽色', recipe: ['lightBlue', 'purple', 'purple', 'yellowOchre', 'white', 'white', 'white'] },
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
