<template>
	<UDashboardPanel>
		<template #header>
			<DashboardNavbar />
		</template>

		<template #body>
			<!-- Tab switcher -->
			<div
				v-if="sttate === 'initial'"
				class="h-full flex flex-col"
			>
				<div class="flex gap-2 mb-4">
					<UButton
						label="Segmentation"
						icon="i-lucide-scan"
						:variant="activeTab === 'segmentation' ? 'solid' : 'ghost'"
						@click="activeTab = 'segmentation'"
					/>
					<UButton
						label="Classification"
						icon="i-lucide-brain"
						:variant="activeTab === 'classification' ? 'solid' : 'ghost'"
						@click="activeTab = 'classification'"
					/>
					<UButton
						label="MRI Viewer"
						icon="i-lucide-layers"
						:variant="activeTab === 'mri-viewer' ? 'solid' : 'ghost'"
						@click="activeTab = 'mri-viewer'"
					/>
				</div>

				<!-- Segmentation upload -->
				<UForm
					v-if="activeTab === 'segmentation'"
					:schema="schema"
					:state="state"
					class="space-y-4 w-full flex-1"
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
							v-model="state.image"
							icon="i-lucide-file-chart-column"
							label="Drop your NII file here"
							description=".nii file only"
							accept=".nii"
							class="h-[calc(100vh_-_14rem)]"
							highlight
							dropzone
						/>
						<UButton
							v-if="state.image"
							type="submit"
							label="Submit"
							block
							class="mt-2 mb-3"
						/>
					</UFormField>
				</UForm>

				<!-- MRI Viewer upload -->
				<div v-if="activeTab === 'mri-viewer'">
					<div v-if="mriSlices.length > 0" class="space-y-4">
						<UButton
							label="Upload another"
							icon="i-lucide-arrow-left"
							variant="ghost"
							@click="mriSlices = []"
						/>
						<MriSliceViewer :slices="mriSlices" />
					</div>
					<div
						v-else-if="mriPending"
						class="flex flex-col items-center justify-center gap-4 h-[calc(100vh_-_14rem)]"
					>
						<UIcon
							name="i-lucide-loader-circle"
							class="h-10 w-10 animate-spin text-primary"
						/>
						<p class="text-sm text-dimmed">
							Processing MRI slices...
						</p>
					</div>
					<UForm
						v-else
						:schema="mriSchema"
						:state="mriState"
						class="space-y-4 w-full flex-1"
						:loading="mriPending"
						:disabled="mriPending"
						@submit="onMriSubmit"
						@error="onError"
					>
						<UFormField
							name="image"
							class="h-full"
						>
							<UFileUpload
								v-model="mriState.image"
								icon="i-lucide-layers"
								label="Drop your NII file here"
								description=".nii file only"
								accept=".nii"
								class="h-[calc(100vh_-_14rem)]"
								highlight
								dropzone
							/>
							<UButton
								v-if="mriState.image"
								type="submit"
								label="View Slices"
								block
								class="mt-2 mb-3"
							/>
						</UFormField>
					</UForm>
				</div>

				<!-- Classification upload -->
				<UForm
					v-if="activeTab === 'classification'"
					:schema="classifySchema"
					:state="classifyState"
					class="space-y-4 w-full flex-1"
					:loading="classifyPending"
					:disabled="classifyPending"
					@submit="onClassifySubmit"
					@error="onError"
				>
					<UFormField
						name="image"
						class="h-full"
						:error="classifyError?.data?.error"
					>
						<UFileUpload
							v-model="classifyState.image"
							icon="i-lucide-brain"
							label="Drop your image here"
							description=".png, .jpg, .tiff, .nii files"
							accept=".png,.jpg,.jpeg,.tiff,.nii"
							class="h-[calc(100vh_-_14rem)]"
							highlight
							dropzone
						/>
						<UButton
							v-if="classifyState.image"
							type="submit"
							label="Classify"
							block
							class="mt-2 mb-3"
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

const toast = useToast();
const activeTab = ref<"segmentation" | "classification" | "mri-viewer">("segmentation");

// ─── Segmentation ───────────────────────────────────────────────────────────

const schema = z.object({
	image: z.instanceof(File, {
		message: "Please select a file.",
	}),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
	image: undefined,
});

