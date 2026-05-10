// src/validations/lotteryWithPrizesSchema.ts
import * as yup from 'yup';

const optionalNumber = (message: string) =>
  yup
    .number()
    .transform((value, originalValue) => {
      if (
        originalValue === '' ||
        originalValue === null ||
        originalValue === undefined
      ) {
        return undefined;
      }

      return value;
    })
    .typeError(message)
    .nullable()
    .notRequired();

const requiredNumber = (typeErrorMessage: string, requiredMessage: string) =>
  yup
    .number()
    .transform((value, originalValue) => {
      if (
        originalValue === '' ||
        originalValue === null ||
        originalValue === undefined
      ) {
        return undefined;
      }

      return value;
    })
    .typeError(typeErrorMessage)
    .required(requiredMessage);

const isEnabled = (value: any) => value === true || value === 'true';

const commaNumberTextSchema = (label: string) =>
  yup
    .string()
    .notRequired()
    .test(
      'comma-number-text',
      `${label}格式錯誤，請使用逗號分隔數字`,
      (value) => {
        if (!value) return true;

        return String(value)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .every((item) => /^\d+$/.test(item) && Number(item) > 0);
      },
    );

const prizeSchema = yup.object({
  _key: yup.string().notRequired(),

  id: yup.string().notRequired(),

  name: yup.string().trim().required('獎品名稱不可為空'),

  quantity: requiredNumber('獎品數量必須為數字', '獎品數量不可為空').min(
    1,
    '獎品數量必須大於或等於 1',
  ),

  level: yup.string().notRequired(),

  prizeType: yup.string().notRequired(),

  pointValue: optionalNumber('點數價值必須為數字').when('prizeType', {
    is: 'point',
    then: (schema) =>
      schema.required('點數獎品需輸入點數價值').min(0, '點數價值不可為負數'),
    otherwise: (schema) => schema.notRequired(),
  }),

  prizeNumber: yup.string().notRequired(),

  isLastPrize: yup.boolean().notRequired(),

  isGrandPrize: yup.boolean().notRequired(),

  orderNum: optionalNumber('排序必須為數字').min(0, '排序不可為負數'),

  imageUrl: yup.string().notRequired(),

  description: yup.string().notRequired(),
});

