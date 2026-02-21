<template>
	<UDashboardPanel>
		<template #header>
			<DashboardNavbar />
		</template>

		<template #body>
			<div v-if="pending">
				<!-- <USkeleton class="h-48 w-full mb-8" /> -->
				<USkeleton class="h-48 w-full" />
			</div>

			<div
				v-if="!pending && chat"
				class="space-y-4 h-full"
			>
				<div v-if="chat.original_image_url && chat.result_image_url">
					<ImageComparison
						:original-image="chat.original_image_url"
						:edited-image="chat.result_image_url"
						:show-label="true"
						:show-instruction="true"
					/>
				</div>

				<div
					v-else-if="chat.original_image_url && !chat.result_image_url"
					class="flex flex-col md:flex-row gap-4"
				>
					<div class="w-full md:w-1/2">
						<div class="text-center mb-2">
							<span class="text-sm font-medium text-gray-700">Original</span>
						</div>
						<NuxtImg
							:src="chat.original_image_url"
							alt="Original MRI"
							class="aspect-square w-full rounded-lg shadow-lg"
						/>
					</div>

					<div class="w-full md:w-1/2">
						<div class="text-center mb-2">
							<span class="text-sm font-medium text-gray-700">Result</span>
						</div>
						<div class="aspect-square w-full rounded-lg bg-gray-100 flex flex-col items-center justify-center shadow-lg">
							<UIcon
								name="i-lucide-loader-circle"
								class="w-12 h-12 text-primary animate-spin mb-4"
							/>
							<p class="text-gray-600 font-medium">
								Processing image...
							</p>
						</div>
					</div>
				</div>

				<div
					v-else
					class="text-center py-12"
				>
					<UIcon
						name="i-lucide-image-off"
						class="w-16 h-16 mx-auto text-gray-400 mb-4"
					/>
					<p class="text-gray-500">
						No images available
					</p>
				</div>

				<UButton
					block
					to="/"
					label="New chat"
					:disabled="isPolling"
				/>
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
</template>

<script setup lang="ts">
const route = useRoute();
const id = computed(() => route.params.id as string);

const isPolling = ref(false);
const pollingAttempts = ref(0);
const MAX_ATTEMPTS = 60;

const {
	data: chat,
	pending,
	error,
	execute,
	refresh,
} = await useAPIFetch<Chat>(() => `/results/${id.value}`, {
	key: () => `results-${id.value}`,
});

await execute();

onMounted(async () => {
	if (chat.value && (!chat.value.result_image_url || chat.value.status !== "completed")) {
		isPolling.value = true;
		pollingAttempts.value = 0;

		while (pollingAttempts.value < MAX_ATTEMPTS) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			pollingAttempts.value++;

			await refresh();

			if (chat.value?.status === "completed" && chat.value?.result_image_url) {
				isPolling.value = false;
				break;
			}

			if (chat.value?.status === "failed" || error.value) {
				isPolling.value = false;
				break;
			}
		}

		if (pollingAttempts.value >= MAX_ATTEMPTS) {
			isPolling.value = false;
			console.warn("Polling timeout reached");
		}
	}
});
</script>
