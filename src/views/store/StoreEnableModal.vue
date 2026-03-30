<!-- src/views/store/StoreEnableModal.vue -->
<template>
  <Dialog :isOpen="isOpen" customClass="dialog--storeEnable" @close="$emit('cancel')">
    <div class="sem">
      <p class="sem__title">啟用店家確認</p>

      <div class="sem__notice">
        <p>
          <strong>注意：</strong>
          啟用後，原有商品與廣告不會自動恢復，需店家管理員手動重新上架。
        </p>
      </div>

      <p class="sem__question">確定要啟用「<strong>{{ storeName }}</strong>」嗎？</p>

      <div class="flex justify-center gap-x-12 m-t-16">
        <MButton :loading="loading" @click="$emit('confirm')">確認啟用</MButton>
        <MButton variant="secondary" :disabled="loading" @click="$emit('cancel')">
          取消
        </MButton>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from '@/components/common/Dialog.vue';
import MButton from '@/components/common/MButton.vue';

defineProps<{
  isOpen: boolean;
  storeName: string;
  loading?: boolean;
}>();

defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<style scoped lang="scss">
.sem {
  padding: 20px;

  &__title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 14px;
  }

  &__notice {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 6px;
    padding: 12px 14px;
    font-size: 13px;
    color: #78350f;
    margin-bottom: 14px;
  }

  &__question {
    font-size: 14px;
    color: #374151;
  }
}
</style>
