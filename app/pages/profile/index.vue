<script setup lang="ts">
interface ProcessingJob {
	id: number;
	name: string;
	status: string;
	created_at: string;
	updated_at: string;
	error_message?: string;
}

const authStore = useAuthStore();

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
const form = reactive({
	name: authStore.user?.name ?? "",
	phone: (authStore.user as any)?.phone ?? "",
	city: (authStore.user as any)?.city ?? "",
	country: (authStore.user as any)?.country ?? "",
});

const saving = ref(false);
const saveSuccess = ref(false);

const { execute: saveProfile } = useAPIFetch(
	() => "/user/profile",
	{
		method: "PUT",
		body: form,
		immediate: false,
	} as any,
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

const statusConfig: Record<string, { label: string; class: string; dot: string }> = {
	completed: {
		label: "Completed",
		class: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
		dot: "bg-emerald-400",
	},
	failed: { label: "Failed", class: "bg-rose-500/10 text-rose-400 border border-rose-500/20", dot: "bg-rose-400" },
	pending: { label: "Pending", class: "bg-amber-500/10 text-amber-400 border border-amber-500/20", dot: "bg-amber-400" },
	processing: {
		label: "Processing",
		class: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
		dot: "bg-blue-400 animate-pulse",
	},
};
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardNavbar />
		</template>
		<div class="min-h-screen bg-[#0a0a0f] text-white">
			<!-- Grid bg -->
			<div
				class="fixed inset-0 opacity-[0.03] pointer-events-none"
				style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 40px 40px;"
			/>

			<!-- Glow -->
			<div
				class="fixed top-0 right-1/4 w-[500px] h-[300px] rounded-full opacity-10 blur-[120px] pointer-events-none"
				style="background: radial-gradient(ellipse, #7c3aed, transparent 70%)"
			/>

			<div class="relative w-full px-6 py-10">
				<!-- Header -->
				<div class="flex items-center gap-3 mb-8">
					<NuxtLink
						to="/"
						class="text-zinc-600 hover:text-zinc-400 transition-colors"
					>
						<svg
							class="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
					</NuxtLink>
					<div class="w-px h-4 bg-white/10" />
					<div class="flex items-center gap-2">
						<div class="w-1.5 h-1.5 rounded-full bg-violet-400" />
						<span class="text-xs tracking-[0.2em] uppercase text-violet-400 font-medium">Profile</span>
					</div>
				</div>

				<div class="grid grid-cols-3 gap-6">
					<!-- LEFT: Avatar + stats -->
					<div class="col-span-1 space-y-4">
						<!-- Avatar card -->
						<div
							class="rounded-2xl border border-white/5 bg-white/[0.03] p-6 flex flex-col items-center text-center backdrop-blur"
						>
							<div
								class="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-2xl font-bold text-white mb-4 ring-4 ring-violet-500/10"
							>
								{{ getInitials(authStore.user?.name ?? "") }}
							</div>
							<p class="text-white font-semibold text-lg">
								{{ authStore.user?.name }}
							</p>
							<p class="text-zinc-500 text-sm mt-0.5">
								{{ authStore.user?.email }}
							</p>
							<span
								class="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
								:class="authStore.user?.role === 'admin'
									? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
									: 'bg-white/5 text-zinc-400 border border-white/10'"
							>
								<span
									class="w-1.5 h-1.5 rounded-full"
									:class="authStore.user?.role === 'admin' ? 'bg-violet-400' : 'bg-zinc-500'"
								/>
								{{ authStore.user?.role }}
							</span>
						</div>

						<!-- Stats card -->
						<div class="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur space-y-4">
							<p class="text-xs text-zinc-600 uppercase tracking-widest">
								Activity
							</p>

							<div
								v-if="historyPending"
								class="flex justify-center py-4"
							>
								<div class="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
							</div>

							<div
								v-else
								class="space-y-3"
							>
								<div class="flex items-center justify-between">
									<span class="text-sm text-zinc-500">Total Jobs</span>
									<span class="text-white font-semibold">{{ jobs.length }}</span>
								</div>
								<div class="w-full h-px bg-white/5" />
								<div class="flex items-center justify-between">
									<span class="text-sm text-zinc-500">Completed</span>
									<span class="text-emerald-400 font-semibold">{{ completedJobs }}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-zinc-500">Failed</span>
									<span class="text-rose-400 font-semibold">{{ failedJobs }}</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-zinc-500">In Progress</span>
									<span class="text-amber-400 font-semibold">{{ pendingJobs }}</span>
								</div>

								<!-- Progress bar -->
								<div class="mt-2">
									<div class="w-full h-1.5 rounded-full bg-white/5 overflow-hidden flex">
										<div
											class="h-full bg-emerald-500 transition-all duration-700"
											:style="{ width: jobs.length ? `${(completedJobs / jobs.length) * 100}%` : '0%' }"
										/>
										<div
											class="h-full bg-rose-500 transition-all duration-700"
											:style="{ width: jobs.length ? `${(failedJobs / jobs.length) * 100}%` : '0%' }"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- RIGHT: Edit form + history -->
					<div class="col-span-2 space-y-6">
						<!-- Edit form -->
						<div class="rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur">
							<h2 class="text-sm font-medium text-zinc-300 mb-5 flex items-center gap-2">
								<svg
									class="w-4 h-4 text-violet-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
								Personal Info
							</h2>

							<div class="grid grid-cols-2 gap-4">
								<!-- Name -->
								<div class="col-span-2">
									<label class="block text-xs text-zinc-500 mb-1.5 uppercase tracking-widest">Name</label>
									<input
										v-model="form.name"
										type="text"
										class="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
										placeholder="Your name"
									>
								</div>

								<!-- Phone -->
								<div>
									<label class="block text-xs text-zinc-500 mb-1.5 uppercase tracking-widest">Phone</label>
									<input
										v-model="form.phone"
										type="tel"
										class="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
										placeholder="+7 (000) 000-00-00"
									>
								</div>

								<!-- Country -->
								<div>
									<label class="block text-xs text-zinc-500 mb-1.5 uppercase tracking-widest">Country</label>
									<input
										v-model="form.country"
										type="text"
										class="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
										placeholder="Kazakhstan"
									>
								</div>

								<!-- City -->
								<div>
									<label class="block text-xs text-zinc-500 mb-1.5 uppercase tracking-widest">City</label>
									<input
										v-model="form.city"
										type="text"
										class="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.06] transition-all"
										placeholder="Almaty"
									>
								</div>

								<!-- Email (readonly) -->
								<div>
									<label class="block text-xs text-zinc-500 mb-1.5 uppercase tracking-widest">Email</label>
									<input
										:value="authStore.user?.email"
										type="email"
										readonly
										class="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-zinc-600 cursor-not-allowed"
									>
								</div>
							</div>

							<!-- Save button -->
							<div class="flex items-center justify-end gap-3 mt-5">
								<Transition name="fade">
									<span
										v-if="saveSuccess"
										class="text-sm text-emerald-400 flex items-center gap-1.5"
									>
										<svg
											class="w-4 h-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Saved
									</span>
								</Transition>
								<button
									:disabled="saving"
									class="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors flex items-center gap-2"
									@click="handleSave"
								>
									<div
										v-if="saving"
										class="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"
									/>
									{{ saving ? "Saving..." : "Save Changes" }}
								</button>
							</div>
						</div>

						<!-- Recent history -->
						<div class="rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur">
							<h2 class="text-sm font-medium text-zinc-300 mb-5 flex items-center gap-2">
								<svg
									class="w-4 h-4 text-violet-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								Recent Jobs
							</h2>

							<div
								v-if="historyPending"
								class="flex justify-center py-8"
							>
								<div class="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
							</div>

							<div
								v-else-if="jobs.length === 0"
								class="text-center py-8 text-zinc-600 text-sm"
							>
								No jobs yet
							</div>

							<div
								v-else
								class="space-y-2"
							>
								<div
									v-for="job in jobs.slice(0, 8)"
									:key="job.id"
									class="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0"
								>
									<div class="flex items-center gap-3 min-w-0">
										<div
											class="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center shrink-0"
										>
											<svg
												class="w-3.5 h-3.5 text-zinc-500"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
										</div>
										<div class="min-w-0">
											<p class="text-sm text-white truncate">
												{{ job.name }}
											</p>
											<p class="text-xs text-zinc-600">
												{{ formatDate(job.created_at) }}
											</p>
										</div>
									</div>

									<span
										class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ml-3"
										:class="statusConfig[job.status]?.class ?? 'bg-white/5 text-zinc-400'"
									>
										<span
											class="w-1.5 h-1.5 rounded-full"
											:class="statusConfig[job.status]?.dot ?? 'bg-zinc-500'"
										/>
										{{ statusConfig[job.status]?.label ?? job.status }}
									</span>
								</div>
							</div>

							<NuxtLink
								v-if="jobs.length > 8"
								to="/history"
								class="block mt-4 text-center text-xs text-zinc-600 hover:text-violet-400 transition-colors"
							>
								View all {{ jobs.length }} jobs →
							</NuxtLink>
						</div>
					</div>
				</div>
			</div>
		</div>
	</UDashboardPanel>
</template>

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
