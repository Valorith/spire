<template>
  <div
    class="loader-fake-progress"
    role="progressbar"
    aria-label="Loading"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="progress"
  >
    <div
      class="loader-fake-progress-fill"
      :style="{ clipPath: `inset(0 ${100 - progress}% 0 0)` }"
    />
    <span class="loader-fake-progress-frame" aria-hidden="true"/>
    <span class="loader-fake-progress-scale" aria-hidden="true">
      <span
        v-for="segment in 4"
        :key="segment"
        class="loader-fake-progress-scale-segment"
      />
    </span>
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
  background-position: left center;
  background-repeat: repeat-x;
  background-size: auto 100%;
  line-height: 10px;
}

.loader-fake-progress-fill {
  position: absolute;
  inset: 0;
  background-color: yellow;
  transition: clip-path .3s;
}

.loader-fake-progress-frame {
  background-clip: padding-box;
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.08) 0,
    rgba(255, 255, 255, 0.02) 35%,
    rgba(0, 0, 0, 0.34) 100%
  );
  background-origin: padding-box;
  border-color: transparent;
  border-image-repeat: stretch;
  border-image-slice: 1;
  border-image-source: linear-gradient(
    to bottom,
    rgba(220, 211, 171, 0.9) 0,
    rgba(111, 103, 72, 0.92) 34%,
    rgba(48, 43, 27, 0.96) 68%,
    rgba(183, 174, 128, 0.88) 100%
  );
  border-style: solid;
  border-width: 2px 4px;
  box-sizing: border-box;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.52),
    0 0 0 1px rgba(0, 0, 0, 0.46);
  display: block;
  height: 10px;
  left: -4px;
  pointer-events: none;
  position: absolute;
  top: -2px;
  width: calc(100% + 8px);
  z-index: 1;
}

.loader-fake-progress-scale {
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  height: 4px;
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  z-index: 2;
}

.loader-fake-progress-scale::after {
  background-image: linear-gradient(
    to right,
    transparent 0,
    transparent calc(25% - 1px),
    rgba(220, 211, 171, 0.88) calc(25% - 1px),
    rgba(220, 211, 171, 0.88) calc(25% + 1px),
    transparent calc(25% + 1px),
    transparent calc(50% - 1px),
    rgba(220, 211, 171, 0.88) calc(50% - 1px),
    rgba(220, 211, 171, 0.88) calc(50% + 1px),
    transparent calc(50% + 1px),
    transparent calc(75% - 1px),
    rgba(220, 211, 171, 0.88) calc(75% - 1px),
    rgba(220, 211, 171, 0.88) calc(75% + 1px),
    transparent calc(75% + 1px)
  );
  bottom: 0;
  content: "";
  height: 4px;
  left: 0;
  position: absolute;
  right: 0;
}

.loader-fake-progress-scale-segment {
  align-self: end;
  background-image: linear-gradient(
    to right,
    transparent 0,
    transparent calc(20% - 0.5px),
    rgba(194, 196, 181, 0.58) calc(20% - 0.5px),
    rgba(194, 196, 181, 0.58) calc(20% + 0.5px),
    transparent calc(20% + 0.5px),
    transparent calc(40% - 0.5px),
    rgba(194, 196, 181, 0.58) calc(40% - 0.5px),
    rgba(194, 196, 181, 0.58) calc(40% + 0.5px),
    transparent calc(40% + 0.5px),
    transparent calc(60% - 0.5px),
    rgba(194, 196, 181, 0.58) calc(60% - 0.5px),
    rgba(194, 196, 181, 0.58) calc(60% + 0.5px),
    transparent calc(60% + 0.5px),
    transparent calc(80% - 0.5px),
    rgba(194, 196, 181, 0.58) calc(80% - 0.5px),
    rgba(194, 196, 181, 0.58) calc(80% + 0.5px),
    transparent calc(80% + 0.5px),
    transparent 100%
  );
  height: 2px;
  min-width: 0;
}

.loader-fake-progress-label {
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  color: #ffffff;
  text-shadow: -2px 2px 3px #000;
  z-index: 3;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .loader-fake-progress-fill {
    transition: none;
  }
}
</style>
