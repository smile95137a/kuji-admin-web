<template>
  <div class="spinner">
    <div class="spinner__container">
      <div
        class="spinner__particle"
        v-for="n in 7"
        :key="n"
        :class="`spinner__particle--${n}`"
      ></div>

      <div class="spinner__text">LOADING</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.spinner {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;

  &__container {
    position: relative;
    width: 180px;
    height: 180px;
  }

  &__text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
    font-weight: 600;
    color: #ffd166;
    letter-spacing: 1px;
    opacity: 0.85;
    text-shadow: 0 0 12px rgba(255, 150, 0, 0.8);
    animation: spinner-textPulse 1.3s ease-in-out infinite;
  }

  /* 粒子 element */
  &__particle {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    opacity: 0.95;
    animation: spinner-floatRandom 1.2s infinite ease-in-out alternate;
  }
}

$colors: #ffd166, #ffb347, #ff9100, #ff7a26, #ff5d00, #c84700, #ffcc80;
$particle-count: 7;

@for $i from 1 through $particle-count {
  .spinner__particle--#{$i} {
    background: nth($colors, (($i - 1) % length($colors)) + 1);

    $deg: (360deg / $particle-count) * ($i - 1);

    $rx: 75px;
    $ry: 38px;

    left: calc(50% + #{$rx} * cos($deg));
    top: calc(50% + #{$ry} * sin($deg));

    animation-duration: #{1 + ($i * 0.16)}s;

    filter: drop-shadow(0 0 14px nth($colors, (($i - 1) % length($colors)) + 1))
      drop-shadow(0 0 24px nth($colors, (($i - 1) % length($colors)) + 1));
  }
}

@keyframes spinner-textPulse {
  0% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes spinner-floatRandom {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  25% {
    transform: translate(12px, -18px) scale(1.2) rotate(25deg);
  }
  50% {
    transform: translate(-18px, 10px) scale(0.9) rotate(-20deg);
  }
  75% {
    transform: translate(14px, 14px) scale(1.15) rotate(35deg);
  }
  100% {
    transform: translate(-14px, -14px) scale(1) rotate(-15deg);
  }
}
</style>
