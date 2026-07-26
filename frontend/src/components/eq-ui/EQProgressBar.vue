<template>
    <div
      class="eq-progress-bar"
      role="progressbar"
      :aria-label="title"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="normalizedPercent"
    >
        <div
          class="eq-progress-bar__fill"
          :style='{ width: normalizedPercent + "%", "background-color": color }'
        />
        <span class="eq-progress-bar__frame" aria-hidden="true"/>
        <span
          v-if="normalizedPercent > 0 && showPercent"
          class="eq-progress-bar__label"
        >
          {{normalizedPercent}}%
        </span>
    </div>
</template>

<script>
  export default {
    name: 'EqProgressBar',
    props: {
      title: {
        type: String,
        required: false,
        default: 'Window Title'
      },
      percent: {
        type: Number,
        required: false,
        default: 0
      },
      color: {
        type: String,
        required: false,
        default: 'yellow'
      },
      showPercent: {
        type: Boolean,
        required: false,
        default: true
      }
    },
    computed: {
      normalizedPercent () {
        const value = Number(this.percent)
        return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
      }
    }
  }
</script>

<style scoped>
.eq-progress-bar__fill::before {
  display: none !important;
}

.eq-progress-bar__frame {
  background-clip: padding-box;
  background-image: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.08) 0,
    rgba(255, 255, 255, 0.02) 35%,
    rgba(0, 0, 0, 0.34) 100%
  );
  border-color: transparent;
  border-image-repeat: repeat stretch;
  border-image-slice: 2 4;
  border-image-source: url('./images/progress_bar_top.png');
  border-style: solid;
  border-width: 2px 4px;
  box-sizing: border-box;
  display: block;
  height: 10px;
  left: -4px;
  pointer-events: none;
  position: absolute;
  top: -2px;
  width: calc(100% + 8px);
  z-index: 2;
}

.eq-progress-bar__frame::after {
  background-image:
    linear-gradient(
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
    ),
    repeating-linear-gradient(
      to right,
      transparent 0,
      transparent calc(5% - 0.5px),
      rgba(194, 196, 181, 0.58) calc(5% - 0.5px),
      rgba(194, 196, 181, 0.58) calc(5% + 0.5px),
      transparent calc(5% + 0.5px),
      transparent 5%
    );
  background-position: left bottom, left bottom;
  background-repeat: no-repeat;
  background-size: 100% 4px, 100% 2px;
  bottom: 0;
  content: "";
  height: 4px;
  left: 4px;
  pointer-events: none;
  position: absolute;
  right: 4px;
}

.eq-progress-bar__label {
  color: #fff;
  font-size: 9px;
  left: 50%;
  line-height: 1;
  pointer-events: none;
  position: absolute;
  text-shadow: -2px 2px 3px #000;
  top: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  z-index: 3;
}

@media (prefers-reduced-motion: reduce) {
  .eq-progress-bar__fill {
    transition: none;
  }
}
</style>
