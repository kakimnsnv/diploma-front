<script setup lang="ts">
interface Props {
	threshold?: number;
	maxPullDistance?: number;
	resistance?: number;
}

const props = withDefaults(defineProps<Props>(), {
	threshold: 80,
	maxPullDistance: 150,
	resistance: 2.5,
});

const emit = defineEmits<{
	refresh: [];
}>();

const containerRef = ref<HTMLElement | null>(null);
const pullDistance = ref(0);
const isRefreshing = ref(false);
const isPulling = ref(false);

let startY = 0;
let currentY = 0;

const pullPercentage = computed(() => {
	return Math.min((pullDistance.value / props.threshold) * 100, 100);
});

const containerStyle = computed(() => ({
	transform: `translateY(${pullDistance.value}px)`,
	transition: isPulling.value ? "none" : "transform 0.3s ease",
}));

const spinnerRotation = computed(() => {
	return (pullPercentage.value / 100) * 360;
});

const handleTouchStart = (e: TouchEvent) => {
	if (isRefreshing.value) return;

	const scrollTop = window.scrollY || document.documentElement.scrollTop;

	// Only allow pull when at top of page
	if (scrollTop === 0) {
		startY = e.touches[0].clientY;
		isPulling.value = true;
	}
};

const handleTouchMove = (e: TouchEvent) => {
	if (!isPulling.value || isRefreshing.value) return;

	currentY = e.touches[0].clientY;
	const diff = currentY - startY;

	if (diff > 0) {
		// Prevent default scroll behavior
		e.preventDefault();

		// Apply resistance
		pullDistance.value = Math.min(
			diff / props.resistance,
			props.maxPullDistance,
		);
	}
};

const handleTouchEnd = async () => {
	if (!isPulling.value || isRefreshing.value) return;

	isPulling.value = false;

	if (pullDistance.value >= props.threshold) {
		isRefreshing.value = true;
		pullDistance.value = props.threshold;

		emit("refresh");

		// Auto-reset after a reasonable time if parent doesn't call done()
		setTimeout(() => {
			if (isRefreshing.value) {
				done();
			}
		}, 10000);
	}
	else {
		pullDistance.value = 0;
	}
};

const done = () => {
	isRefreshing.value = false;
	pullDistance.value = 0;
};

// Expose done method to parent
defineExpose({ done });

onMounted(() => {
	const container = containerRef.value;
	if (!container) return;

	container.addEventListener("touchstart", handleTouchStart, { passive: true });
	container.addEventListener("touchmove", handleTouchMove, { passive: false });
	container.addEventListener("touchend", handleTouchEnd, { passive: true });
});

onUnmounted(() => {
	const container = containerRef.value;
	if (!container) return;

	container.removeEventListener("touchstart", handleTouchStart);
	container.removeEventListener("touchmove", handleTouchMove);
	container.removeEventListener("touchend", handleTouchEnd);
});
</script>

<template>
	<div
		ref="containerRef"
		class="pull-to-refresh-container"
	>
		<!-- Pull indicator -->
		<div
			class="pull-indicator"
			:style="{ height: `${pullDistance}px` }"
		>
			<div class="pull-content">
				<div
					v-if="!isRefreshing"
					class="spinner"
					:style="{ transform: `rotate(${spinnerRotation}deg)` }"
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
					>
						<path
							d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>

				<div
					v-else
					class="spinner spinning"
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
					>
						<path
							d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</div>

				<span
					v-if="!isRefreshing && pullPercentage < 100"
					class="pull-text"
				>
					Pull to refresh
				</span>
				<span
					v-else-if="!isRefreshing && pullPercentage >= 100"
					class="pull-text"
				>
					Release to refresh
				</span>
				<span
					v-else
					class="pull-text"
				>
					Refreshing...
				</span>
			</div>
		</div>

		<!-- Content -->
		<div
			class="content-wrapper"
			:style="containerStyle"
		>
			<slot />
		</div>
	</div>
</template>

<style scoped>
.pull-to-refresh-container {
  position: relative;
  overflow: hidden;
  height: 100%;
}

.pull-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
  transform: translateY(-100%);
}

.pull-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.spinner {
  color: #3b82f6;
  transition: transform 0.1s ease;
}

.spinner.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.pull-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.content-wrapper {
  min-height: 100%;
}
</style>
