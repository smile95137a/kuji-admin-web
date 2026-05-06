<!-- src/components/lottery/TabLotteryBasic.vue -->
<template>
  <div class="tab-lottery-basic">
    <div class="tab-lottery-basic__layout">
      <!-- 左側：主要表單 -->
      <div class="tab-lottery-basic__left">
        <!-- 商品基本資料 -->
        <FormSection title="商品基本資料">
          <div class="tab-lottery-basic__card">
            <div class="flex flex-wrap">
              <!-- 商品名稱 -->
              <div class="w-50 w-md-100 p-6">
                <FormInput
                  label="商品名稱"
                  v-model="title"
                  :error="showError('title')"
                  required
                  maxlength="100"
                  placeholder="請輸入商品名稱"
                />
              </div>
            </div>

            <div class="flex flex-wrap">
              <!-- 所屬店家 -->
              <div class="w-50 w-md-100 p-6">
                <FormSelect
                  v-if="isAdmin !== false || storeOptions.length > 1"
                  label="所屬店家"
                  v-model="storeId"
                  :options="storeOptions"
                  :error="showError('storeId')"
                  :showAll="true"
                  allLabel="請選擇"
                  :allValue="''"
                />

                <FormInput
                  v-else
                  label="所屬店家"
                  :modelValue="storeOptions[0]?.label ?? '-'"
                  disabled
                />
              </div>

              <div class="w-50 w-md-100 p-6">
                <FormSelect
                  label="主題分類"
                  v-model="theme"
                  :options="themeOptions"
                  :error="showError('theme')"
                  :showAll="true"
                  allLabel="請選擇"
                  :allValue="''"
                />
              </div>
            </div>
          </div>
        </FormSection>

        <!-- 商品模式 -->
        <FormSection title="商品模式">
          <div class="tab-lottery-basic__card tab-lottery-basic__card--mode">
            <!-- 目前模式摘要 -->
            <div class="tab-lottery-basic__mode-summary">
              <div class="tab-lottery-basic__mode-summary-content">
                <p class="tab-lottery-basic__mode-summary-title">
                  目前商品模式
                </p>

                <span class="tab-lottery-basic__summary-pill">
                  {{ modeSummaryText }}
                </span>
              </div>
            </div>

            <!-- 分類 -->
            <div class="tab-lottery-basic__mode-block">
              <div class="tab-lottery-basic__mode-block-head">
                <p class="tab-lottery-basic__mode-block-title">商品分類</p>
              </div>

              <div class="tab-lottery-basic__mode-field">
                <FormRadioTagGroup
                  label="分類"
                  name="category"
                  id-prefix="lottery-category"
                  v-model="category"
                  :options="categoryOptions"
                  :error="showError('category')"
                  required
                  hideLabel
                />
              </div>
            </div>

            <div
              v-if="isOfficialIchiban || isCustomGacha || isScratchMode"
              class="tab-lottery-basic__mode-grid"
            >
              <!-- 官方一番賞才顯示：下架策略 -->
              <Transition name="soft-expand">
                <div
                  v-if="isOfficialIchiban"
                  class="tab-lottery-basic__setting-panel"
                >
                  <div class="tab-lottery-basic__setting-head">
                    <p class="tab-lottery-basic__setting-title">
                      官方一番賞設定
                    </p>
                  </div>

                  <FormRadioTagGroup
                    label="下架策略"
                    name="delistStrategy"
                    id-prefix="lottery-delist-strategy"
                    v-model="delistStrategy"
                    :options="delistStrategyOptions"
                    :error="showError('delistStrategy')"
                    required
                  />
                </div>
              </Transition>

              <!-- 自製賞才顯示子分類 -->
              <Transition name="soft-expand">
                <div
                  v-if="isCustomGacha"
                  class="tab-lottery-basic__setting-panel"
                >
                  <div class="tab-lottery-basic__setting-head">
                    <p class="tab-lottery-basic__setting-title">自製賞設定</p>
                  </div>

                  <FormRadioTagGroup
                    label="自製賞子分類"
                    name="subCategory"
                    id-prefix="lottery-sub-category"
                    v-model="subCategory"
                    :options="subCategoryOptions"
                    :error="showError('subCategory')"
                  />
                </div>
              </Transition>

              <!-- 刮刮樂設定 -->
              <Transition name="soft-expand">
                <div
                  v-if="isScratchMode"
                  class="tab-lottery-basic__setting-panel tab-lottery-basic__setting-panel--full"
                >
                  <div class="tab-lottery-basic__setting-head">
                    <p class="tab-lottery-basic__setting-title">刮刮樂設定</p>
                  </div>

                  <FormRadioTagGroup
                    label="遊戲模式"
                    name="gameMode"
                    id-prefix="lottery-game-mode"
                    v-model="gameMode"
                    :options="gameModeOptions"
                    :error="showError('gameMode')"
                  />

                  <Transition name="soft-expand">
                    <div
                      v-if="isScratchStore"
                      class="tab-lottery-basic__inline-field"
                    >
                      <template v-if="!isEdit">
                        <FormInput
                          label="大獎號碼（店家指定）"
                          type="number"
                          v-model="pendingDesignatedPrizeNumber"
                          :error="showError('pendingDesignatedPrizeNumber')"
                          placeholder="輸入 1 ~ 總抽數之間的號碼"
                          :min="1"
                        />
                      </template>

                      <template v-else>
                        <div class="tab-lottery-basic__info-box">
                          大獎號碼請使用上方「指定大獎號碼」按鈕設定。
                        </div>
                      </template>
                    </div>
                  </Transition>
                </div>
              </Transition>
            </div>
          </div>
        </FormSection>

        <!-- 狀態與排程 -->
        <FormSection title="狀態與排程">
          <div
            class="tab-lottery-basic__card tab-lottery-basic__card--schedule"
          >
            <div class="tab-lottery-basic__status-panel">
              <FormRadioTagGroup
                label="商品狀態"
                name="status"
                id-prefix="lottery-status"
                v-model="status"
                :options="statusOptions"
                :error="showError('status')"
              />
            </div>

            <div class="tab-lottery-basic__schedule-layout">
              <!-- 定時上架時間 -->
              <div class="w-50 w-md-100 p-6">
                <FormInput
                  label="定時上架時間"
                  v-model="scheduledAt"
                  :error="showError('scheduledAt')"
                  type="datetime-local"
                />
              </div>

              <!-- 活動期間 -->
              <div class="w-100 p-6">
                <FormDateRangeField
                  label="活動期間"
                  type="datetime-local"
                  v-model:start="startTime"
                  v-model:end="endTime"
                  :startError="showError('startTime')"
                  :endError="showError('endTime')"
                />
              </div>
            </div>
          </div>
        </FormSection>

        <!-- 文案與標籤 -->
        <FormSection title="文案與標籤">
          <div class="tab-lottery-basic__copy-card">
            <div class="tab-lottery-basic__copy-grid">
              <!-- 商品描述 -->
              <div class="tab-lottery-basic__copy-block">
                <div class="tab-lottery-basic__copy-head">
                  <p class="tab-lottery-basic__copy-title">商品描述</p>
                  <span class="tab-lottery-basic__copy-badge">前台顯示</span>
                </div>

                <FormTextarea
                  class="tab-lottery-basic__description-textarea"
                  label="商品描述"
                  v-model="description"
                  :error="showError('description')"
                  placeholder="請輸入商品描述"
                  :rows="8"
                  :maxlength="500"
                  hideLabel
                />
              </div>

              <!-- 內部備註 -->
              <div class="tab-lottery-basic__copy-block">
                <div class="tab-lottery-basic__copy-head">
                  <p class="tab-lottery-basic__copy-title">內部備註</p>
                  <span
                    class="tab-lottery-basic__copy-badge tab-lottery-basic__copy-badge--muted"
                  >
                    不對外顯示
                  </span>
                </div>

                <div class="tab-lottery-basic__preset-list">
                  <button
                    v-for="item in presetRemarks"
                    :key="item"
                    type="button"
                    class="tab-lottery-basic__preset-btn"
                    @click="addRemark(item)"
                  >
                    {{ item }}
                  </button>
                </div>

                <FormTextarea
                  class="tab-lottery-basic__remark-textarea"
                  label="備註"
                  v-model="remark"
                  :error="showError('remark')"
                  placeholder="點選常用備註或直接輸入..."
                  :rows="8"
                  :maxlength="500"
                  hideLabel
                />
              </div>
            </div>

            <!-- 商品標籤 -->
            <div class="tab-lottery-basic__tag-panel">
              <FormCheckTagGroup
                label="商品標籤"
                name="tagsText"
                id-prefix="lottery-tags"
                v-model="selectedTags"
                :options="tagOptions"
                :error="showError('tagsText')"
                hideLabel
              />
            </div>
          </div>
        </FormSection>

        <!-- 商品詳細內容 -->
        <FormSection title="商品詳細內容">
          <div class="tab-lottery-basic__editor-card">
            <div class="tab-lottery-basic__editor-head">
              <p class="tab-lottery-basic__editor-title">前台商品詳情</p>

              <span class="tab-lottery-basic__editor-badge">
                可插入圖片與格式化文字
              </span>
            </div>

            <div class="tab-lottery-basic__editor-main">
              <Ckeditor
                :editor="ckeditorEditor"
                v-model="editorContent"
                :config="editorConfig"
              />
            </div>

            <p v-if="showError('content')" class="error-text m-t-8">
              {{ showError('content') }}
            </p>
          </div>
        </FormSection>
      </div>

      <!-- 右側：圖片 -->
      <div class="tab-lottery-basic__right">
        <FormSection title="商品圖片">
          <div class="tab-lottery-basic__image-card">
            <!-- 主圖 -->
            <div class="tab-lottery-basic__image-main-block">
              <div class="tab-lottery-basic__main-wrap">
                <button
                  type="button"
                  class="tab-lottery-basic__main-upload"
                  :class="{
                    'tab-lottery-basic__main-upload--empty': !imageUrl,
                  }"
                  :disabled="uploading"
                  @click="triggerMainUpload"
                >
                  <img
                    v-if="mainImagePreview"
                    :src="mainImagePreview"
                    alt="商品主圖預覽"
                    class="tab-lottery-basic__main-img"
                  />

                  <div v-else class="tab-lottery-basic__empty-image">
                    <font-awesome-icon :icon="['fas', 'image']" />
                    <span>點擊上傳</span>
                  </div>
                </button>

                <button
                  v-if="imageUrl"
                  type="button"
                  class="tab-lottery-basic__main-remove"
                  :disabled="uploading"
                  aria-label="清除主圖"
                  @click.stop="clearMainImage"
                >
                  <font-awesome-icon
                    :icon="['fas', 'xmark']"
                    class="tab-lottery-basic__main-remove-icon"
                  />
                </button>
              </div>

              <p
                v-if="mainUploadErrorMessage || showError('imageUrl')"
                class="error-text m-t-8"
              >
                {{ mainUploadErrorMessage || showError('imageUrl') }}
              </p>

              <p v-if="uploading" class="form__text m-t-8">上傳中...</p>
            </div>

            <!-- 圖集 -->
            <div class="tab-lottery-basic__image-gallery-block">
              <div class="tab-lottery-basic__image-sub-head">
                <p class="tab-lottery-basic__image-title">
                  <span v-if="galleryImageUrls.length">
                    （{{ galleryImageUrls.length }} 張）
                  </span>
                </p>
              </div>

              <div class="tab-lottery-basic__gallery">
                <button
                  type="button"
                  class="tab-lottery-basic__gallery-add"
                  :disabled="uploading"
                  @click="triggerGalleryUpload"
                >
                  <font-awesome-icon :icon="['fas', 'plus']" />
                  <span>新增</span>
                </button>

                <div
                  v-for="(url, index) in galleryImageUrls"
                  :key="`${url}_${index}`"
                  class="tab-lottery-basic__gallery-item"
                >
                  <img
                    :src="url"
                    alt="商品圖集預覽"
                    class="tab-lottery-basic__gallery-img"
                  />

                  <button
                    type="button"
                    class="tab-lottery-basic__gallery-remove"
                    :disabled="uploading"
                    aria-label="移除圖片"
                    @click="removeGalleryImage(index)"
                  >
                    <font-awesome-icon
                      :icon="['fas', 'xmark']"
                      class="tab-lottery-basic__gallery-remove-icon"
                    />
                  </button>
                </div>
              </div>

              <p
                v-if="
                  galleryUploadErrorMessage || showError('galleryImagesText')
                "
                class="error-text m-t-8"
              >
                {{
                  galleryUploadErrorMessage || showError('galleryImagesText')
                }}
              </p>
            </div>
          </div>

          <input
            ref="mainFileInput"
            class="tab-lottery-basic__hidden-input"
            type="file"
            accept="image/*"
            :disabled="uploading"
            @change="onMainFileChange"
          />

          <input
            ref="galleryFileInput"
            class="tab-lottery-basic__hidden-input"
            type="file"
            accept="image/*"
            :disabled="uploading"
            @change="onGalleryFileChange"
          />
        </FormSection>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFormContext } from 'vee-validate';