export const lotteryWithPrizesSchema = yup
  .object({
    storeId: yup.string().notRequired(),

    title: yup.string().trim().required('商品名稱不可為空'),
    category: yup.string().trim().required('分類不可為空'),

    subCategory: yup.string().notRequired(),
    playMode: yup.string().notRequired(),
    gameMode: yup.string().notRequired(),

    designatedPrizeNumbers: commaNumberTextSchema('指定獎號'),

    delistStrategy: yup.string().notRequired(),

    paymentType: yup
      .string()
      .required('付款方式不可為空')
      .oneOf(['GOLD', 'BONUS'], '付款方式必須為 GOLD 或 BONUS'),

    freeDrawThreshold: optionalNumber('免費抽門檻必須為數字').min(
      1,
      '免費抽門檻必須大於或等於 1',
    ),

    status: yup.string().notRequired(),

    pricePerDraw: requiredNumber('每抽價格必須為數字', '每抽價格不可為空').min(
      0,
      '價格不可為負數',
    ),

    maxDraws: optionalNumber('抽數上限必須為數字').min(0, '抽數上限不可為負數'),

    hotCount: optionalNumber('熱門程度必須為數字').min(0, '熱門程度不可為負數'),

    theme: yup.string().notRequired(),

    imageUrl: yup.string().notRequired(),
    galleryImagesText: yup.string().notRequired(),

    description: yup.string().notRequired(),
    content: yup.string().notRequired(),
    tagsText: yup.string().notRequired(),

    remark: yup.string().notRequired(),

    scheduledAt: yup.string().notRequired(),
    startTime: yup.string().notRequired(),
    endTime: yup.string().notRequired(),

    discountedPrice: optionalNumber('折扣價必須為數字').min(
      0,
      '折扣價不可為負數',
    ),

    autoDiscountEnabled: yup.boolean().notRequired(),

    allowMultiDraw: yup.boolean().notRequired(),

    multiDrawOptionsText: yup.string().when('allowMultiDraw', {
      is: isEnabled,
      then: (schema) =>
        schema
          .trim()
          .required('請輸入連抽選項')
          .test(
            'multi-draw-options-text',
            '連抽選項格式錯誤，請使用逗號分隔數字',
            (value) => {
              if (!value) return false;

              return String(value)
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
                .every((item) => /^\d+$/.test(item) && Number(item) > 0);
            },
          ),
      otherwise: (schema) => schema.notRequired(),
    }),

    pendingDesignatedPrizeNumber: optionalNumber('指定獎號必須為數字').min(
      1,
      '號碼不可小於 1',
    ),

    bonusEnabled: yup.boolean().notRequired(),

    bonusPointsPerDraw: optionalNumber('紅利點數必須為數字').when(
      'bonusEnabled',
      {
        is: isEnabled,
        then: (schema) =>
          schema
            .required('啟用紅利時，紅利點數不可為空')
            .min(0, '紅利點數不可為負數'),
        otherwise: (schema) => schema.notRequired(),
      },
    ),

    bonusCostPerDraw: optionalNumber('紅利消耗必須為數字').when(
      'bonusEnabled',
      {
        is: isEnabled,
        then: (schema) =>
          schema
            .required('啟用紅利時，紅利消耗不可為空')
            .min(0, '紅利消耗不可為負數'),
        otherwise: (schema) => schema.notRequired(),
      },
    ),

    prizes: yup.array().of(prizeSchema).min(1, '請至少新增 1 個獎品'),
  })
  .test('valid-time-range', '結束時間不可早於開始時間', function (values) {
    const startTime = values?.startTime;
    const endTime = values?.endTime;

    if (!startTime || !endTime) return true;

    if (new Date(endTime).getTime() >= new Date(startTime).getTime()) {
      return true;
    }

    return this.createError({
      path: 'endTime',
      message: '結束時間不可早於開始時間',
    });
  })
  .test('scratch-single-grand-prize', '刮刮樂獎品規則不合法', function (values) {
    const isScratch =
      String(values?.subCategory || '') === 'SCRATCH_MODE' ||
      String(values?.playMode || '') === 'SCRATCH_MODE' ||
      ['SCRATCH_STORE', 'SCRATCH_PLAYER'].includes(String(values?.gameMode || ''));

    if (!isScratch) return true;

    const prizes = Array.isArray(values?.prizes)
      ? values.prizes.filter((item: any) => String(item?.name || '').trim())
      : [];

    if (prizes.length !== 1) {
      return this.createError({
        path: 'prizes',
        message: '刮刮樂模式只允許 1 筆大獎獎品。',
      });
    }

    const prize = prizes[0];
    if (prize?.isGrandPrize !== true) {
      return this.createError({
        path: 'prizes',
        message: '刮刮樂模式唯一的獎品必須標記為大獎。',
      });
    }

    if (Number(prize?.quantity ?? 0) !== 1) {
      return this.createError({
        path: 'prizes',
        message: '刮刮樂模式唯一的大獎數量必須為 1。',
      });
    }

    if (String(prize?.level || '').toUpperCase() !== 'GRAND') {
      return this.createError({
        path: 'prizes',
        message: '刮刮樂模式唯一的大獎 level 必須固定為 GRAND。',
      });
    }

    return true;
  });

export const lotteryWithPrizesInitialValues = {
  storeId: '',

  title: '',
  category: 'OFFICIAL_ICHIBAN',
  subCategory: '',
  playMode: 'LOTTERY_MODE',
  gameMode: '',
  designatedPrizeNumbers: '',
  delistStrategy: '',
  paymentType: 'GOLD',
  freeDrawThreshold: undefined as any,
  status: 'DRAFT',

  pricePerDraw: 0,
  maxDraws: 0,

  hotCount: undefined as any,
  theme: '',

  imageUrl: '',
  galleryImagesText: '',

  description: '',
  content: '',
  tagsText: '',

  remark: '',

  scheduledAt: '',
  startTime: '',
  endTime: '',

  discountedPrice: undefined as any,
  autoDiscountEnabled: false,

  allowMultiDraw: true,
  multiDrawOptionsText: '10',

  pendingDesignatedPrizeNumber: undefined as any,

  bonusEnabled: false,
  bonusPointsPerDraw: undefined as any,
  bonusCostPerDraw: undefined as any,

  prizes: [] as any[],
};
