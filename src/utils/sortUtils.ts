// src/utils/sortUtils.ts

export type SortOrder = 'asc' | 'desc' | '';
export type TextMode = 'big5' | 'locale';
export type SortType = 'text' | 'number' | 'date';

export const safeValue = (val: any): string => {
  if (val == null) return '';
  if (typeof val === 'number') return val.toString();
  return String(val);
};

export const normalize = (val: any): string => safeValue(val).trim();

/** 是否為 ASCII 開頭（英數 / 英文符號） */
export const isAsciiStart = (s: string) => /^[\x00-\x7F]/.test(s);

/** 把 '' 當成 asc（通常 caller 會在 order=='' 時直接不排序） */
const normOrder = (order: SortOrder): Exclude<SortOrder, ''> =>
  order === 'desc' ? 'desc' : 'asc';

const applyOrder = (res: number, order: SortOrder) =>
  normOrder(order) === 'desc' ? -res : res;

/** 空值處理：asc 空值最前、desc 空值最後（和你 Big5 utils 一致） */
const compareEmpty = (a: string, b: string, order: SortOrder) => {
  const aEmpty = !a;
  const bEmpty = !b;
  if (!aEmpty && !bEmpty) return null;

  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return normOrder(order) === 'asc' ? -1 : 1;
  return normOrder(order) === 'asc' ? 1 : -1;
};

/** Big5 collator（可選 numeric，預設 false 以貼近你原版） */
const big5CollatorCache = new Map<string, Intl.Collator>();
const getBig5Collator = (
  numeric = false,
  sensitivity: Intl.CollatorOptions['sensitivity'] = 'variant'
) => {
  const key = `${numeric}_${sensitivity}`;
  const cached = big5CollatorCache.get(key);
  if (cached) return cached;

  const coll = new Intl.Collator('zh-u-co-big5han', {
    usage: 'sort',
    sensitivity,
    numeric,
  });
  big5CollatorCache.set(key, coll);
  return coll;
};

/** locale collator（預設 numeric:true + base） */
const localeCollatorCache = new Map<string, Intl.Collator>();
const getLocaleCollator = (
  locale: string | undefined,
  numeric = true,
  sensitivity: Intl.CollatorOptions['sensitivity'] = 'base'
) => {
  const key = `${locale ?? 'default'}_${numeric}_${sensitivity}`;
  const cached = localeCollatorCache.get(key);
  if (cached) return cached;

  const coll = new Intl.Collator(locale, {
    usage: 'sort',
    numeric,
    sensitivity,
  });
  localeCollatorCache.set(key, coll);
  return coll;
};

/**
 * 統一的文字比較
 * - mode=big5：可模擬 Oracle Big5，預設 asciiFirst=true、numeric=false
 * - mode=locale：原本 compareLocale 的行為，預設 numeric=true、base
 * - 都包含：空值規則（asc 前 / desc 後）
 */
export const compareText = (
  aRaw: unknown,
  bRaw: unknown,
  order: SortOrder = 'asc',
  opts?: {
    mode?: TextMode;
    locale?: string; // locale 模式可指定 'zh-TW'
    asciiFirst?: boolean; // big5 通常 true
    numeric?: boolean;
    sensitivity?: Intl.CollatorOptions['sensitivity'];
  }
): number => {
  const a = normalize(aRaw);
  const b = normalize(bRaw);

  if (a === b) return 0;

  const emptyRes = compareEmpty(a, b, order);
  if (emptyRes != null) return emptyRes;

  const mode = opts?.mode ?? 'locale';

  // ASCII-first（Big5 常用規則）
  const asciiFirst = opts?.asciiFirst ?? mode === 'big5';
  if (asciiFirst) {
    const aAscii = isAsciiStart(a);
    const bAscii = isAsciiStart(b);
    if (aAscii && !bAscii) return normOrder(order) === 'asc' ? -1 : 1;
    if (!aAscii && bAscii) return normOrder(order) === 'asc' ? 1 : -1;
  }

  if (mode === 'big5') {
    const coll = getBig5Collator(
      opts?.numeric ?? false,
      opts?.sensitivity ?? 'variant'
    );
    return applyOrder(coll.compare(a, b), order);
  }

  const coll = getLocaleCollator(
    opts?.locale,
    opts?.numeric ?? true,
    opts?.sensitivity ?? 'base'
  );
  return applyOrder(coll.compare(a, b), order);
};

/** 保留原本 compareLocale 名字（其實就是 compareText 的 locale 模式） */
export const compareLocale = (a: any, b: any, order: SortOrder = 'asc') =>
  compareText(a, b, order, {
    mode: 'locale',
    numeric: true,
    sensitivity: 'base',
  });

