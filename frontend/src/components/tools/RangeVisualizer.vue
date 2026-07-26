<template>
  <div class="range-visualizer-control">
    <div class="range-visualizer-stage">
      <img
        :src="getImageFromMax()"
        class="range-visualizer"
      >
      <div
        class="unit-label unit-label--marker"
        :class="{ 'unit-label--before': unitLabelPrecedesMarker }"
        :style="'left: ' + unitMarkerPosition + '%'"
      >
        {{ unitMarkerComputed }} Units
      </div>
      <div class="rv-vertical-line" :style="'left: ' + unitMarkerPosition + '%'"></div>

      <div v-for="tick in unitTicks" :key="tick">
        <div class="unit-label tick" :style="'left: ' + (tick + 1) + '%'">{{ percentToUnits(tick) }}</div>
        <div v-if="tick > 0" class="rv-vertical-line-tick" :style="'left: ' + tick + '%'"></div>
      </div>
    </div>

    <div class="rv-slider-container">
      <input
        type="range"
        class="rv-slider"
        :min="0"
        :max="1000"
        :step="1"
        :value="localValue"
        @input="onSliderInput"
        @blur="$emit('slider-blur', $event)"
        @mousedown.stop
      >
      <span class="rv-slider-value">{{ localValue }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "RangeVisualizer",
  data() {
    return {
      unitTicks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
      localValue: this.unitMarker,
    }
  },
  computed: {
    unitMarkerComputed() {
      return this.localValue > 1000 ? 1000 : this.localValue
    },
    unitMarkerPosition() {
      return this.unitsToPosition(this.unitMarkerComputed)
    },
    unitLabelPrecedesMarker() {
      return this.unitMarkerPosition >= 75
    }
  },
  props: {
    unitMarker: {
      required: true,
      type: Number,
    },
  },
  watch: {
    unitMarker(val) {
      this.localValue = val
    }
  },
  methods: {
    onSliderInput(event) {
      const val = parseInt(event.target.value)
      this.localValue = val
      this.$emit('update:unitMarker', val)
      this.$emit('input', val)
    },

    getImageFromMax() {
      if (this.getCurrentRangeMax() === 1000) {
        return require('@/assets/img/range-visualizer/range-1000.png')
      }
      if (this.getCurrentRangeMax() === 250) {
        return require('@/assets/img/range-visualizer/range-250.png')
      }

      return require('@/assets/img/range-visualizer/range-50.png')
    },

    getCurrentRangeMax() {
      let max = 1000
      if (parseInt(this.localValue) <= 250) {
        max = 250
      }
      if (parseInt(this.localValue) <= 50) {
        max = 50
      }

      return parseInt(max)
    },

    percentToUnits(percent) {
      return Math.round(this.getCurrentRangeMax() * (percent / 100))
    },

    unitsToPosition(units) {
      return parseInt(Math.round(units / this.getCurrentRangeMax() * 100))
    }
  }
}
</script>

<style>
.range-visualizer-control {
  width: 100%;
}

.range-visualizer-stage {
  line-height: 0;
  position: relative;
}

.range-visualizer {
  border-radius: 5px;
  border: 1px solid black;
  display: block;
  width: 100%;
}

.unit-label {
  position: absolute;
  display: block;
  top: 50%;
  color: rgba(255, 240, 0, 1);
  left: 11%;
  font-size: 26px;
  font-weight: bold;
  text-shadow: 1px 3px 1px black;
  z-index: 9999;
}

.unit-label--marker {
  transform: translateX(8px);
  white-space: nowrap;
}

.unit-label--marker.unit-label--before {
  text-align: right;
  transform: translateX(calc(-100% - 8px));
}

.tick {
  top: 10%;
  font-size: 22px;
  color: white;
}

.rv-vertical-line {
  border-left: 2px solid rgba(255, 240, 0, .8);
  background-color: blue;
  transform: translateX(-50%);
  height: 99%;
  position: absolute;
  display: block;
  top: 0;
  left: 10%;
  z-index: 9999;
}

.rv-vertical-line-tick {
  border-left: 2px solid rgba(255, 255, 255, 1);
  background-color: white;
  transform: translateX(-50%);
  height: 98%;
  position: absolute;
  display: block;
  top: 1%;
  left: 10%;
}

.rv-slider-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 0 4px 2px;
}

.rv-slider {
  flex: 1;
  cursor: pointer;
}

.rv-slider-value {
  min-width: 45px;
  text-align: right;
  font-weight: bold;
  font-size: 14px;
}
</style>
