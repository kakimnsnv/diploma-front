<template>
	<div class="w-full">
		<UDashboardPanel>
			<template #header>
				<DashboardNavbar>
					<template #leading>
						<UBadge
							v-if="chat?.name"
							color="neutral"
							variant="subtle"
							size="sm"
							leading-icon="i-heroicons-document"
							class="max-w-xs hidden md:flex"
						>
							<span class="truncate font-mono text-xs">{{ chat.name }}</span>
						</UBadge>
					</template>
					<template #action1>
						<UButton
							color="error"
							variant="ghost"
							icon="i-lucide-trash"
							to="/"
							:loading="isDeleting"
							@click="deleteRecord()"
						/>
					</template>
					<template #action2>
						<UButton
							color="neutral"
							variant="ghost"
							icon="i-lucide-download"
							:loading="isDownloading"
							class="lg:hidden"
							@click="downloadImage"
						/>
					</template>
					<template #trailing>
						<UButton
							color="neutral"
							variant="ghost"
							icon="i-lucide-plus"
							to="/"
							class="lg:hidden"
						/>
					</template>>
				</DashboardNavbar>
			</template>

			<template #body>
				<div v-if="pending">
					<USkeleton class="h-48 w-full" />
				</div>

				<!-- Ошибка на уровне HTTP -->
				<div v-else-if="error">
					<UError :error="error" />
					<UButton
						block
						to="/"
						label="Go back"
						class="mt-4"
					/>
				</div>

				<!-- Ошибка сегментации (status: failed) -->
				<div
					v-else-if="isFailed"
					class="flex flex-col items-center gap-4 py-8 text-center"
				>
					<UIcon
						name="i-heroicons-exclamation-triangle"
						class="w-12 h-12 text-error"
					/>
					<div>
						<p class="text-lg font-semibold text-error">
							Ошибка обработки
						</p>
						<div
							v-if="chat?.name"
							class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md"
						>
							<UIcon
								name="i-heroicons-document"
								class="w-3.5 h-3.5  shrink-0"
							/>
							<span class="text-xs  font-mono truncate max-w-xs">{{ chat.name }}</span>
						</div>
						<p
							v-if="chat?.error_message"
							class="mt-2 text-sm max-w-md break-words"
						>
							{{ chat.error_message }}
						</p>
						<p
							v-else
							class="mt-2 text-sm"
						>
							Не удалось выполнить сегментацию снимка.
						</p>
					</div>
					<UButton
						to="/"
						label="Попробовать снова"
						icon="i-heroicons-arrow-path"
						class="text-center"
					/>
				</div>

				<!-- Успешный результат -->
				<div
					v-else-if="chat"
					class="space-y-4 h-full"
				>
					<UBadge
						v-if="chat?.name"
						color="neutral"
						variant="subtle"
						size="sm"
						leading-icon="i-heroicons-document"
						class="max-w-xs md:hidden"
					>
						<span class="truncate font-mono text-xs">{{ chat.name }}</span>
					</UBadge>

					<div class="flex flex-col md:flex-row gap-4">
						<div
							class="relative w-full md:w-1/2 mx-auto group cursor-zoom-in"
							@click="openLightbox"
						>
							<NuxtImg
								:src="chat?.output_image_url"
								alt="Result"
								class="aspect-square w-full rounded-lg outline-primary outline-dashed"
							/>
							<div
								class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 rounded-lg flex items-center justify-center"
							>
								<div
									class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2"
								>
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
							label="New chat"
							icon="i-lucide-file-plus-corner"
							to="/"
							block
							size="lg"
							:disabled="pending"
							class="hidden lg:flex"
						/>
						<UButton
							label="Download image"
							icon="i-lucide-download"
							:loading="isDownloading"
							block
							size="lg"
							class="hidden lg:flex"
							@click="downloadImage"
						/>
					</div>
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
					class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
					@click.self="closeLightbox"
				>
					<div class="absolute top-4 right-4 flex items-center gap-2 z-10">
						<UButton
							icon="i-heroicons-minus"
							color="primary"
							variant="soft"
							size="sm"
							:disabled="zoom <= MIN_ZOOM"
							@click="zoomOut"
						/>
						<span class="text-neutral text-sm font-mono w-14 text-center select-none">{{ Math.round(zoom * 100) }}%</span>
						<UButton
							icon="i-heroicons-plus"
							color="primary"
							variant="soft"
							size="sm"
							:disabled="zoom >= MAX_ZOOM"
							@click="zoomIn"
						/>
						<UButton
							icon="i-heroicons-arrow-path"
							color="primary"
							variant="soft"
							size="sm"
							@click="resetView"
						/>
						<UButton
							icon="i-heroicons-x-mark"
							color="primary"
							variant="soft"
							size="sm"
							@click="closeLightbox"
						/>
					</div>

					<div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs select-none pointer-events-none">
						Колесо мыши / pinch для масштаба · Перетащите для перемещения
					</div>

					<div
						ref="containerRef"
						class="w-full h-full overflow-hidden flex items-center justify-center touch-none"
						:class="zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'"
						@wheel.prevent="onWheel"
						@mousedown="onMouseDown"
						@mousemove="onMouseMove"
						@mouseup="onMouseUp"
						@mouseleave="onMouseUp"
						@touchstart.prevent="onTouchStart"
						@touchmove.prevent="onTouchMove"
						@touchend.prevent="onTouchEnd"
						@touchcancel.prevent="onTouchEnd"
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
	</div>
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