/** Case-insensitive（FnId 常用） */
export const compareCaseInsensitive = (
  a: any,
  b: any,
  order: SortOrder = 'asc'
) => {
  const A = normalize(a);
  const B = normalize(b);

  if (A === B) return 0;

  const emptyRes = compareEmpty(A, B, order);
  if (emptyRes != null) return emptyRes;

  const AA = A.toUpperCase();
  const BB = B.toUpperCase();

  if (AA < BB) return normOrder(order) === 'desc' ? 1 : -1;
  if (AA > BB) return normOrder(order) === 'desc' ? -1 : 1;

  // 第二順位：原字串
  if (A < B) return normOrder(order) === 'desc' ? 1 : -1;
  if (A > B) return normOrder(order) === 'desc' ? -1 : 1;

  return 0;
};

/** 你改名後的 compareFnId / compareFnName */
export const compareFnId = (
  aRaw: unknown,
  bRaw: unknown,
  order: SortOrder = 'asc'
) => compareCaseInsensitive(aRaw, bRaw, order);

export const compareFnName = (
  aRaw: unknown,
  bRaw: unknown,
  order: SortOrder = 'asc'
) => {
  const a = normalize(aRaw);
  const b = normalize(bRaw);
  if (a === b) return 0;

  const emptyRes = compareEmpty(a, b, order);
  if (emptyRes != null) return emptyRes;

  // 英文 < 數字 < 中文 < 其他（維持你原本規則）
  const typeRank = (s: string) => {
    if (/^[A-Za-z]/.test(s)) return 1;
    if (/^[0-9]/.test(s)) return 2;
    if (/^[\u4E00-\u9FFF]/.test(s)) return 3;
    return 4;
  };

  const ra = typeRank(a);
  const rb = typeRank(b);

  if (ra !== rb) {
    const diff = ra - rb;
    return applyOrder(diff, order);
  }

  // 同類型內：中文用 zh-TW，其他用預設 locale
  return ra === 3
    ? compareText(a, b, order, {
        mode: 'locale',
        locale: 'zh-TW',
        numeric: true,
        sensitivity: 'base',
      })
    : compareText(a, b, order, {
        mode: 'locale',
        numeric: true,
        sensitivity: 'base',
      });
};

/** 兼容你 big5SortUtils 的 compareBizString（Big5han + ASCII-first + 空值規則） */
export const compareBizString = (
  aRaw: unknown,
  bRaw: unknown,
  order: Exclude<SortOrder, ''>
) =>
  compareText(aRaw, bRaw, order, {
    mode: 'big5',
    asciiFirst: true,
    numeric: false,
    sensitivity: 'variant',
  });

/**
 * 兼容你 big5SortUtils 的 compareByKeyWithBig5
 * 注意：若欄位是 "12" 字串，依 Big5 會當字串排；如要數字排序請在 caller 先轉 number 或用 compareByKeySmart
 */
export const compareByKeyWithBig5 = <T extends Record<string, any>>(
  a: T,
  b: T,
  key: keyof T,
  order: Exclude<SortOrder, ''>
): number => {
  const aVal = a[key];
  const bVal = b[key];

  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return order === 'asc' ? aVal - bVal : bVal - aVal;
  }

  return compareText(aVal, bVal, order, {
    mode: 'big5',
    asciiFirst: true,
    numeric: false,
  });
};

/**
 * 新增：更通用的 compareByKeySmart
 * - type='number'：Number() 成功就數字排（可處理 "12"）
 * - type='date'：Date.parse 成功就日期排
 * - type='text'：可選 big5/locale
 */
export const compareByKeySmart = <T extends Record<string, any>>(
  a: T,
  b: T,
  key: keyof T,
  order: any,
  opts?: {
    type?;
    mode?: TextMode;
    locale?: string;
  }
) => {
  const va = a[key];
  const vb = b[key];

  const type = opts?.type ?? 'auto';

  if (type === 'number' || type === 'auto') {
    const na = typeof va === 'number' ? va : Number(va);
    const nb = typeof vb === 'number' ? vb : Number(vb);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      return order === 'asc' ? na - nb : nb - na;
    }
    if (type === 'number')
      return compareText(va, vb, order, {
        mode: opts?.mode ?? 'big5',
        asciiFirst: true,
      });
  }

  if (type === 'date' || type === 'auto') {
    const ta = Date.parse(String(va ?? ''));
    const tb = Date.parse(String(vb ?? ''));
    if (!Number.isNaN(ta) && !Number.isNaN(tb)) {
      return order === 'asc' ? ta - tb : tb - ta;
    }
    if (type === 'date')
      return compareText(va, vb, order, {
        mode: opts?.mode ?? 'big5',
        asciiFirst: true,
      });
  }

  // text
  return compareText(va, vb, order, {
    mode: opts?.mode ?? 'big5',
    locale: opts?.locale,
    asciiFirst: (opts?.mode ?? 'big5') === 'big5',
  });
};
