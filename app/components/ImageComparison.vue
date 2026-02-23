<template>
	<div
		class="image-comparison"
		@mousedown="showOriginal"
		@mouseup="hideOriginal"
		@mouseleave="hideOriginal"
		@touchstart="showOriginal"
		@touchend="hideOriginal"
		@touchcancel="hideOriginal"
	>
		<div class="comparison-container">
			<!-- Edited Image (default view) -->
			<div class="image-wrapper">
				<img
					:src="editedImage"
					alt="Edited"
					class="comparison-image"
				>
			</div>

			<!-- Original Image (shown on press) -->
			<div
				class="image-wrapper image-overlay"
				:class="{ visible: isPressed }"
			>
				<img
					:src="originalImage"
					alt="Original"
					class="comparison-image"
				>
			</div>

			<!-- Instruction overlay -->
			<div
				v-if="showInstruction"
				class="instruction"
				:class="{ fade: isPressed }"
			>
				<div class="instruction-content">
					<!-- <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg> -->
					<span>{{ instructionText }}</span>
				</div>
			</div>

			<!-- Labels -->
			<div
				v-if="showLabel"
				class="label"
				:class="{ visible: isPressed }"
			>
				{{ isPressed ? originalLabel : editedLabel }}
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Props {
	originalImage: string;
	editedImage: string;
	showLabel?: boolean;
	showInstruction?: boolean;
	originalLabel?: string;
	editedLabel?: string;
	instructionText?: string;
}

const props = withDefaults(defineProps<Props>(), {
	showLabel: true,
	showInstruction: true,
	originalLabel: "Original",
	editedLabel: "Edited",
	instructionText: "Press & Hold",
});

const isPressed = ref(false);

const showOriginal = (e: MouseEvent | TouchEvent) => {
	e.preventDefault();
	isPressed.value = true;
};

const hideOriginal = () => {
	isPressed.value = false;
};
</script>

  <style scoped>
  .image-comparison {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    user-select: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
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

  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  .image-overlay.visible {
    opacity: 1;
  }

  .comparison-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    pointer-events: none;
  }

  .instruction {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 12px 24px;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 500;
    backdrop-filter: blur(8px);
    z-index: 10;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .instruction.fade {
    opacity: 0;
  }

  .instruction-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .instruction-content svg {
    width: 20px;
    height: 20px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }

  .label {
    position: absolute;
    top: 16px;
    right: 16px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    backdrop-filter: blur(4px);
    z-index: 10;
    pointer-events: none;
    transition: all 0.2s ease;
  }

  .label.visible {
    background: rgba(59, 130, 246, 0.8);
  }

  /* Active state feedback */
  .image-comparison:active .comparison-container {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .instruction {
      font-size: 12px;
      padding: 10px 20px;
      bottom: 16px;
    }

    .instruction-content svg {
      width: 18px;
      height: 18px;
    }

    .label {
      font-size: 12px;
      padding: 6px 12px;
      top: 12px;
      right: 12px;
    }
  }
  </style>
