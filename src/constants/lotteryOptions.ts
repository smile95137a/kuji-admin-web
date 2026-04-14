// src/constants/lotteryOptions.ts

export const categoryOptions = [
  { label: '官方一番賞', value: 'OFFICIAL_ICHIBAN' },
  { label: '扭蛋', value: 'GACHA' },
  { label: '卡牌', value: 'TRADING_CARD' },
  { label: '自製賞', value: 'CUSTOM_GACHA' },
];

export const playModeOptions = [
  { label: '抽籤型（LOTTERY_MODE）', value: 'LOTTERY_MODE' },
  { label: '刮刮樂型（SCRATCH_MODE）', value: 'SCRATCH_MODE' },
];

/** 僅 CUSTOM_GACHA 顯示，前端傳給後端，後端用來推算 playMode */
export const subCategoryOptions = [
  { label: '抽籤型（LOTTERY_MODE）', value: 'LOTTERY_MODE' },
  { label: '刮刮樂型（SCRATCH_MODE）', value: 'SCRATCH_MODE' },
];

export const gameModeOptions = [
  { label: '隨機（RANDOM）', value: 'RANDOM' },
  { label: '店家指定（SCRATCH_STORE）', value: 'SCRATCH_STORE' },
  { label: '玩家指定（SCRATCH_PLAYER）', value: 'SCRATCH_PLAYER' },
];

export const statusOptions = [
  { label: '草稿（DRAFT）', value: 'DRAFT' },
  { label: '上架（ON_SHELF）', value: 'ON_SHELF' },
  { label: '下架（OFF_SHELF）', value: 'OFF_SHELF' },
];

export const levelOptions = [
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'E', value: 'E' },
  { label: 'F', value: 'F' },
  { label: 'G', value: 'G' },
  { label: 'H', value: 'H' },
  { label: 'I', value: 'I' },
  { label: 'J', value: 'J' },
  { label: 'K', value: 'K' },
  { label: 'L', value: 'L' },
  { label: 'M', value: 'M' },
  { label: 'N', value: 'N' },
  { label: 'O', value: 'O' },
  { label: 'P', value: 'P' },
  { label: 'Q', value: 'Q' },
  { label: 'R', value: 'R' },
  { label: 'S', value: 'S' },
  { label: 'T', value: 'T' },
  { label: 'U', value: 'U' },
  { label: 'V', value: 'V' },
  { label: 'W', value: 'W' },
  { label: 'X', value: 'X' },
  { label: 'Y', value: 'Y' },
  { label: 'Z', value: 'Z' },
  { label: 'LAST', value: 'LAST' },
  { label: 'GRAND', value: 'GRAND' },
];

export const prizeTypeOptions = [
  { label: '實體（physical）', value: 'physical' },
  { label: '數位（digital）', value: 'digital' },
  { label: '點數（point）', value: 'point' },
];

export const boolOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
];
