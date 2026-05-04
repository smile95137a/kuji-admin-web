<!-- src/components/login/LoginAside.vue -->
<template>
  <aside class="login__aside">
    <div class="login__aside-shine" />

    <div class="login__aside-content">
      <div class="login__brand">
        <div class="login__brand-icon">
          <font-awesome-icon :icon="['fas', 'ticket-alt']" />
        </div>

        <div>
          <p class="login__brand-kicker">KUJI ADMIN</p>
          <h2 class="login__aside-title">一番賞後台管理</h2>
        </div>
      </div>

      <p class="login__aside-desc">
        管理商品、賞項、訂單與營運內容，快速掌握店家後台狀態。
      </p>

      <ul class="login__aside-list">
        <li>
          <span class="login__aside-list-icon">
            <font-awesome-icon :icon="['fas', 'boxes']" />
          </span>
          <div>
            <strong>商品與賞項管理</strong>
            <small>建立商品、設定獎項與庫存資訊</small>
          </div>
        </li>

        <li>
          <span class="login__aside-list-icon">
            <font-awesome-icon :icon="['fas', 'images']" />
          </span>
          <div>
            <strong>圖片與活動管理</strong>
            <small>管理 Banner、最新消息與跑馬燈</small>
          </div>
        </li>

        <li>
          <span class="login__aside-list-icon">
            <font-awesome-icon :icon="['fas', 'list-check']" />
          </span>
          <div>
            <strong>訂單與抽選紀錄</strong>
            <small>追蹤訂單狀態與中獎清單</small>
          </div>
        </li>
      </ul>

      <div class="login__aside-stats">
        <div class="login__aside-stat">
          <strong>即時</strong>
          <span>營運掌握</span>
        </div>

        <div class="login__aside-stat">
          <strong>內容</strong>
          <span>快速維護</span>
        </div>

        <div class="login__aside-stat">
          <strong>訂單</strong>
          <span>流程追蹤</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts"></script>
