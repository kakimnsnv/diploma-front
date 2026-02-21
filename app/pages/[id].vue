<template>
	<UDashboardPanel>
		<template #header>
			<DashboardNavbar />
		</template>

		<template #body>
			<div v-if="pending">
				<USkeleton class="h-48 w-full" />
			</div>

			<div
				v-if="!pending && chat"
				class="space-y-4 h-full"
			>
				<div class="flex flex-col md:flex-row gap-4">
					<div
						class="relative w-full md:w-1/2 mx-auto group cursor-zoom-in"
						@click="openLightbox"
					>
						<NuxtImg
							:src="chat?.output_image_url"
							alt="Result"
							class="aspect-square w-full rounded-lg"
						/>
						<div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 rounded-lg flex items-center justify-center">
							<div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2 text-white">
								<UIcon
									name="i-heroicons-magnifying-glass-plus"
									class="w-10 h-10 drop-shadow-lg"
								/>
								<span class="text-sm font-medium drop-shadow-lg">Нажмите для просмотра</span>
							</div>
						</div>
					</div>
				</div>

				<div class="flex gap-4 mt-4">
					<UButton
						label="Download image"
						icon="i-heroicons-arrow-down-tray"
						:loading="isDownloading"
						class="flex-1"
						@click="downloadImage"
					/>
					<UButton
						label="New chat"
						to="/"
						:disabled="isPolling"
						class="flex-1"
					/>
				</div>
			</div>

			<div v-if="!pending && error">
				<UError :error="error" />
				<UButton
					block
					to="/"
					label="Go back"
					class="mt-4"
				/>
			</div>
		</template>
	</UDashboardPanel>

	<!-- Lightbox -->
	<Teleport to="body">
		<Transition
			enter-active-class="transition duration-200 ease-out"
			enter-from-class="opacity-0 scale-95"
			enter-to-class="opacity-100 scale-100"
			leave-active-class="transition duration-150 ease-in"
			leave-from-class="opacity-100 scale-100"
			leave-to-class="opacity-0 scale-95"
		>
			<div
				v-if="lightboxOpen"
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
				@click.self="closeLightbox"
			>
				<!-- Toolbar -->
				<div class="absolute top-4 right-4 flex items-center gap-2 z-10">
					<UButton
						icon="i-heroicons-minus"
						color="white"
						variant="soft"
						size="sm"
						:disabled="zoom <= MIN_ZOOM"
						@click="zoomOut"
					/>
					<span class="text-white text-sm font-mono w-14 text-center select-none">
						{{ Math.round(zoom * 100) }}%
					</span>
					<UButton
						icon="i-heroicons-plus"
						color="white"
						variant="soft"
						size="sm"
						:disabled="zoom >= MAX_ZOOM"
						@click="zoomIn"
					/>
					<UButton
						icon="i-heroicons-arrow-path"
						color="white"
						variant="soft"
						size="sm"
						@click="resetView"
					/>
					<UButton
						icon="i-heroicons-x-mark"
						color="white"
						variant="soft"
						size="sm"
						@click="closeLightbox"
					/>
				</div>

				<!-- Zoom hint -->
				<div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs select-none pointer-events-none">
					Колесо мыши для масштаба · Перетащите для перемещения
				</div>

				<!-- Image container -->
				<div
					ref="containerRef"
					class="w-full h-full overflow-hidden flex items-center justify-center"
					:class="zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'"
					@wheel.prevent="onWheel"
					@mousedown="onMouseDown"
					@mousemove="onMouseMove"
					@mouseup="onMouseUp"
					@mouseleave="onMouseUp"
				>
					<img
						:src="chat?.output_image_url"
						alt="Result"
						class="select-none pointer-events-none max-w-none"
						:style="{
							transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
							transition: isDragging ? 'none' : 'transform 0.15s ease',
							maxHeight: '90vh',
							maxWidth: '90vw',
						}"
						draggable="false"
					>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
const route = useRoute();
const id = computed(() => route.params.id as string);

const {
	data: chat,
	pending,
	error,
	execute,
} = await useAPIFetch<Chat>(() => `/results/${id.value}`, {
	key: () => `results-${id.value}`,
});

execute();

// ─── Download ────────────────────────────────────────────────────────────────

const isDownloading = ref(false);

async function downloadImage() {
	if (!chat.value?.output_image_url) return;
	isDownloading.value = true;
	try {
		const response = await fetch(chat.value.output_image_url);
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `result-${id.value}.png`;
		a.click();
		URL.revokeObjectURL(url);
	}
	finally {
		isDownloading.value = false;
	}
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const ZOOM_STEP = 0.25;

const lightboxOpen = ref(false);
const zoom = ref(1);
const pan = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const containerRef = ref<HTMLElement | null>(null);

function openLightbox() {
	lightboxOpen.value = true;
	resetView();
	document.addEventListener("keydown", onKeyDown);
}

function closeLightbox() {
	lightboxOpen.value = false;
	document.removeEventListener("keydown", onKeyDown);
}

function resetView() {
	zoom.value = 1;
	pan.value = { x: 0, y: 0 };
}

function zoomIn() {
	zoom.value = Math.min(MAX_ZOOM, parseFloat((zoom.value + ZOOM_STEP).toFixed(2)));
}

function zoomOut() {
	zoom.value = Math.max(MIN_ZOOM, parseFloat((zoom.value - ZOOM_STEP).toFixed(2)));
	clampPan();
}

function onWheel(e: WheelEvent) {
	const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
	const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parseFloat((zoom.value + delta).toFixed(2))));
	zoom.value = newZoom;
	if (newZoom <= 1) pan.value = { x: 0, y: 0 };
	else clampPan();
}

function onMouseDown(e: MouseEvent) {
	if (zoom.value <= 1) return;
	isDragging.value = true;
	dragStart.value = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y };
}

function onMouseMove(e: MouseEvent) {
	if (!isDragging.value) return;
	pan.value = {
		x: e.clientX - dragStart.value.x,
		y: e.clientY - dragStart.value.y,
	};
}

function onMouseUp() {
	isDragging.value = false;
	clampPan();
}

function clampPan() {
	if (!containerRef.value) return;
	const { width, height } = containerRef.value.getBoundingClientRect();
	const maxX = (width * (zoom.value - 1)) / 2;
	const maxY = (height * (zoom.value - 1)) / 2;
	pan.value = {
		x: Math.min(maxX, Math.max(-maxX, pan.value.x)),
		y: Math.min(maxY, Math.max(-maxY, pan.value.y)),
	};
}

function onKeyDown(e: KeyboardEvent) {
	if (e.key === "Escape") closeLightbox();
	if (e.key === "+" || e.key === "=") zoomIn();
	if (e.key === "-") zoomOut();
	if (e.key === "0") resetView();
}
</script>