const uploadData = ref<UploadResponse | null>(null);
const pending = ref(false);
const error = ref<any>(null);

const sttate = ref("initial");
const chat = ref<Chat | undefined>(undefined);

async function onSubmit(event: FormSubmitEvent<Schema>) {
	sttate.value = "loading";
	pending.value = true;
	error.value = null;

	const formData = new FormData();
	formData.append("image", event.data.image);

	try {
		const config = useRuntimeConfig();
		uploadData.value = await $fetch<UploadResponse>("/upload", {
			baseURL: config.public.baseURL,
			method: "POST",
			body: formData,
			credentials: "include",
		});
	}
	catch (err: any) {
		error.value = err;
	}
	finally {
		pending.value = false;
	}

	if (!error.value && uploadData.value) {
		const jobId = uploadData.value.job_id;
		const config = useRuntimeConfig();
		let attempts = 0;
		const MAX_ATTEMPTS = 60;
		let resultData: Chat | null = null;

		while (attempts < MAX_ATTEMPTS) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			try {
				resultData = await $fetch<Chat>(`/results/${jobId}`, {
					baseURL: config.public.baseURL,
					method: "GET",
					credentials: "include",
				});
			}
			catch {
				sttate.value = "error";
				return;
			}
			if (resultData?.status === "completed" || resultData?.status === "failed") break;
			attempts++;
		}

		if (!resultData || resultData.status === "failed") {
			sttate.value = "error";
			return;
		}
		chat.value = resultData;
		sttate.value = "completed";

		await refreshNuxtData("history");

		await navigateTo(`/${jobId}`, { replace: true });
	}
	else if (error.value) {
		sttate.value = "initial";
		toast.add({
			title: "Upload Error",
			description: error.value?.data?.error || "Failed to upload image. Please try again.",
			icon: "i-lucide-circle-alert",
			color: "error",
		});
	}
}

// ─── Classification ─────────────────────────────────────────────────────────

const classifySchema = z.object({
	image: z.instanceof(File, {
		message: "Please select a file.",
	}),
});

type ClassifySchema = z.output<typeof classifySchema>;

const classifyState = reactive<Partial<ClassifySchema>>({
	image: undefined,
});

const classifyPending = ref(false);
const classifyError = ref<any>(null);

async function onClassifySubmit(event: FormSubmitEvent<ClassifySchema>) {
	classifyPending.value = true;
	classifyError.value = null;

	try {
		const config = useRuntimeConfig();
		const formData = new FormData();
		formData.append("image", event.data.image);

		const result = await $fetch<{ id: number }>("/classify", {
			baseURL: config.public.baseURL,
			method: "POST",
			body: formData,
			credentials: "include",
		});

		await refreshNuxtData("history");
		await navigateTo(`/${result.id}`, { replace: true });
	}
	catch (err: any) {
		classifyError.value = err;
		toast.add({
			title: "Classification Error",
			description: err?.data?.error || "Failed to classify image.",
			icon: "i-lucide-circle-alert",
			color: "error",
		});
	}
	finally {
		classifyPending.value = false;
	}
}

// ─── MRI Viewer ────────────────────────────────────────────────────────────

const mriSchema = z.object({
	image: z.instanceof(File, {
		message: "Please select a file.",
	}),
});

type MriSchema = z.output<typeof mriSchema>;

const mriState = reactive<Partial<MriSchema>>({
	image: undefined,
});

const mriPending = ref(false);
const mriSlices = ref<string[]>([]);

async function onMriSubmit(event: FormSubmitEvent<MriSchema>) {
	mriPending.value = true;

	try {
		const config = useRuntimeConfig();
		const formData = new FormData();
		formData.append("image", event.data.image);

		const result = await $fetch<SlicesResponse>("/slices", {
			baseURL: config.public.baseURL,
			method: "POST",
			body: formData,
			credentials: "include",
		});

		mriSlices.value = result.slices;
	}
	catch (err: any) {
		toast.add({
			title: "MRI Viewer Error",
			description: err?.data?.error || "Failed to process MRI file.",
			icon: "i-lucide-circle-alert",
			color: "error",
		});
	}
	finally {
		mriPending.value = false;
	}
}

// ─── Shared ─────────────────────────────────────────────────────────────────

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
</script>
