<template>
	<UDashboardPanel>
		<template #header>
			<DashboardNavbar />
		</template>
		<template #body>
			<div class="h-full overflow-y-auto">
				<div class="w-full ">
					<!-- Header -->
					<div class="flex items-center gap-3 mb-6 sm:mb-8">
						<UButton
							to="/"
							color="neutral"
							variant="ghost"
							icon="i-heroicons-arrow-left"
							aria-label="Back"
						/>
						<div class="h-4 w-px bg-border" />
						<div class="flex items-center gap-2">
							<div class="h-1.5 w-1.5 rounded-full bg-primary" />
							<span class="text-xs tracking-[0.2em] uppercase text-primary font-medium">Profile</span>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
						<!-- LEFT: Avatar + stats -->
						<div class="space-y-4 lg:col-span-1">
							<UCard variant="subtle">
								<div class="flex flex-col items-center text-center">
									<UAvatar
										:text="getInitials(authStore.user?.name ?? '')"
										size="xl"
										class="mb-4 bg-primary text-inverted ring-4 ring-primary/20"
									/>
									<p class="text-lg font-semibold text-highlighted">
										{{ authStore.user?.name }}
									</p>
									<p class="mt-0.5 text-sm text-dimmed">
										{{ authStore.user?.email }}
									</p>
									<UBadge
										:color="authStore.user?.role === 'admin' ? 'primary' : 'neutral'"
										variant="soft"
										size="sm"
										class="mt-3"
									>
										{{ authStore.user?.role }}
									</UBadge>
								</div>
							</UCard>

							<UCard variant="subtle">
								<p class="mb-4 text-xs uppercase tracking-widest text-dimmed">
									Activity
								</p>
								<div
									v-if="historyPending"
									class="flex justify-center py-6"
								>
									<UIcon
										name="i-heroicons-arrow-path"
										class="w-5 h-5 text-primary animate-spin"
									/>
								</div>
								<div
									v-else
									class="space-y-3"
								>
									<div class="flex items-center justify-between text-sm">
										<span class="text-dimmed">Total Jobs</span>
										<span class="font-semibold text-highlighted">{{ jobs.length }}</span>
									</div>
									<div class="border-t border-default" />
									<div class="flex items-center justify-between text-sm">
										<span class="text-dimmed">Completed</span>
										<span class="font-semibold text-success">{{ completedJobs }}</span>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-dimmed">Failed</span>
										<span class="font-semibold text-error">{{ failedJobs }}</span>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-dimmed">In Progress</span>
										<span class="font-semibold text-warning">{{ pendingJobs }}</span>
									</div>
									<div class="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
										<div
											class="h-full bg-success transition-all duration-700"
											:style="{ width: jobs.length ? `${(completedJobs / jobs.length) * 100}%` : '0%' }"
										/>
										<div
											class="h-full bg-error transition-all duration-700"
											:style="{ width: jobs.length ? `${(failedJobs / jobs.length) * 100}%` : '0%' }"
										/>
									</div>
								</div>
							</UCard>
						</div>

						<!-- RIGHT: Edit form + history -->
						<div class="space-y-4 lg:col-span-2 lg:space-y-6">
							<UCard variant="subtle">
								<template #header>
									<h2 class="flex items-center gap-2 text-sm font-medium text-highlighted">
										<UIcon
											name="i-heroicons-user-circle"
											class="w-4 h-4 text-primary"
										/>
										Personal Info
									</h2>
								</template>
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
									<div class="sm:col-span-2">
										<UFormField label="Name">
											<UInput
												v-model="form.name"
												placeholder="Your name"
												size="md"
											/>
										</UFormField>
									</div>
									<UFormField label="Phone">
										<UInput
											v-model="form.phone"
											type="tel"
											placeholder="+7 (000) 000-00-00"
											size="md"
										/>
									</UFormField>
									<UFormField label="Country">
										<UInput
											v-model="form.country"
											placeholder="Kazakhstan"
											size="md"
										/>
									</UFormField>
									<UFormField label="City">
										<UInput
											v-model="form.city"
											placeholder="Almaty"
											size="md"
										/>
									</UFormField>
									<UFormField label="Email">
										<UInput
											:model-value="authStore.user?.email"
											type="email"
											disabled
											size="md"
										/>
									</UFormField>
								</div>
								<template #footer>
									<div class="flex flex-wrap items-center justify-end gap-3">
										<Transition name="fade">
											<span
												v-if="saveSuccess"
												class="text-sm text-success flex items-center gap-1.5"
											>
												<UIcon
													name="i-heroicons-check"
													class="w-4 h-4"
												/>
												Saved
											</span>
										</Transition>
										<UButton
											:loading="saving"
											label="Save Changes"
											@click="handleSave"
										/>
									</div>
								</template>
							</UCard>

							<UCard variant="subtle">
								<template #header>
									<h2 class="flex items-center gap-2 text-sm font-medium text-highlighted">
										<UIcon
											name="i-heroicons-clock"
											class="w-4 h-4 text-primary"
										/>
										Recent Jobs
									</h2>
								</template>
								<div
									v-if="historyPending"
									class="flex justify-center py-8"
								>
									<UIcon
										name="i-heroicons-arrow-path"
										class="w-6 h-6 text-primary animate-spin"
									/>
								</div>
								<div
									v-else-if="jobs.length === 0"
									class="py-8 text-center text-sm text-dimmed"
								>
									No jobs yet
								</div>
								<ul
									v-else
									class="space-y-0 divide-y divide-default"
								>
									<li
										v-for="job in jobs.slice(0, 8)"
										:key="job.id"
										class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div class="flex min-w-0 items-center gap-3">
											<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated">
												<UIcon
													name="i-heroicons-document"
													class="h-3.5 w-3.5 text-dimmed"
												/>
											</div>
											<div class="min-w-0">
												<p class="truncate text-sm font-medium text-highlighted">
													{{ job.name }}
												</p>
												<p class="text-xs text-dimmed">
													{{ formatDate(job.created_at) }}
												</p>
											</div>
										</div>
										<UBadge
											:color="statusConfig[job.status]?.color ?? 'neutral'"
											variant="soft"
											size="sm"
											class="shrink-0 sm:ml-3"
										>
											{{ statusConfig[job.status]?.label ?? job.status }}
										</UBadge>
									</li>
								</ul>
								<NuxtLink
									v-if="jobs.length > 8"
									to="/history"
									class="mt-4 block text-center text-xs text-dimmed hover:text-primary"
								>
									View all {{ jobs.length }} jobs →
								</NuxtLink>
							</UCard>
						</div>
					</div>
				</div>
			</div>
		</template>
	</UDashboardPanel>
