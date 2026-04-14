<!-- src/views/lottery-with-prizes/AdminLotteryWithPrizesForm.vue -->
<template>
  <div class="lotteryWithPrizesForm">
    <MCard>
      <div class="lotteryWithPrizesForm__header">
        <p class="lotteryWithPrizesForm__title">
          {{ isEdit ? '編輯商品與獎品' : '新增商品與獎品' }}
        </p>
      </div>

      <!-- 商品資訊 -->
      <div class="lotteryWithPrizesForm__section">
        <p class="lotteryWithPrizesForm__sectionTitle">商品資訊</p>

        <div class="lotteryWithPrizesForm__grid">
          <AdminLotteryWithPrizesBasicFields
            :storeOptions="storeOptions"
            :categoryOptions="categoryOptions"
            :subCategoryOptions="subCategoryOptions"
            :gameModeOptions="gameModeOptions"
            :themeOptions="themeOptions"
            :statusOptions="statusOptions"
            :boolOptions="boolOptions"
            :isAdmin="isAdmin"
          />
        </div>
        <MCard class="m-t-12">
          <div class="lotteryWithPrizesForm__grid">
            <div class="w-100 p-6">
              <p class="form__text form__text--red">商品詳細內容（content）</p>
              <Ckeditor
                :editor="ckeditorEditor"
                v-model="content"
                :config="editorConfig"
              />
              <p class="error-text m-t-8" v-if="errors.content">
                {{ errors.content }}
              </p>
            </div>
          </div>
          <div class="lotteryWithPrizesForm__grid">
            <div class="w-50 w-md-100 p-6">
              <UploadDropzone
                label="商品主圖"
                accept="image/*"
                :disabled="uploading || cropOpen"
                :fileName="mainUploadFileName"
                :errorMessage="mainUploadErrorMessage"
                :statusText="
                  uploading ? '上傳中...' : cropOpen ? '裁切中...' : ''
                "
                :showDecorIcons="true"
                :showClear="true"
                @select="handleSelectedMainImage"
                @clear="clearMainSelectedFileUi"
              />

              <div class="flex gap-x-12 m-t-12" v-if="imageUrl">
                <MButton
                  type="button"
                  variant="secondary"
                  :disabled="uploading || cropOpen"
                  @click="clearMainImage"
                >
                  清除圖片
                </MButton>
                <p class="form__text" v-if="uploading">上傳中...</p>
              </div>

              <div v-if="mainImagePreview" class="m-t-12">
                <img
                  :src="mainImagePreview"
                  alt="preview"
                  style="
                    width: 180px;
                    height: 180px;
                    object-fit: cover;
                    border-radius: 8px;
                  "
                />
              </div>
            </div>
            <div class="w-50 w-md-100 p-6">
              <UploadDropzone
                label="商品圖集"
                accept="image/*"
                :disabled="uploading || cropOpen"
                :fileName="galleryUploadFileName"
                :errorMessage="galleryUploadErrorMessage"
                :statusText="
                  uploading ? '上傳中...' : cropOpen ? '裁切中...' : ''
                "
                :showDecorIcons="true"
                :showClear="true"
                @select="handleSelectedGalleryImage"
                @clear="clearGallerySelectedFileUi"
              />
              <div class="m-t-12">
                <FormInput
                  label="商品圖集 URL（逗號分隔，可直接貼 / 編輯）"
                  v-model="galleryImagesText"
                  :error="errors.galleryImagesText"
                  placeholder="https://a.jpg, https://b.jpg"
                  @blur="syncGalleryArrayFromText"
                />
              </div>
              <div class="m-t-12" v-if="galleryImageUrls.length">
                <div class="m-t-12">
                  <MButton
                    type="button"
                    variant="secondary"
                    :disabled="uploading || cropOpen"
                    @click="clearGalleryImages"
                  >
                    清空圖集
                  </MButton>
                </div>
                <p class="form__text">
                  目前圖集（{{ galleryImageUrls.length }} 張）
                </p>

                <div class="flex flex-wrap gap-12 m-t-8">
                  <div
                    v-for="(url, i) in galleryImageUrls"
                    :key="url + '_' + i"
                    class="lotteryWithPrizesForm__galleryItem"
                  >
                    <img
                      :src="url"
                      alt="gallery-preview"
                      class="lotteryWithPrizesForm__galleryImg"
                    />

                    <!-- 紅色叉叉（右上角浮動） -->
                    <button
                      type="button"
                      class="lotteryWithPrizesForm__galleryRemove"
                      :disabled="uploading || cropOpen"
                      aria-label="移除圖片"
                      @click="removeGalleryImage(i)"
                    >
                      <font-awesome-icon
                        icon="fa-solid fa-xmark"
                        class="lotteryWithPrizesForm__galleryRemoveIcon"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MCard>
      </div>
    </MCard>
    <MCard>
      <!-- 獎品清單 -->
      <div class="lotteryWithPrizesForm__section">
        <div class="lotteryWithPrizesForm__sectionHeader">
          <p class="lotteryWithPrizesForm__sectionTitle">獎品清單</p>
          <MButton size="sm" variant="secondary" @click="addPrize"
            >+ 新增獎品</MButton
          >
        </div>

        <div v-if="prizes.length === 0" class="lotteryWithPrizesForm__empty">
          尚未建立獎品（建議至少新增 1 個）
        </div>

        <PrizeFormCard
          v-for="(p, idx) in prizes"
          :key="p._key"
          v-model:prize="prizes[idx]"
          :index="idx"
          :playMode="playMode"
          :levelOptions="levelOptions"
          :prizeTypeOptions="prizeTypeOptions"
          :boolOptions="boolOptions"
          :uploading="uploading"
          :cropOpen="cropOpen"
          :uploadFileName="prizeUploadFileNames[p._key] || ''"
          :uploadErrorMessage="prizeUploadErrorMessages[p._key] || null"
          @remove="removePrize(idx)"
          @selectImage="
            (file) => handleSelectedPrizeImage(file, prizes[idx], idx)
          "
          @clearImage="() => clearPrizeImage(prizes[idx])"
        />
      </div>
    </MCard>

    <!-- T021/T022 — Designation info bars (scratch only, edit mode) -->
    <template v-if="isEdit">
      <!-- SCRATCH_STORE + PENDING -->
      <MCard
        v-if="gameMode === 'SCRATCH_STORE' && lotteryDesignationStatus === 'PENDING'"
        style="border-left:4px solid #d46b08;background:#fff7e6;"
        class="m-t-12"
      >
        <div class="flex items-center justify-between flex-wrap gap-x-12" style="padding:12px 16px;">
          <span style="color:#d46b08;font-size:13px;">
            ⚠️ 此刮刮樂商品（店家指定模式）尚未完成大獎號碼指定。開始抽獎前需先指定大獎號碼。
          </span>
          <MButton size="sm" @click="showDesignateModal = true">前往指定大獎號碼</MButton>
        </div>
      </MCard>

      <!-- SCRATCH_STORE + DESIGNATED -->
      <MCard
        v-if="gameMode === 'SCRATCH_STORE' && lotteryDesignationStatus === 'DESIGNATED'"
        style="border-left:4px solid #52c41a;background:#f6ffed;"
        class="m-t-12"
      >
        <div style="padding:12px 16px;color:#389e0d;font-size:13px;">
          ✅ 大獎號碼已完成指定，可開始抽獎。
        </div>
      </MCard>

      <!-- SCRATCH_PLAYER -->
      <MCard
        v-if="gameMode === 'SCRATCH_PLAYER'"
        style="border-left:4px solid #1890ff;background:#e6f7ff;"
        class="m-t-12"
      >
        <div style="padding:12px 16px;color:#005a99;font-size:13px;">
          ℹ️ 此刮刮樂商品（玩家指定模式）：玩家購票後自行指定大獎號碼，無需店家操作。
        </div>
      </MCard>
    </template>

    <!-- T022 — DesignatePrizeModal -->
    <DesignatePrizeModal
      v-if="isEdit"
      :show="showDesignateModal"
      :lotteryId="id ?? ''"
      :lotteryName="String(title ?? '')"
      :maxDraws="Number(maxDraws ?? 1)"
      @close="showDesignateModal = false"
      @success="onDesignateSuccess"
    />

    <MCard>
      <div class="lotteryWithPrizesForm__actions">
        <MButton variant="secondary" @click="goBack">返回</MButton>
        <MButton :disabled="uploading || cropOpen" @click="onSubmit">
          儲存
        </MButton>
      </div>
    </MCard>
    <ImageCropDialog
      v-model="cropOpen"
      :src="cropSrc"
      :title="cropTitle"
      :aspectRatio="cropAspectRatio"
      :outputWidth="cropOutputWidth"
      mimeType="image/jpeg"
      :quality="0.9"
      :fileName="cropFileName"
      @cancel="onCropCancel"
      @confirm="onCropConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import AdminLotteryWithPrizesBasicFields from '@/components/lottery-with-prizes/AdminLotteryWithPrizesBasicFields.vue';
