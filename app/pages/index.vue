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
							v-model="state.image"
							icon="i-lucide-file-chart-column"
							label="Drop your file here"
							description=".nii file only"
							accept=".nii"
							class="h-[calc(100vh_-_10rem)]"
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
