// src/constants/lotteryOptions.ts

export const categoryOptions = [
  { label: '官方一番賞', value: 'OFFICIAL_ICHIBAN' },
  { label: '扭蛋', value: 'GACHA' },
  { label: '卡牌', value: 'TRADING_CARD' },
  { label: '自製賞', value: 'CUSTOM_GACHA' },
];

export const playModeOptions = [
  { label: '抽籤型', value: 'LOTTERY_MODE' },
  { label: '刮刮樂型', value: 'SCRATCH_MODE' },
];

/** 僅 CUSTOM_GACHA 顯示，前端傳給後端，後端用來推算 playMode */
export const subCategoryOptions = [
  { label: '抽籤型', value: 'LOTTERY_MODE' },
  { label: '刮刮樂型', value: 'SCRATCH_MODE' },
];

export const gameModeOptions = [
  { label: '店家指定', value: 'SCRATCH_STORE' },
  { label: '玩家指定', value: 'SCRATCH_PLAYER' },
];

export const statusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '上架', value: 'ON_SHELF' },
  { label: '下架', value: 'OFF_SHELF' },
];

export const levelOptions = [
  { label: 'A賞', value: 'A' },
  { label: 'B賞', value: 'B' },
  { label: 'C賞', value: 'C' },
  { label: 'D賞', value: 'D' },
  { label: 'E賞', value: 'E' },
  { label: 'F賞', value: 'F' },
  { label: 'G賞', value: 'G' },
  { label: 'H賞', value: 'H' },
  { label: 'I賞', value: 'I' },
  { label: 'J賞', value: 'J' },
  { label: 'K賞', value: 'K' },
  { label: 'L賞', value: 'L' },
  { label: 'M賞', value: 'M' },
  { label: 'N賞', value: 'N' },
  { label: 'O賞', value: 'O' },
  { label: 'P賞', value: 'P' },
  { label: 'Q賞', value: 'Q' },
  { label: 'R賞', value: 'R' },
  { label: 'S賞', value: 'S' },
  { label: 'T賞', value: 'T' },
  { label: 'U賞', value: 'U' },
  { label: 'V賞', value: 'V' },
  { label: 'W賞', value: 'W' },
  { label: 'X賞', value: 'X' },
  { label: 'Y賞', value: 'Y' },
  { label: 'Z賞', value: 'Z' },
  { label: '最後賞', value: 'LAST' },
  { label: '大獎', value: 'GRAND' },
];

export const prizeTypeOptions = [
  { label: '實體獎品', value: 'physical' },
  { label: '數位獎品', value: 'digital' },
  { label: '點數獎品', value: 'point' },
];
export const delistStrategyOptions = [
  { label: '大獎抽完下架', value: 'GRAND_PRIZE_DRAWN' },
  { label: '全數抽完下架', value: 'ALL_DRAWN' },
  { label: '手動下架', value: 'MANUAL' },
];
export const paymentTypeOptions = [
  { label: '遊戲幣', value: 'GOLD' },
  { label: '紅利點數', value: 'BONUS' },
];

export const boolOptions = [
  { label: '是', value: true },
  { label: '否', value: false },
];
