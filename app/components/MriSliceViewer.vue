<template>
	<div
		class="flex flex-col items-center gap-4 w-full"
		tabindex="0"
		@keydown="onKeyDown"
	>
		<!-- Slice image -->
		<div class="relative w-full max-w-lg aspect-square bg-black rounded-lg overflow-hidden">
			<img
				:src="'data:image/png;base64,' + slices[currentIndex]"
				alt="MRI Slice"
				class="w-full h-full object-contain"
				draggable="false"
			>
		</div>

		<!-- Slice counter -->
		<div class="text-sm font-mono">
			Slice {{ currentIndex + 1 }} / {{ slices.length }}
		</div>

		<!-- Range slider -->
		<input
			v-model.number="currentIndex"
			type="range"
			:min="0"
			:max="slices.length - 1"
			class="w-full max-w-lg accent-primary cursor-pointer"
		>

		<!-- Controls -->
		<div class="flex items-center gap-3">
			<UButton
				:icon="isPlaying ? 'i-lucide-pause' : 'i-lucide-play'"
				:label="isPlaying ? 'Pause' : 'Play'"
				@click="togglePlay"
			/>

			<div class="flex items-center gap-1">
				<UButton
					label="Slow"
					size="sm"
					:variant="speed === 200 ? 'solid' : 'ghost'"
					@click="speed = 200"
				/>
				<UButton
					label="Normal"
					size="sm"
					:variant="speed === 100 ? 'solid' : 'ghost'"
					@click="speed = 100"
				/>
				<UButton
					label="Fast"
					size="sm"
					:variant="speed === 50 ? 'solid' : 'ghost'"
					@click="speed = 50"
				/>
			</div>
		</div>

		<p class="text-xs text-muted">
			Arrow keys to navigate, Space to play/pause
		</p>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	slices: string[];
}>();

const currentIndex = ref(0);
const isPlaying = ref(false);
const speed = ref(100);
let intervalId: ReturnType<typeof setInterval> | null = null;

function startPlayback() {
	stopPlayback();
	isPlaying.value = true;
	intervalId = setInterval(() => {
		currentIndex.value = (currentIndex.value + 1) % props.slices.length;
	}, speed.value);
}

function stopPlayback() {
	isPlaying.value = false;
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
	}
}

function togglePlay() {
	if (isPlaying.value) {
		stopPlayback();
	}
	else {
		startPlayback();
	}
}

watch(speed, () => {
	if (isPlaying.value) {
		startPlayback();
	}
});

function onKeyDown(e: KeyboardEvent) {
	if (e.key === "ArrowRight") {
		currentIndex.value = Math.min(props.slices.length - 1, currentIndex.value + 1);
	}
	else if (e.key === "ArrowLeft") {
		currentIndex.value = Math.max(0, currentIndex.value - 1);
	}
	else if (e.key === " ") {
		e.preventDefault();
		togglePlay();
	}
}

onUnmounted(() => {
	stopPlayback();
});
</script>
