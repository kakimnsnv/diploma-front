<template>
	<UDashboardPanel>
		<template #header>
			<DashboardNavbar />
		</template>

		<template #body>
			<div
				v-if="sttate === 'initial'"
				class="h-full flex items-end"
			>
				<UForm
					:schema="schema"
					:state="state"
					class="space-y-4 w-full h-full"
					:loading="pending"
					:disabled="pending"
					@submit.prevent="onSubmit"
				>
					<UFormField
						name="image"
						class="h-full"
						:error="error?.data?.error"
					>
						<UFileUpload
							v-model="state.image"
							icon="i-lucide-image"
							label="Drop your image here"
							description="PNG or JPEG only"
							accept="image/png,.jpg,.jpeg"
							class="h-[calc(100vh_-_8rem)]"
							highlight
							dropzone
						/>
						<UButton
							v-if="state.image"
							type="submit"
							label="Submit"
							block
							class="mt-2"
						/>
					</UFormField>
				</UForm>
			</div>

			<div v-if="sttate === 'loading'">
				<USkeleton class="h-48 w-full mb-8" />
				<USkeleton class="h-48 w-full" />
			</div>
		</template>
	</UDashboardPanel>
</template>

<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import z from "zod";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const DIMENSIONS = { width: 512, height: 512 };
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const schema = z.object({
	image: z
		.instanceof(File, {
			message: "Please select an image file.",
		})
		.refine(file => file.size <= MAX_FILE_SIZE, {
			message: `The image is too large. Please choose an image smaller than ${formatBytes(MAX_FILE_SIZE)}.`,
		})
		.refine(file => ACCEPTED_IMAGE_TYPES.includes(file.type), {
			message: "Please upload a valid image file (JPEG or PNG).",
		})
		.refine(
			file =>
				new Promise((resolve) => {
					const reader = new FileReader();
					reader.onload = (e) => {
						const img = new Image();
						img.onload = () => {
							const meetsDimensions
								= img.width == DIMENSIONS.width
									&& img.height == DIMENSIONS.height;
							resolve(meetsDimensions);
						};
						img.src = e.target?.result as string;
					};
					reader.readAsDataURL(file);
				}),
			{
				message: `The image dimensions are invalid. Please upload an image ${DIMENSIONS.width}x${DIMENSIONS.height} pixels.`,
			},
		),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
	image: undefined,
});

const formData = new FormData();
const { data, pending, error, execute } = await useAPIFetch<UploadResponse>("/upload", {
	method: "POST",
	body: formData,
});

const sttate = ref("initial");
const chat = ref<Chat | undefined>(undefined);

async function onSubmit(event: FormSubmitEvent<Schema>) {
	sttate.value = "loading";
	formData.append("image", event.data.image);

	await execute();

	if (!error.value) {
		if (data.value) {
			const { data: resultData, error: resultError, refresh } = await useAPIFetch<Chat>(`/results/${data.value.job_id}`, {
				method: "GET",
				immediate: true,
			});
			let attempts = 0;
			const MAX_ATTEMPTS = 60;
			while (resultData.value?.status !== "completed" && attempts < MAX_ATTEMPTS) {
				await new Promise(resolve => setTimeout(resolve, 1000));
				await refresh();
				if (resultError.value || resultData.value?.status === "failed") break;
				attempts++;
			}
			if (resultError.value || resultData.value?.status === "failed") {
				sttate.value = "error";
				return;
			}
			chat.value = resultData.value;
			sttate.value = "completed";

			await refreshNuxtData("history");

			navigateTo(`/${data.value.job_id}`);
		}
	}
	else {
		sttate.value = "error";
	}
}
</script>