import PrizeFormCard, {
  type PrizeFormRow,
} from '@/components/lottery-with-prizes/PrizeFormCard.vue';
import DesignatePrizeModal from '@/components/lottery-with-prizes/DesignatePrizeModal.vue';

import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useForm } from 'vee-validate';

/* CKEditor */
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';

import MCard from '@/components/common/MCard.vue';
import MButton from '@/components/common/MButton.vue';
import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import UploadDropzone from '@/components/common/UploadDropzone.vue';
import ImageCropDialog from '@/components/common/ImageCropDialog.vue';

import { useDialogStore } from '@/stores';
import { useAuthStore } from '@/stores';

import {
  createLotteryWithPrizes,
  updateLotteryWithPrizes,
  getLotteryWithPrizes,
} from '@/services/adminLotteryWithPrizesService';

import { getStoreOptions } from '@/services/adminStoreService';
import {
  uploadLotteryImage,
  uploadPrizeImage,
} from '@/services/adminUploadService';

import { generateUUID } from '@/utils/RandomUtils';

import { queryThemes } from '@/services/adminCategoryService';

import {
  categoryOptions,
  subCategoryOptions,
  gameModeOptions,
  statusOptions,
  levelOptions,
  prizeTypeOptions,
  boolOptions,
} from '@/constants/lotteryOptions';
import {
  lotteryWithPrizesInitialValues,
  lotteryWithPrizesSchema,
} from '@/validators/lotteryWithPrizesSchema';