import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';

import FormInput from '@/components/common/FormInput.vue';
import FormSelect from '@/components/common/FormSelect.vue';
import FormTextarea from '@/components/common/FormTextarea.vue';
import FormSection from '@/components/common/FormSection.vue';
import FormDateRangeField from '@/components/common/FormDateRangeField.vue';
import FormRadioTagGroup from '@/components/common/FormRadioTagGroup.vue';
import FormCheckTagGroup from '@/components/common/FormCheckTagGroup.vue';

import { uploadLotteryImage } from '@/services/adminUploadService';
import { openInfoDialog } from '@/utils/dialog/infoDialog';
import { openImageCropDialog } from '@/utils/dialog/openImageCropDialog';

import {
  categoryOptions,
  subCategoryOptions,
  gameModeOptions,
  statusOptions,
  delistStrategyOptions,
} from '@/constants/lotteryOptions';

interface SelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

type CropTarget = 'main' | 'gallery';

const props = withDefaults(
  defineProps<{
    storeOptions?: SelectOption[];
    themeOptions?: SelectOption[];
    isAdmin?: boolean;
    isEdit?: boolean;
  }>(),
  {
    storeOptions: () => [],
    themeOptions: () => [],
    isAdmin: true,
    isEdit: false,
  },
);

const storeOptions = computed<SelectOption[]>(() => props.storeOptions ?? []);
const themeOptions = computed<SelectOption[]>(() => props.themeOptions ?? []);
const isAdmin = computed(() => props.isAdmin);
const isEdit = computed(() => props.isEdit);

