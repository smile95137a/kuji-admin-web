<!-- src/components/login/LoginAside.vue -->
<template>
  <aside class="login__aside">
    <h2 class="login__aside-title">
      <font-awesome-icon :icon="['fas', 'ticket-alt']" />
      一番賞
    </h2>

    <ul class="login__aside-list">
      <li>
        <font-awesome-icon :icon="['fas', 'boxes']" />
        商品與賞項管理
      </li>
      <li>
        <font-awesome-icon :icon="['fas', 'images']" />
        主圖 / 多圖上傳
      </li>
      <li>
        <font-awesome-icon :icon="['fas', 'list-check']" />
        抽選紀錄與中獎清單
      </li>
    </ul>
  </aside>
</template>

<script setup></script>