const ckeditorEditor = ClassicEditor as unknown as {
  create(...args: any[]): Promise<any>;
};

const router = useRouter();
const route = useRoute();
const dialogStore = useDialogStore();
const authStore = useAuthStore();

const id = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => !!id.value);

/** isAdmin 判斷（可依實際後端 role 欄位名稱調整） */
const isAdmin = computed(() => {
  const role = String(authStore.user?.role ?? authStore.user?.roleCode ?? '').toUpperCase();
  return ['ADMIN', 'SUPER_ADMIN'].includes(role);
});

/** ========== 店家下拉 ========== */
const storeOptions = ref<SelectOption[]>([]);

/** ========== 主題下拉 ========== */
const themeOptions = ref<SelectOption[]>([]);

const loadThemeOptions = async () => {
  try {
    const res = await queryThemes();
    const data = (res as any)?.data ?? res;
    themeOptions.value = (Array.isArray(data) ? data : []).map((t: any) => ({
      label: t?.label ?? t?.name ?? t,
      value: t?.value ?? t?.name ?? t,
    }));
  } catch {
    themeOptions.value = [];
  }
};

const mapEnumOptionsToSelect = (list: any[] = []): SelectOption[] =>
  list.map((x) => ({
    label: x?.label ?? '',
    value: x?.value ?? '',
    ...(x?.description ? { description: x.description } : {}),
  }));

const ensureStoreOptionExists = (storeIdValue: string) => {
  if (!storeIdValue) return;
  const exists = storeOptions.value.some((o) => o.value === storeIdValue);
  if (!exists) {
    storeOptions.value.unshift({
      label: `店家（${storeIdValue}）`,
      value: storeIdValue,
    });
  }
};

const loadStoreOptions = async () => {
  try {
    const res = await getStoreOptions({ activeOnly: true });
    const data = (res as any)?.data ?? res;
    storeOptions.value = mapEnumOptionsToSelect(
      Array.isArray(data) ? data : [],
    );
    ensureStoreOptionExists(storeId.value);
  } catch (e) {
    storeOptions.value = [];
  }
};

/** ========== helpers ========== */
const cleanText = (v: any) => (v === '' ? undefined : v);

const parseCsvText = (text: string) =>
  (text || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const toLocalDateTimeOrUndefined = (v: string) => {
  if (!v) return undefined;
  return v;
};

const parseMultiDrawOptions = (text: string) => {
  if (!text) return [];
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0);
};

/** ========== useForm ========== */
const { defineField, errors, setValues, handleSubmit } = useForm({
  validationSchema: lotteryWithPrizesSchema,
  initialValues: lotteryWithPrizesInitialValues,
});

const [storeId] = defineField('storeId');
const [playMode] = defineField('playMode');
const [subCategory] = defineField('subCategory');

const [imageUrl] = defineField('imageUrl');
const [galleryImagesText] = defineField('galleryImagesText');

