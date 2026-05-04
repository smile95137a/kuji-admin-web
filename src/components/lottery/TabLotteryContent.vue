<!-- src/components/lottery/TabLotteryContent.vue -->
<template>
  <div class="flex flex-wrap">
    <div class="w-100 p-6">
      <FormInput
        label="主圖 URL"
        v-model="imageUrl"
        :error="showError('imageUrl')"
        placeholder="請輸入主圖 URL"
      />
    </div>

    <div class="w-100 p-6">
      <FormTextArea
        label="多圖 URL"
        v-model="galleryImagesText"
        :error="showError('galleryImagesText')"
        placeholder="一行一張圖片 URL"
        rows="4"
      />
    </div>

    <div class="w-100 p-6">
      <FormTextArea
        label="商品描述"
        v-model="description"
        :error="showError('description')"
        rows="4"
      />
    </div>

    <div class="w-100 p-6">
      <FormTextArea
        label="商品內容"
        v-model="content"
        :error="showError('content')"
        rows="6"
      />
    </div>

    <div class="w-50 w-md-100 p-6">
      <FormInput
        label="標籤"
        v-model="tagsText"
        :error="showError('tagsText')"
        placeholder="例如：熱門,限定,新品"
      />
    </div>

    <div class="w-50 w-md-100 p-6">
      <FormInput label="備註" v-model="remark" :error="showError('remark')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormContext } from 'vee-validate';

import FormInput from '@/components/common/FormInput.vue';
import FormTextArea from '@/components/common/FormTextarea.vue';

const { defineField, errors, submitCount } = useFormContext();

const [imageUrl] = defineField('imageUrl');
const [galleryImagesText] = defineField('galleryImagesText');
const [description] = defineField('description');
const [content] = defineField('content');
const [tagsText] = defineField('tagsText');
const [remark] = defineField('remark');

const showError = (field: string) => {
  if (!submitCount.value) return '';
  return errors.value[field] as string;
};
</script>