const { defineField, errors, submitCount, setFieldValue, values } =
  useFormContext();

const [storeId] = defineField('storeId');
const [title] = defineField('title');
const [category] = defineField('category');
const [subCategory] = defineField('subCategory');
const [playMode] = defineField('playMode');
const [gameMode] = defineField('gameMode');
const [delistStrategy] = defineField('delistStrategy');
const [status] = defineField('status');
const [theme] = defineField('theme');
const [imageUrl] = defineField('imageUrl');
const [galleryImagesText] = defineField('galleryImagesText');
const [description] = defineField('description');
const [tagsText] = defineField('tagsText');
const [remark] = defineField('remark');
const [scheduledAt] = defineField('scheduledAt');
const [startTime] = defineField('startTime');
const [endTime] = defineField('endTime');
const [pendingDesignatedPrizeNumber] = defineField(
  'pendingDesignatedPrizeNumber',
);

const editorContent = computed<string>({
  get() {
    return String((values as any).content || '');
  },
  set(value: string) {
    setFieldValue('content', value || '');
  },
});

const showError = (field: string) => {
  if (!submitCount.value) return '';
  return errors.value[field] as string;
};

const tagOptions: SelectOption[] = [
  { label: '熱門', value: '熱門' },
  { label: '限定', value: '限定' },
  { label: '新品', value: '新品' },
  { label: '特價', value: '特價' },
  { label: '日系', value: '日系' },
  { label: '限量', value: '限量' },
  { label: '經典', value: '經典' },
  { label: '聯名', value: '聯名' },
  { label: '徵貨中', value: '徵貨中' },
  { label: '特別版', value: '特別版' },
];