const [content] = defineField('content');

/* T022 — named refs needed for DesignatePrizeModal props */
const [title] = defineField('title');
const [maxDraws] = defineField('maxDraws');
const [gameMode] = defineField('gameMode');

/* T021 — designation status local state */
const lotteryDesignationStatus = ref<string | null>(null);

/* T022 — modal state */
const showDesignateModal = ref(false);

const onDesignateSuccess = async () => {
  showDesignateModal.value = false;
  await loadDetail();
};

/** ========== prizes (local state) ========== */
const prizes = reactive<PrizeFormRow[]>([]);

const addPrize = () => {
  prizes.push({
    _key: generateUUID(),
    name: '',
    quantity: 1,
    level: 'A',

    prizeType: 'physical',
    pointValue: undefined,

    prizeNumber: '',
    isLastPrize: false,
    isGrandPrize: false,

    orderNum: undefined,
  });
};

const removePrize = (index: number) => prizes.splice(index, 1);

const goBack = () => router.push('/home/lottery-with-prizes');

/** ==========  Upload + Crop（主圖/圖集/獎品圖共用） ========== */
const uploading = ref(false);

/* main image UI */
const mainImagePreview = ref('');
const mainUploadFileName = ref('');
const mainUploadErrorMessage = ref<string | null>(null);

const clearMainSelectedFileUi = () => {
  mainUploadFileName.value = '';
  mainUploadErrorMessage.value = null;
};

/* prize image UI */
const prizeUploadFileNames = reactive<Record<string, string>>({});
const prizeUploadErrorMessages = reactive<Record<string, string | null>>({});

const clearPrizeUi = (key: string) => {
  prizeUploadFileNames[key] = '';
  prizeUploadErrorMessages[key] = null;
};

const clearPrizeImage = (p: PrizeFormRow) => {
  p.imageUrl = '';
  clearPrizeUi(p._key);
};

const galleryImageUrls = ref<string[]>([]);
const galleryUploadFileName = ref('');
const galleryUploadErrorMessage = ref<string | null>(null);

const syncGalleryTextFromArray = () => {
  galleryImagesText.value = galleryImageUrls.value.join(',');
};

const syncGalleryArrayFromText = () => {
  galleryImageUrls.value = parseCsvText(galleryImagesText.value);
};

const removeGalleryImage = (index: number) => {
  galleryImageUrls.value.splice(index, 1);
  syncGalleryTextFromArray();
};

const clearGalleryImages = () => {
  galleryImageUrls.value = [];
  galleryImagesText.value = '';
};

const clearGallerySelectedFileUi = () => {
  galleryUploadFileName.value = '';
  galleryUploadErrorMessage.value = null;
};

/* crop dialog */
type CropTarget =
  | { type: 'main' }
  | { type: 'gallery' }
  | { type: 'prize'; prizeKey: string; prizeIndex: number };

const cropOpen = ref(false);
const cropSrc = ref('');
const cropFileName = ref('cropped.jpg');
const cropTarget = ref<CropTarget | null>(null);

const cropTitle = computed(() => {
  if (!cropTarget.value) return '裁切圖片';
  if (cropTarget.value.type === 'main') return '裁切 商品主圖（1:1）';
  if (cropTarget.value.type === 'gallery') return '裁切 商品圖集（1:1）';
  return `裁切 獎品圖片（#${cropTarget.value.prizeIndex + 1}，1:1）`;
});

/**  全部固定 1:1 */
const cropAspectRatio = computed(() => 1);

/** 輸出尺寸可不同，但比例固定 1:1 */
const cropOutputWidth = computed(() => {
  if (!cropTarget.value) return 800;
  if (cropTarget.value.type === 'prize') return 600;
  return 800; // main / gallery
});

const revokeCropSrc = () => {
  if (cropSrc.value) {
    URL.revokeObjectURL(cropSrc.value);
    cropSrc.value = '';
  }
};

const onCropCancel = () => {
  cropOpen.value = false;
  cropTarget.value = null;
  revokeCropSrc();
};

onBeforeUnmount(() => {
  revokeCropSrc();
});

/* 共用驗檔 */
const validateImageFile = async (file: File) => {
  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '圖片大小不可超過 5MB',
      iconType: 'warning',
    });
    return '圖片大小不可超過 5MB';
  }

  if (!file.type.startsWith('image/')) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: '請選擇圖片檔案',
      iconType: 'warning',
    });
    return '請選擇圖片檔案';
  }

  return null;
};

