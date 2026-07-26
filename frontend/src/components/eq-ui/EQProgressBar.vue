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
        >
            <span v-if="normalizedPercent > 0 && showPercent" style="text-shadow: -2px 2px 3px #000;">{{normalizedPercent}}%</span>
        </div>
        <span class="eq-progress-bar__frame" aria-hidden="true"/>
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
  background-image: url('./images/progress_bar_top.png');
  background-size: 100% 100%;
  display: block;
  height: 10px;
  left: -4px;
  pointer-events: none;
  position: absolute;
  top: -2px;
  width: calc(100% + 8px);
  z-index: 2;
}

@media (prefers-reduced-motion: reduce) {
  .eq-progress-bar__fill {
    transition: none;
  }
}
</style>