const presetRemarks = [
  '全新商品',
  '客服補發',
  '活動加碼',
  '限時特價',
  '場地限定',
  '自製賞',
  '注意事項請詳閱說明',
];

const addRemark = (text: string) => {
  const current = String(remark.value || '').trim();
  remark.value = current ? `${current}\n${text}` : text;
};

watch(
  storeOptions,
  (options) => {
    if (isAdmin.value === false && options.length === 1 && !storeId.value) {
      storeId.value = options[0]?.value ?? '';
    }
  },
  { immediate: true },
);

const getOptionLabel = (options: SelectOption[], value: any) => {
  return options.find((item) => item.value === value)?.label || '';
};

const isOfficialIchiban = computed(() => category.value === 'OFFICIAL_ICHIBAN');
const isCustomGacha = computed(() => category.value === 'CUSTOM_GACHA');

const isScratchMode = computed(() => {
  return (
    isCustomGacha.value && String(subCategory.value || '') === 'SCRATCH_MODE'
  );
});

const isScratchStore = computed(() => {
  return (
    isScratchMode.value && String(gameMode.value || '') === 'SCRATCH_STORE'
  );
});

const modeSummaryText = computed(() => {
  const categoryLabel = getOptionLabel(categoryOptions, category.value);

  if (!isCustomGacha.value) {
    const delistLabel = isOfficialIchiban.value
      ? getOptionLabel(delistStrategyOptions, delistStrategy.value)
      : '';

    return (
      [categoryLabel, delistLabel].filter(Boolean).join(' / ') || '尚未選擇'
    );
  }

  const subCategoryLabel = getOptionLabel(
    subCategoryOptions,
    subCategory.value,
  );

  if (!isScratchMode.value) {
    return [categoryLabel, subCategoryLabel].filter(Boolean).join(' / ');
  }

  const gameModeLabel = getOptionLabel(gameModeOptions, gameMode.value);

  return [categoryLabel, subCategoryLabel, gameModeLabel]
    .filter(Boolean)
    .join(' / ');
});