/* 主圖：選檔 -> 開裁切 */
const handleSelectedMainImage = async (file: File) => {
  mainUploadErrorMessage.value = null;

  const err = await validateImageFile(file);
  if (err) {
    mainUploadErrorMessage.value = err;
    clearMainSelectedFileUi();
    return;
  }

  mainUploadFileName.value = file.name;

  revokeCropSrc();
  cropSrc.value = URL.createObjectURL(file);

  const base = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  cropFileName.value = `${base}-cropped.jpg`;

  cropTarget.value = { type: 'main' };
  cropOpen.value = true;
};

const syncMainPreviewFromUrl = () => {
  mainImagePreview.value = imageUrl.value || '';
};

const clearMainImage = () => {
  imageUrl.value = '';
  mainImagePreview.value = '';
};

/* 圖集：選檔 -> 開裁切（一次加入一張） */
const handleSelectedGalleryImage = async (file: File) => {
  galleryUploadErrorMessage.value = null;

  const err = await validateImageFile(file);
  if (err) {
    galleryUploadErrorMessage.value = err;
    clearGallerySelectedFileUi();
    return;
  }

  galleryUploadFileName.value = file.name;

  revokeCropSrc();
  cropSrc.value = URL.createObjectURL(file);

  const base = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  cropFileName.value = `${base}-cropped.jpg`;

  cropTarget.value = { type: 'gallery' };
  cropOpen.value = true;
};

/* 獎品圖：選檔 -> 開裁切 */
const handleSelectedPrizeImage = async (
  file: File,
  p: PrizeFormRow,
  idx: number,
) => {
  prizeUploadErrorMessages[p._key] = null;

  const err = await validateImageFile(file);
  if (err) {
    prizeUploadErrorMessages[p._key] = err;
    clearPrizeUi(p._key);
    return;
  }

  prizeUploadFileNames[p._key] = file.name;

  revokeCropSrc();
  cropSrc.value = URL.createObjectURL(file);

  const base = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  cropFileName.value = `${base}-cropped.jpg`;

  cropTarget.value = { type: 'prize', prizeKey: p._key, prizeIndex: idx };
  cropOpen.value = true;
};

/* 裁切確認 -> 上傳 -> 回填 URL */
const onCropConfirm = async (croppedFile: File) => {
  cropOpen.value = false;
  revokeCropSrc();

  if (!cropTarget.value) return;

  uploading.value = true;

  try {
    // 主圖
    if (cropTarget.value.type === 'main') {
      const { data } = await uploadLotteryImage(croppedFile);
      const url = data?.imageUrl || '';

      if (!url) {
        await dialogStore.openInfoDialog({
          title: '提示訊息',
          message: '上傳成功但未取得 imageUrl，請檢查後端回傳格式',
          iconType: 'warning',
        });
        return;
      }

      imageUrl.value = url;
      mainImagePreview.value = url;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '商品主圖上傳成功',
        iconType: 'success',
      });
      return;
    }

    // 圖集（加入一張）
    if (cropTarget.value.type === 'gallery') {
      const { data } = await uploadLotteryImage(croppedFile);
      const url = data?.imageUrl || '';

      if (!url) {
        await dialogStore.openInfoDialog({
          title: '提示訊息',
          message: '上傳成功但未取得 imageUrl，請檢查後端回傳格式',
          iconType: 'warning',
        });
        return;
      }

      galleryImageUrls.value.push(url);
      syncGalleryTextFromArray();

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: '商品圖集新增成功',
        iconType: 'success',
      });
      return;
    }

    // 獎品圖
    if (cropTarget.value.type === 'prize') {
      const prizeKey = cropTarget.value.prizeKey;
      const prizeIndex = cropTarget.value.prizeIndex;

      const row = prizes.find((x) => x._key === prizeKey);
      if (!row) return;

      const { data } = await uploadPrizeImage(croppedFile);
      const url = data?.imageUrl || '';

      if (!url) {
        await dialogStore.openInfoDialog({
          title: '提示訊息',
          message: '上傳成功但未取得 imageUrl，請檢查後端回傳格式',
          iconType: 'warning',
        });
        return;
      }

      row.imageUrl = url;

      await dialogStore.openInfoDialog({
        title: '提示訊息',
        message: `獎品圖片（#${prizeIndex + 1}）上傳成功`,
        iconType: 'success',
      });
      return;
    }
  } catch (e: any) {
    await dialogStore.openInfoDialog({
      title: '圖片上傳失敗',
      message: e?.message ?? '請稍後再試',
      iconType: 'warning',
    });
  } finally {
    uploading.value = false;
    cropTarget.value = null;
  }
};

