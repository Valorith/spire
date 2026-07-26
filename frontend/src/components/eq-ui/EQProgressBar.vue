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
        <span class="eq-progress-bar__scale" aria-hidden="true">
          <span
            v-for="segment in 4"
            :key="segment"
            class="eq-progress-bar__scale-segment"
          />
        </span>
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
  z-index: 2;
}

.eq-progress-bar__scale {
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  height: 4px;
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  z-index: 3;
}

.eq-progress-bar__scale::after {
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

.eq-progress-bar__scale-segment {
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
  z-index: 4;
}

@media (prefers-reduced-motion: reduce) {
  .eq-progress-bar__fill {
    transition: none;
  }
}
</style>