watch(
  () => category.value,
  (value) => {
    if (value === 'CUSTOM_GACHA') {
      if (!subCategory.value) {
        subCategory.value = 'LOTTERY_MODE';
      }

      playMode.value = subCategory.value || 'LOTTERY_MODE';
      return;
    }

    if (subCategory.value) {
      subCategory.value = '';
    }

    playMode.value = 'LOTTERY_MODE';

    if (gameMode.value) {
      gameMode.value = '';
    }

    if (pendingDesignatedPrizeNumber.value) {
      pendingDesignatedPrizeNumber.value = undefined;
    }
  },
  { immediate: true },
);

watch(
  isOfficialIchiban,
  (yes) => {
    if (!yes && delistStrategy.value) {
      delistStrategy.value = '';
    }
  },
  { immediate: true },
);

watch(
  () => subCategory.value,
  (value) => {
    if (!isCustomGacha.value) return;

    if (value === 'SCRATCH_MODE') {
      playMode.value = 'SCRATCH_MODE';
      return;
    }

    playMode.value = 'LOTTERY_MODE';
  },
  { immediate: true },
);

watch(
  isScratchMode,
  (yes) => {
    if (yes) return;

    if (gameMode.value) {
      gameMode.value = '';
    }

    if (pendingDesignatedPrizeNumber.value) {
      pendingDesignatedPrizeNumber.value = undefined;
    }
  },
  { immediate: true },
);

watch(
  () => gameMode.value,
  (value) => {
    if (
      String(value || '') !== 'SCRATCH_STORE' &&
      pendingDesignatedPrizeNumber.value
    ) {
      pendingDesignatedPrizeNumber.value = undefined;
    }
  },
);

const selectedTags = computed<string[]>({
  get() {
    return String(tagsText.value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  },
  set(value) {
    tagsText.value = value.join(',');
  },
});

const ckeditorEditor = ClassicEditor as unknown as {
  create(...args: any[]): Promise<any>;
};

class MyCustomUploadAdapter {
  loader: any;

  constructor(loader: any) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(async (file: File) => {
      const { data } = await uploadLotteryImage(file);

      return {
        default: data?.imageUrl,
      };
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
    'undo',
    'redo',
  ],
  language: 'zh-tw',
  image: {
    toolbar: ['imageStyle:full', 'imageStyle:side'],
  },
  extraPlugins: [CustomUploadAdapterPlugin],
};

const mainFileInput = ref<HTMLInputElement | null>(null);
const galleryFileInput = ref<HTMLInputElement | null>(null);

const triggerMainUpload = () => {
  if (uploading.value) return;
  mainFileInput.value?.click();
};

const triggerGalleryUpload = () => {
  if (uploading.value) return;
  galleryFileInput.value?.click();
};

const onMainFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) return;

  await handleSelectedMainImage(file);
};

const onGalleryFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  input.value = '';

  if (!file) return;

  await handleSelectedGalleryImage(file);
};

const uploading = ref(false);

const mainImagePreview = ref('');
const mainUploadErrorMessage = ref<string | null>(null);

const galleryImageUrls = ref<string[]>([]);
const galleryUploadErrorMessage = ref<string | null>(null);

watch(
  imageUrl,
  (value) => {
    mainImagePreview.value = String(value || '');
  },
  { immediate: true },
);

watch(
  galleryImagesText,
  (value) => {
    galleryImageUrls.value = String(value || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
  },
  { immediate: true },
);

const syncGalleryText = () => {
  galleryImagesText.value = galleryImageUrls.value.join('\n');
};

const validateImageFile = async (file: File) => {
  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    return '圖片大小不可超過 5MB';
  }

  if (!file.type.startsWith('image/')) {
    return '請選擇圖片檔案';
  }

  return '';
};

const clearMainSelectedFileUi = () => {
  mainUploadErrorMessage.value = null;
};

const clearMainImage = () => {
  imageUrl.value = '';
  mainImagePreview.value = '';
  clearMainSelectedFileUi();
};

const clearGallerySelectedFileUi = () => {
  galleryUploadErrorMessage.value = null;
};

const removeGalleryImage = (index: number) => {
  galleryImageUrls.value.splice(index, 1);
  syncGalleryText();
};

const cropAndUploadImage = async (file: File, target: CropTarget) => {
  const objectUrl = URL.createObjectURL(file);

  const baseName = file.name.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const croppedFileName = `${baseName}-cropped.jpg`;

  try {
    const croppedFile = await openImageCropDialog({
      src: objectUrl,
      title:
        target === 'main' ? '裁切 商品主圖（1:1）' : '裁切 商品圖集（1:1）',
      aspectRatio: 1,
      outputWidth: 800,
      mimeType: 'image/jpeg',
      quality: 0.9,
      fileName: croppedFileName,
    });

    if (!croppedFile) return;

    uploading.value = true;

    const { data } = await uploadLotteryImage(croppedFile);
    const url = data?.imageUrl || '';

    if (!url) {
      await openInfoDialog({
        title: '提示訊息',
        message: '上傳成功但未取得 imageUrl，請檢查後端回傳格式',
        iconType: 'warning',
      });

      return;
    }

    if (target === 'main') {
      imageUrl.value = url;
      mainImagePreview.value = url;
      clearMainSelectedFileUi();

      return;
    }

    galleryImageUrls.value.push(url);
    syncGalleryText();
    clearGallerySelectedFileUi();
  } catch (error: any) {
    await openInfoDialog({
      title: '圖片上傳失敗',
      message: error?.message ?? '請稍後再試',
      iconType: 'warning',
    });
  } finally {
    uploading.value = false;
    URL.revokeObjectURL(objectUrl);
  }
};

const handleSelectedMainImage = async (file: File) => {
  mainUploadErrorMessage.value = null;

  const errorMessage = await validateImageFile(file);

  if (errorMessage) {
    mainUploadErrorMessage.value = errorMessage;

    await openInfoDialog({
      title: '提示訊息',
      message: errorMessage,
      iconType: 'warning',
    });

    clearMainSelectedFileUi();
    return;
  }

  await cropAndUploadImage(file, 'main');
};

const handleSelectedGalleryImage = async (file: File) => {
  galleryUploadErrorMessage.value = null;

  const errorMessage = await validateImageFile(file);

  if (errorMessage) {
    galleryUploadErrorMessage.value = errorMessage;

    await openInfoDialog({
      title: '提示訊息',
      message: errorMessage,
      iconType: 'warning',
    });

    clearGallerySelectedFileUi();
    return;
  }

  await cropAndUploadImage(file, 'gallery');
};
</script>

<style scoped lang="scss"></style>