/** ==========  CKEditor 圖片上傳 ========== */
class MyCustomUploadAdapter {
  loader: any;
  constructor(loader: any) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(async (file: File) => {
      const { data } = await uploadLotteryImage(file);
      return { default: data.imageUrl };
    });
  }

  abort() {
    console.log('CKEditor 圖片上傳被中止');
  }
}

function CustomUploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new MyCustomUploadAdapter(loader);
  };
}

const editorConfig: any = {
  toolbar: [
    'heading',
    '|',
    'bold',
    'italic',
    'link',
    'bulletedList',
    'numberedList',
    'blockQuote',
    'imageUpload',
    '|',
    'imageResize',
  ],
  language: 'zh-tw',
  image: {
    toolbar: ['imageStyle:full', 'imageStyle:side', 'imageResize'],
    resizeOptions: [
      { name: 'resizeImage:original', label: '原始大小', value: null },
      { name: 'resizeImage:50', label: '50%', value: '50' },
      { name: 'resizeImage:75', label: '75%', value: '75' },
    ],
    resizeUnit: '%',
  },
  extraPlugins: [CustomUploadAdapterPlugin],
};

const normalizePrizePayload = (p: PrizeFormRow) => {
  return {
    ...(p.id ? { id: p.id } : {}),
    name: cleanText(p.name),
    quantity: Number(p.quantity),

    description: cleanText(p.description),
    imageUrl: cleanText(p.imageUrl),
    level: cleanText(p.level),

    prizeNumber: cleanText(p.prizeNumber),
    prizeType: cleanText(p.prizeType),
    pointValue:
      p.prizeType === 'point' && p.pointValue != null
        ? Number(p.pointValue)
        : undefined,

    isLastPrize: p.isLastPrize === true || (p.isLastPrize as any) === 'true',
    isGrandPrize: p.isGrandPrize === true || (p.isGrandPrize as any) === 'true',
    orderNum: p.orderNum == null ? undefined : Number(p.orderNum),
  };
};

/** ========== load detail ========== */
const loadDetail = async () => {
  if (!id.value) return;

  try {
    const res = await getLotteryWithPrizes(id.value);
    const data = (res as any)?.data ?? res;

    setValues({
      storeId: data?.storeId ?? '',

      title: data?.title ?? '',
      category: data?.category ?? 'OFFICIAL_ICHIBAN',
      subCategory: data?.subCategory ?? '',
      playMode: data?.playMode ?? 'LOTTERY_MODE',
      gameMode: data?.gameMode ?? '',
      designatedPrizeNumbers: data?.designatedPrizeNumbers
        ? (typeof data.designatedPrizeNumbers === 'string'
            ? data.designatedPrizeNumbers
            : JSON.stringify(data.designatedPrizeNumbers))
        : '',
      status: data?.status ?? 'DRAFT',

      pricePerDraw: Number(data?.pricePerDraw ?? 0),
      maxDraws: Number(data?.maxDraws ?? 0),

      hotCount: data?.hotCount ?? undefined,
      theme: data?.theme ?? '',

      imageUrl: data?.imageUrl ?? '',
      galleryImagesText: Array.isArray(data?.galleryImages)
        ? data.galleryImages.join(',')
        : '',

      description: data?.description ?? '',
      content: data?.content ?? '',
      tagsText: Array.isArray(data?.tags) ? data.tags.join(',') : '',

      remark: data?.remark ?? '',

      scheduledAt: data?.scheduledAt ?? '',
      startTime: data?.startTime ?? '',
      endTime: data?.endTime ?? '',

      discountedPrice: data?.discountedPrice ?? undefined,
      autoDiscountEnabled: data?.autoDiscountEnabled ?? false,

      allowMultiDraw: data?.allowMultiDraw ?? true,
      multiDrawOptionsText: Array.isArray(data?.multiDrawOptions)
        ? data.multiDrawOptions.join(',')
        : '10',

      bonusEnabled: data?.bonusEnabled ?? false,
      bonusPointsPerDraw: data?.bonusPointsPerDraw ?? undefined,
      bonusCostPerDraw: data?.bonusCostPerDraw ?? undefined,
    });

    ensureStoreOptionExists(data?.storeId ?? '');

    /* T021 — load designationStatus */
    lotteryDesignationStatus.value = data?.designationStatus ?? null;

    //  主圖預覽
    mainImagePreview.value = data?.imageUrl ?? '';

    //  圖集回填（array + text 同步）
    galleryImageUrls.value = Array.isArray(data?.galleryImages)
      ? data.galleryImages
      : [];
    syncGalleryTextFromArray();

    // prizes
    prizes.splice(0, prizes.length);
    (data?.prizes ?? []).forEach((p: any) => {
      const key = generateUUID();
      prizes.push({
        _key: key,
        id: p.id,

        name: p.name ?? '',
        quantity: Number(p.quantity ?? 1),

        description: p.description ?? '',
        imageUrl: p.imageUrl ?? '',
        level: p.level ?? 'A',

        prizeNumber: p.prizeNumber ?? '',
        prizeType: p.prizeType ?? 'physical',
        pointValue: p.pointValue ?? undefined,

        isLastPrize: p.isLastPrize ?? false,
        isGrandPrize: p.isGrandPrize ?? false,

        orderNum: p.orderNum ?? undefined,
      });

      prizeUploadFileNames[key] = '';
      prizeUploadErrorMessages[key] = null;
    });

    if (prizes.length === 0) addPrize();
  } catch (e: any) {
    dialogStore.openInfoDialog({
      title: '載入失敗',
      message: e?.message ?? '請稍後再試',
    });
  }
};

