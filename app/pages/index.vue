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
							description=".png, .jpg, .tiff files"
							accept=".png,.jpg,.jpeg,.tiff"
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
const activeTab = ref<"segmentation" | "classification">("segmentation");

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
			const {
				data: resultData,
				error: resultError,
				refresh,
			} = await useAPIFetch<Chat>(`/results/${data.value.job_id}`, {
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
