// src/validations/lotteryWithPrizesSchema.ts
import * as yup from 'yup';

export const lotteryWithPrizesSchema = yup.object({
  storeId: yup.string().notRequired(),

  title: yup.string().required('商品名稱不可為空'),
  category: yup.string().required('分類不可為空'),

  subCategory: yup.string().notRequired(),
  playMode: yup.string().notRequired(),
  gameMode: yup.string().notRequired(),
  designatedPrizeNumbers: yup.string().notRequired(),
  status: yup.string().notRequired(),

  pricePerDraw: yup
    .number()
    .typeError('每抽價格必須為數字')
    .min(0, '價格不可為負數')
    .required('每抽價格不可為空'),

  maxDraws: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(0, '抽數上限不可為負數')
    .notRequired(),

  hotCount: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(0, '熱門程度不可為負數')
    .notRequired(),

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

  discountedPrice: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(0, '折扣價不可為負數')
    .notRequired(),

  autoDiscountEnabled: yup.boolean().notRequired(),
  allowMultiDraw: yup.boolean().notRequired(),
  multiDrawOptionsText: yup.string().notRequired(),

  pendingDesignatedPrizeNumber: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(1, '號碼不可小於 1')
    .notRequired(),

  bonusEnabled: yup.boolean().notRequired(),
  bonusPointsPerDraw: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(0, '紅利點數不可為負數')
    .notRequired(),

  bonusCostPerDraw: yup
    .number()
    .transform((v, o) => (o === '' || o == null ? undefined : v))
    .min(0, '紅利消耗不可為負數')
    .notRequired(),
});

/** （建議）一起抽出去：避免 schema 跟 initialValues 分散兩地 */
export const lotteryWithPrizesInitialValues = {
  storeId: '',

  title: '',
  category: 'OFFICIAL_ICHIBAN',
  subCategory: '',
  playMode: 'LOTTERY_MODE',
  gameMode: '',
  designatedPrizeNumbers: '',
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
};