/** ========== submit ========== */
const onSubmit = handleSubmit(async (values) => {
  if (uploading.value || cropOpen.value) {
    await dialogStore.openInfoDialog({
      title: '提示訊息',
      message: cropOpen.value
        ? '圖片裁切中，請先完成裁切再送出'
        : '圖片上傳中，請稍後再送出',
      iconType: 'warning',
    });
    return;
  }

  /* T021b — block save if SCRATCH_STORE + ACTIVE + designation PENDING */
  if (
    (values as any).status === 'ACTIVE' &&
    (values as any).gameMode === 'SCRATCH_STORE' &&
    lotteryDesignationStatus.value === 'PENDING'
  ) {
    await dialogStore.openInfoDialog({
      title: '無法儲存',
      message: '此刮刮樂商品（店家指定模式）尚未完成大獎號碼指定，無法設為抽獎中，請先完成指定流程。',
      iconType: 'warning',
    });
    return;
  }

  try {
    // 防止使用者只改文字欄：再同步一次
    syncGalleryArrayFromText();

    const payload = {
      lottery: {
        storeId: cleanText(values.storeId),

        title: (values as any).title,
        category: (values as any).category,
        subCategory: cleanText((values as any).subCategory) || undefined,

        gameMode: cleanText((values as any).gameMode) || undefined,
        designatedPrizeNumbers: (() => {
          const raw = cleanText((values as any).designatedPrizeNumbers);
          if (!raw) return undefined;
          try { return JSON.parse(raw); } catch { return raw; }
        })(),

        status: cleanText((values as any).status),

        pricePerDraw: Number((values as any).pricePerDraw),

        //  主圖
        imageUrl: cleanText(values.imageUrl),

        discountedPrice: values.discountedPrice ?? undefined,
        autoDiscountEnabled: values.autoDiscountEnabled ?? false,

        allowMultiDraw: values.allowMultiDraw ?? true,
        multiDrawOptions: parseMultiDrawOptions(values.multiDrawOptionsText),

        scheduledAt: toLocalDateTimeOrUndefined(values.scheduledAt),
        startTime: toLocalDateTimeOrUndefined(values.startTime),
        endTime: toLocalDateTimeOrUndefined(values.endTime),

        maxDraws: Number((values as any).maxDraws ?? 0),

        remark: cleanText(values.remark),

        hotCount:
          (values as any).hotCount == null
            ? undefined
            : Number((values as any).hotCount),
        theme: cleanText((values as any).theme),

        galleryImages: galleryImageUrls.value,

        content: cleanText(values.content),
        tags: parseCsvText(values.tagsText),

        bonusEnabled: values.bonusEnabled ?? false,
        bonusPointsPerDraw:
          values.bonusEnabled && values.bonusPointsPerDraw != null
            ? Number(values.bonusPointsPerDraw)
            : undefined,
        bonusCostPerDraw:
          values.bonusEnabled && values.bonusCostPerDraw != null
            ? Number(values.bonusCostPerDraw)
            : undefined,
      },
      prizes: prizes
        .filter((p) => p.name?.trim())
        .map((p) => normalizePrizePayload(p)),
    };

    if (payload.prizes.length === 0) {
      dialogStore.openInfoDialog({
        title: '請至少新增 1 個獎品',
        message: '獎品清單不可為空',
      });
      return;
    }

    /* SCRATCH_MODE: must have ≥1 grand prize */
    if ((values as any).subCategory === 'SCRATCH_MODE') {
      const hasGrand = payload.prizes.some((p) => p.isGrandPrize === true);
      if (!hasGrand) {
        dialogStore.openInfoDialog({
          title: '刮刮樂獎品設定不完整',
          message: '刮刮樂模式需至少設定 1 個「大獎」（isGrandPrize = 是）。',
          iconType: 'warning',
        });
        return;
      }
    }

    if (!isEdit.value) {
      await createLotteryWithPrizes(payload);
      dialogStore.openInfoDialog({
        title: '新增成功',
        message: '商品與獎品已建立完成',
      });
      router.push('/home/lottery-with-prizes');
      return;
    }

    await updateLotteryWithPrizes(id.value!, payload);
    dialogStore.openInfoDialog({
      title: '更新成功',
      message: '商品與獎品已更新',
    });
    router.push('/home/lottery-with-prizes');
  } catch (e: any) {
    dialogStore.openInfoDialog({
      title: '儲存失敗',
      message: e?.message ?? '請稍後再試',
    });
  }
});