</template>

<script setup lang="ts">
interface ProcessingJob {
	id: number;
	name: string;
	status: string;
	created_at: string;
	updated_at: string;
	error_message?: string;
}

interface ProfileFormState {
	name: string;
	phone: string;
	city: string;
	country: string;
}

type UserProfileFields = Partial<Omit<ProfileFormState, "name">>;

const authStore = useAuthStore();
const userProfile = computed(() => authStore.user as (typeof authStore.user & UserProfileFields));

// Fetch history
const { data: historyData, pending: historyPending, execute: fetchHistory } = useAPIFetch<ProcessingJob[]>(
	() => "/history",
);

onMounted(() => fetchHistory());

const jobs = computed(() => historyData.value ?? []);
const completedJobs = computed(() => jobs.value.filter(j => j.status === "completed").length);
const failedJobs = computed(() => jobs.value.filter(j => j.status === "failed").length);
const pendingJobs = computed(() => jobs.value.filter(j => j.status === "pending" || j.status === "processing").length);

// Editable profile fields
const form = reactive<ProfileFormState>({
	name: authStore.user?.name ?? "",
	phone: userProfile.value?.phone ?? "",
	city: userProfile.value?.city ?? "",
	country: userProfile.value?.country ?? "",
});

const saving = ref(false);
const saveSuccess = ref(false);

const { execute: saveProfile } = useAPIFetch(
	() => "/user/profile",
	{
		method: "PUT",
		body: form,
		immediate: false,
	},
);

async function handleSave() {
	saving.value = true;
	saveSuccess.value = false;
	try {
		await saveProfile();
		authStore.setUser({ ...authStore.user!, ...form });
		saveSuccess.value = true;
		setTimeout(() => (saveSuccess.value = false), 3000);
	}
	finally {
		saving.value = false;
	}
}

function getInitials(name: string) {
	return (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(date: string) {
	return new Date(date).toLocaleDateString("ru-RU", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

const statusConfig: Record<string, { label: string; color: "success" | "error" | "warning" | "info" | "neutral" }> = {
	completed: { label: "Completed", color: "success" },
	failed: { label: "Failed", color: "error" },
	pending: { label: "Pending", color: "warning" },
	processing: { label: "Processing", color: "info" },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
