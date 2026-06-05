<template>
  <div class="loader-fake-progress">
    <div
      class="loader-fake-progress-fill"
      :style="{ clipPath: `inset(0 ${100 - progress}% 0 0)` }"
    />
    <span
      v-if="progress > 0"
      class="loader-fake-progress-label"
    >
      {{ progress }}%
    </span>
  </div>
</template>

<script>
export default {
  name: 'loader-fake-progress',
  data() {
    return {
      progress: 0,
      internalProgress: 0,
      interval: null,
    }
  },
  props: {
    intervalMs: {
      type: Number,
      required: false,
      default: 10
    },
  },
  mounted() {
    this.interval = setInterval(this.incrementLoader, this.intervalMs)
  },
  beforeDestroy() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  },
  methods: {
    incrementLoader() {
      let progress = this.internalProgress

      if (progress < 25) {
        progress += .5;
      } else if (progress < 50) {
        progress += .1;
      } else if (progress < 75) {
        progress += .05;
      } else if (progress < 85) {
        progress += .025;
      } else if (progress < 100) {
        progress += .01;
      }

      if (progress > 100) {
        clearInterval(this.interval)
      }

      this.internalProgress = progress;
      this.progress         = Math.round(progress)
    }
  }
}
</script>

<style scoped>
.loader-fake-progress {
  position: relative;
  height: 6px;
  width: 100%;
  margin: 0 auto;
  background-image: url('./eq-ui/images/progress_bar_bottom.png');
  background-size: 100% 100%;
  line-height: 10px;
}

.loader-fake-progress-fill {
  position: absolute;
  inset: 0;
  background-color: yellow;
  transition: clip-path .3s;
}

.loader-fake-progress-fill::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -4px;
  width: calc(100% + 8px);
  height: 10px;
  background-image: url('./eq-ui/images/progress_bar_top.png');
  background-size: 100% 100%;
}

.loader-fake-progress-label {
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  color: #ffffff;
  text-shadow: -2px 2px 3px #000;
  z-index: 1;
  pointer-events: none;
}
</style>