/** ========== mounted ========== */
onMounted(async () => {
  await Promise.all([loadStoreOptions(), loadThemeOptions()]);

  if (isEdit.value) await loadDetail();
  else addPrize();
});
</script>

<style lang="scss">
/* AdminLotteryWithPrizesForm.vue (scoped) */

:deep(.ck-editor__editable) {
  min-height: 260px;
}

.lotteryWithPrizesForm {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 18px;
    font-weight: 800;
  }

  &__actions {
    display: flex;
    justify-content: end;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__section {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }

  &__sectionHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  &__sectionTitle {
    font-size: 16px;
    font-weight: 700;
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
  }

  &__empty {
    padding: 12px 6px;
    opacity: 0.7;
    font-size: 14px;
  }

  &__prizeCard {
    margin-top: 12px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  &__prizeTop {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  &__prizeTitle {
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.06);
  }

  &__badge--muted {
    background: rgba(0, 0, 0, 0.04);
    color: rgba(0, 0, 0, 0.6);
  }

  /* =========================
   * Gallery (圖集) 右上角叉叉
   * ========================= */

  &__galleryItem {
    position: relative;
    width: 120px;
  }

  &__galleryImg {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }

  &__galleryRemove {
    position: absolute;
    top: -8px;
    right: -8px;

    width: 26px;
    height: 26px;
    border-radius: 999px;

    border: 0;
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    background: #e53935;
    color: #fff;

    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);

    transition:
      transform 0.12s ease,
      opacity 0.12s ease;
  }

  &__galleryRemove:hover {
    transform: scale(1.06);
  }

  &__galleryRemove:active {
    transform: scale(0.96);
  }

  &__galleryRemove:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }

  &__galleryRemoveIcon {
    font-size: 14px;
    line-height: 1;
  }

  /* =========================
   * Prize layout (左表單 / 右圖片)
   * ========================= */

  &__prizeBody {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  &__prizeLeft {
    flex: 1;
    min-width: 0;
  }

  &__prizeRight {
    width: 340px;
    min-width: 340px;
  }

  &__prizeSection {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed rgba(0, 0, 0, 0.08);
  }

  &__prizeSectionTitle {
    font-size: 13px;
    font-weight: 800;
    opacity: 0.75;
    margin-bottom: 6px;
  }

  /* Prize image preview + remove button */
  &__prizePreviewWrap {
    position: relative;
    width: 140px;
  }

  &__prizePreview {
    width: 140px;
    height: 140px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }

  &__prizePreviewRemove {
    position: absolute;
    top: -8px;
    right: -8px;

    width: 26px;
    height: 26px;
    border-radius: 999px;
    border: 0;

    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    background: #e53935;
    color: #fff;

    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);

    transition:
      transform 0.12s ease,
      opacity 0.12s ease;
  }

  &__prizePreviewRemove:hover {
    transform: scale(1.06);
  }

  &__prizePreviewRemove:active {
    transform: scale(0.96);
  }

  &__prizePreviewRemove:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }

  &__prizePreviewRemoveIcon {
    font-size: 14px;
    line-height: 1;
  }

  /* RWD */
  @media (max-width: 768px) {
    &__prizeBody {
      flex-direction: column;
    }

    &__prizeRight {
      width: 100%;
      min-width: 0;
    }
  }
}
</style>
