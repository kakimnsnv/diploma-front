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
					@submit="onSubmit"
					@error="onError"
				>
					<UFormField
						name="image"
						class="h-full"
						:error="error?.data?.error"
					>
						<UFileUpload
							:model-value="state.image"
							icon="i-lucide-image"
							label="Drop your image here"
							description="PNG or JPEG only"
							accept="image/png,.jpg,.jpeg"
							class="h-[calc(100vh_-_8rem)]"
							highlight
							dropzone
							@update:model-value="validateImage"
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
const toast = useToast();

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
			async (file) => {
				return new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onerror = () => reject(false);
					reader.onload = (e) => {
						const img = new Image();
						img.onerror = () => reject(false);
						img.onload = () => {
							const meetsDimensions
								= img.width === DIMENSIONS.width
									&& img.height === DIMENSIONS.height;
							resolve(meetsDimensions);
						};
						img.src = e.target?.result as string;
					};
					reader.readAsDataURL(file);
				});
			},
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
				sttate.value = "initial";
				toast.add({
					title: "Error",
					description: "Failed to process image. Please try again.",
					icon: "i-lucide-circle-alert",
					color: "error",
				});
				return;
			}

			await refreshNuxtData("history");

			await navigateTo(`/${data.value.job_id}`, { replace: true });
		}
	}
	else {
		sttate.value = "initial";
		toast.add({
			title: "Upload Error",
			description: error.value?.data?.error || "Failed to upload image. Please try again.",
			icon: "i-lucide-circle-alert",
			color: "error",
		});
	}
}

async function onError(event: any) {
	event.errors.forEach((err: any) => {
		toast.add({
			title: "Validation error:",
			description: err.message,
			icon: "i-lucide-circle-alert",
			color: "error",
		});
	});
}

async function validateImage(files: FileList | File[] | File | null) {
	if (!files) {
		state.image = undefined;
		return;
	}

	const file = Array.isArray(files) ? files[0] : files instanceof FileList ? files[0] : files;
	if (!file) return;

	try {
		await schema.pick({ image: true }).parseAsync({ image: file });
		state.image = file;
	}
	catch (err: any) {
		const firstError = err.errors?.[0]?.message || "Ensure the image dimension is " + DIMENSIONS.width + "x" + DIMENSIONS.height;

		toast.add({
			title: "Validation error:",
			description: firstError,
			icon: "i-lucide-circle-alert",
			color: "error",
		});

		state.image = undefined;
	}
}
</script>
