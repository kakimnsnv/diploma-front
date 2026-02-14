<template>
    <div class="image-comparison" ref="containerRef">
      <div class="comparison-container">
        <!-- Before Image (bottom layer) -->
        <div class="image-wrapper">
          <img :src="beforeImage" alt="Before" class="comparison-image" />
        </div>
  
        <!-- After Image (top layer with clip) -->
        <div class="image-wrapper image-after" :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }">
          <img :src="afterImage" alt="After" class="comparison-image" />
        </div>
  
        <!-- Slider -->
        <div 
          class="slider" 
          :style="{ left: `${sliderPosition}%` }"
          @mousedown="startDrag"
          @touchstart="startDrag"
        >
          <div class="slider-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
  
        <!-- Labels (optional) -->
        <div v-if="showLabels" class="labels">
          <div class="label label-before">Before</div>
          <div class="label label-after">After</div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  
  interface Props {
    beforeImage: string
    afterImage: string
    showLabels?: boolean
    initialPosition?: number
  }
  
  const props = withDefaults(defineProps<Props>(), {
    showLabels: true,
    initialPosition: 50
  })
  
  const containerRef = ref<HTMLElement | null>(null)
  const sliderPosition = ref(props.initialPosition)
  const isDragging = ref(false)
  
  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.value) return
  
    const rect = containerRef.value.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = (x / rect.width) * 100
  
    sliderPosition.value = Math.min(Math.max(percentage, 0), 100)
  }
  
  const startDrag = (e: MouseEvent | TouchEvent) => {
    isDragging.value = true
    e.preventDefault()
  }
  
  const onDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return
  
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    updateSliderPosition(clientX)
  }
  
  const stopDrag = () => {
    isDragging.value = false
  }
  
  const onClick = (e: MouseEvent) => {
    if (!isDragging.value) {
      updateSliderPosition(e.clientX)
    }
  }
  
  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('click', onClick)
    }
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
    document.addEventListener('touchmove', onDrag)
    document.addEventListener('touchend', stopDrag)
  })
  
  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('click', onClick)
    }
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('touchmove', onDrag)
    document.removeEventListener('touchend', stopDrag)
  })
  </script>
  
  <style scoped>
  .image-comparison {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    user-select: none;
  }
  
  .comparison-container {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .image-wrapper {
    position: relative;
    width: 100%;
    line-height: 0;
  }
  
  .image-after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  
  .comparison-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    pointer-events: none;
  }
  
  .slider {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    background: white;
    cursor: ew-resize;
    transform: translateX(-50%);
    z-index: 10;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
  }
  
  .slider::before,
  .slider::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    background: white;
  }
  
  .slider::before {
    top: 0;
    height: 100%;
  }
  
  .slider-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 48px;
    height: 48px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    gap: 0;
  }
  
  .slider-button svg {
    width: 16px;
    height: 16px;
    color: #333;
  }
  
  .labels {
    position: absolute;
    top: 16px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 16px;
    pointer-events: none;
    z-index: 5;
  }
  
  .label {
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    backdrop-filter: blur(4px);
  }
  
  .label-before {
    margin-right: auto;
  }
  
  .label-after {
    margin-left: auto;
  }
  
  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .slider-button {
      width: 40px;
      height: 40px;
    }
  
    .slider-button svg {
      width: 14px;
      height: 14px;
    }
  
    .label {
      font-size: 12px;
      padding: 4px 8px;
    }
  }
  </style>