const isFailed = computed(() => chat.value?.status === "failed");

// ─── Download ─────────────────────────────────────────────────────────────────

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

// ─── Delete ─────────────────────────────────────────────────────────────────

async function deleteRecord() {
	await deleteChat();
	await refreshNuxtData("history");
}

const {
	error: deleteError,
	pending: isDeleting,
	execute: deleteChat,
} = await useAPIFetch<Chat>(() => `/results/${id.value}`, {
	method: "DELETE",
});

const toast = useToast();

watch(deleteError, async () => {
	toast.add({
		title: "Delete Error",
		description: error.value?.data?.error || "Failed to delete record. Please try again.",
		icon: "i-lucide-circle-alert",
		color: "error",
	});
});

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

// Touch state
const touchState = ref<{
	lastDistance: number;
	lastCenter: { x: number; y: number };
	lastZoom: number;
	lastPan: { x: number; y: number };
	singleStart: { x: number; y: number };
} | null>(null);

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
	zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parseFloat((zoom.value + delta).toFixed(2))));
	if (zoom.value <= 1) pan.value = { x: 0, y: 0 };
	else clampPan();
}

function onMouseDown(e: MouseEvent) {
	if (zoom.value <= 1) return;
	isDragging.value = true;
	dragStart.value = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y };
}

function onMouseMove(e: MouseEvent) {
	if (!isDragging.value) return;
	pan.value = { x: e.clientX - dragStart.value.x, y: e.clientY - dragStart.value.y };
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

function getTouchDistance(touches: TouchList) {
	if (touches.length < 2) return 0;
	const a = touches.item(0);
	const b = touches.item(1);
	return a && b ? Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY) : 0;
}

function getTouchCenter(touches: TouchList) {
	if (touches.length === 0) return { x: 0, y: 0 };
	const a = touches.item(0);
	if (!a) return { x: 0, y: 0 };
	if (touches.length === 1) return { x: a.clientX, y: a.clientY };
	const b = touches.item(1);
	return b
		? { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
		: { x: a.clientX, y: a.clientY };
}

function onTouchStart(e: TouchEvent) {
	if (e.touches.length === 2) {
		const distance = getTouchDistance(e.touches);
		const center = getTouchCenter(e.touches);
		touchState.value = {
			lastDistance: distance,
			lastCenter: center,
			lastZoom: zoom.value,
			lastPan: { ...pan.value },
			singleStart: { x: 0, y: 0 },
		};
	}
	else if (e.touches.length === 1) {
		const t = e.touches.item(0);
		if (t) {
			touchState.value = {
				lastDistance: 0,
				lastCenter: { x: 0, y: 0 },
				lastZoom: zoom.value,
				lastPan: { ...pan.value },
				singleStart: { x: t.clientX - pan.value.x, y: t.clientY - pan.value.y },
			};
		}
	}
}

function onTouchMove(e: TouchEvent) {
	if (!touchState.value) return;
	if (e.touches.length === 2) {
		const distance = getTouchDistance(e.touches);
		if (touchState.value.lastDistance > 0) {
			const scale = distance / touchState.value.lastDistance;
			zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, parseFloat((touchState.value.lastZoom * scale).toFixed(2))));
			const center = getTouchCenter(e.touches);
			pan.value = {
				x: touchState.value.lastPan.x + (center.x - touchState.value.lastCenter.x),
				y: touchState.value.lastPan.y + (center.y - touchState.value.lastCenter.y),
			};
			touchState.value.lastDistance = distance;
			touchState.value.lastCenter = center;
			touchState.value.lastZoom = zoom.value;
			touchState.value.lastPan = { ...pan.value };
		}
	}
	else if (e.touches.length === 1) {
		const t = e.touches.item(0);
		const state = touchState.value;
		if (t && state) {
			pan.value = {
				x: t.clientX - state.singleStart.x,
				y: t.clientY - state.singleStart.y,
			};
		}
	}
}

function onTouchEnd(e: TouchEvent) {
	if (e.touches.length < 2) {
		if (e.touches.length === 1 && touchState.value) {
			const t = e.touches.item(0);
			if (t) {
				touchState.value.singleStart = { x: t.clientX - pan.value.x, y: t.clientY - pan.value.y };
			}
		}
		else {
			touchState.value = null;
			if (zoom.value <= 1) pan.value = { x: 0, y: 0 };
			else clampPan();
		}
	}
	else {
		const prev = touchState.value;
		touchState.value = {
			lastDistance: getTouchDistance(e.touches),
			lastCenter: getTouchCenter(e.touches),
			lastZoom: zoom.value,
			lastPan: { ...pan.value },
			singleStart: prev?.singleStart ?? { x: 0, y: 0 },
		};
	}
}
</script>
