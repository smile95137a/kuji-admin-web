<!-- src/views/store/StoreDisableModal.vue -->
<template>
  <Dialog :isOpen="isOpen" customClass="dialog--storeDisable" @close="$emit('cancel')">
    <div class="sdm">
      <!-- Red Header -->
      <div class="sdm__header">
        <span>⚠️ 停用店家確認</span>
      </div>

      <div class="sdm__body">
        <!-- Cascade warning -->
        <div class="sdm__warning-box">
          <p class="sdm__warning-title">停用後，以下影響將立即生效：</p>
          <ul class="sdm__warning-list">
            <li>所有上架商品將自動下架</li>
            <li>所有橫幅廣告將停用</li>
            <li>店家對玩家不可見</li>
            <li>關聯 StoreOwner 及 StoreEditor 帳號同步停用（JWT 立即失效）</li>
          </ul>
          <p class="sdm__warning-note">✅ 已成立的訂單不受影響，仍可繼續處理。</p>
          <p class="sdm__warning-note sdm__warning-note--red">
            ⚠️ 重新啟用不會自動恢復商品與廣告，需手動重新上架。
          </p>
        </div>

        <!-- Name confirmation -->
        <div class="sdm__confirm-section">
          <p class="sdm__confirm-label">
            請輸入店家名稱「<strong>{{ storeName }}</strong>」以確認停用：
          </p>
          <input
            class="sdm__confirm-input"
            v-model="inputName"
            placeholder="輸入店家名稱"
            @input="checkMatch"
          />
        </div>

        <div class="flex justify-center gap-x-12 m-t-16">
          <MButton
            class="mbtn--red"
            :disabled="!nameMatches || loading"
            @click="$emit('confirm')"
          >
            確認停用
          </MButton>
          <MButton variant="secondary" :disabled="loading" @click="$emit('cancel')">
            取消
          </MButton>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from '@/components/common/Dialog.vue';
import MButton from '@/components/common/MButton.vue';

const props = defineProps<{
  isOpen: boolean;
  storeName: string;
  loading?: boolean;
}>();

defineEmits<{
  confirm: [];
  cancel: [];
}>();

const inputName = ref('');
const nameMatches = ref(false);

const checkMatch = () => {
  nameMatches.value = inputName.value === props.storeName;
};

watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      inputName.value = '';
      nameMatches.value = false;
    }
  },
);
</script>

<style scoped lang="scss">
.sdm {
  &__header {
    background: #dc2626;
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    padding: 14px 20px;
    border-radius: 6px 6px 0 0;
  }

  &__body {
    padding: 20px;
  }

  &__warning-box {
    border: 1px solid #fca5a5;
    background: #fef2f2;
    border-radius: 6px;
    padding: 14px 16px;
    margin-bottom: 16px;
  }

  &__warning-title {
    font-size: 14px;
    font-weight: 700;
    color: #991b1b;
    margin-bottom: 8px;
  }

  &__warning-list {
    list-style: disc;
    padding-left: 18px;
    font-size: 13px;
    color: #7f1d1d;
    margin-bottom: 8px;

    li + li {
      margin-top: 4px;
    }
  }

  &__warning-note {
    font-size: 13px;
    color: #374151;
    margin-top: 6px;

    &--red {
      color: #b91c1c;
      font-weight: 600;
    }
  }

  &__confirm-section {
    margin-bottom: 4px;
  }

  &__confirm-label {
    font-size: 13px;
    color: #374151;
    margin-bottom: 8px;
  }

  &__confirm-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #6366f1;
    }
  }
}
</style>
