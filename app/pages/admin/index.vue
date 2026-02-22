<script setup lang="ts">
definePageMeta({
	middleware: ["auth-client", "admin"],
  layout: "blank",
});

interface ProcessingJob {
	id: number;
	status: string;
	created_at: string;
}

interface UserWithJobs {
	id: number;
	email: string;
	name: string;
	role: string;
	processing_jobs: ProcessingJob[] | null;
}

const { data, pending, error, execute } = useAPIFetch<{ users: UserWithJobs[] }>(
	() => "/admin/users",
);

onMounted(() => execute());

const users = computed(() => data.value?.users ?? []);

const totalJobs = computed(() =>
	users.value.reduce((acc, u) => acc + (u.processing_jobs?.length ?? 0), 0),
);
const adminCount = computed(() => users.value.filter(u => u.role === "admin").length);
const userCount = computed(() => users.value.filter(u => u.role === "user").length);

function getInitials(name: string) {
	return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(id: number) {
	const colors = [
		"from-violet-500 to-purple-600",
		"from-blue-500 to-cyan-600",
		"from-emerald-500 to-teal-600",
		"from-orange-500 to-amber-600",
		"from-rose-500 to-pink-600",
	];
	return colors[id % colors.length];
}
</script>

<template>
	<div class="min-h-screen bg-[#0a0a0f] text-white font-sans">
		<!-- Background grid -->
		<div
			class="fixed inset-0 opacity-[0.03] pointer-events-none"
			style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 40px 40px;"
		/>

		<!-- Glow -->
		<div
			class="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 blur-[100px] pointer-events-none"
			style="background: radial-gradient(ellipse, #7c3aed, transparent 70%)"
		/>

		<div class="relative max-w-6xl mx-auto px-6 py-10">
			<!-- Header -->
			<div class="mb-10">
				<div class="flex items-center gap-3 mb-1">
				</div>
				<h1 class="text-4xl font-bold tracking-tight text-white">
					Admin Panel
				</h1>
				<p class="mt-1 text-zinc-500 text-sm">
					Manage users and monitor activity
				</p>
			</div>

			<!-- Stats row -->
			<div class="grid grid-cols-3 gap-4 mb-8">
				<div class="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur">
					<p class="text-xs text-zinc-500 uppercase tracking-widest mb-2">
						Total Users
					</p>
					<p class="text-3xl font-bold text-white">
						{{ users.length }}
					</p>
				</div>
				<div class="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur">
					<p class="text-xs text-zinc-500 uppercase tracking-widest mb-2">
						Processing Jobs
					</p>
					<p class="text-3xl font-bold text-violet-400">
						{{ totalJobs }}
					</p>
				</div>
				<div class="rounded-2xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur">
					<p class="text-xs text-zinc-500 uppercase tracking-widest mb-2">
						Admins / Users
					</p>
					<p class="text-3xl font-bold text-white">
						{{ adminCount }}
						<span class="text-zinc-600 text-xl font-normal">/</span>
						{{ userCount }}
					</p>
				</div>
			</div>

			<!-- Loading -->
			<div
				v-if="pending"
				class="flex items-center justify-center py-24 gap-3"
			>
				<div class="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
				<span class="text-zinc-500 text-sm">Loading users...</span>
			</div>

			<!-- Error -->
			<div
				v-else-if="error"
				class="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 text-center text-rose-400 text-sm"
			>
				Failed to load users. Please try again.
			</div>

			<!-- Table -->
			<div
				v-else
				class="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden backdrop-blur"
			>
				<!-- Table header -->
				<div class="grid grid-cols-12 px-6 py-3 border-b border-white/5 bg-white/[0.02]">
					<span class="col-span-1 text-xs text-zinc-600 uppercase tracking-widest">ID</span>
					<span class="col-span-4 text-xs text-zinc-600 uppercase tracking-widest">User</span>
					<span class="col-span-3 text-xs text-zinc-600 uppercase tracking-widest">Email</span>
					<span class="col-span-2 text-xs text-zinc-600 uppercase tracking-widest">Role</span>
					<span class="col-span-2 text-xs text-zinc-600 uppercase tracking-widest text-right">Jobs</span>
				</div>

				<!-- Empty -->
				<div
					v-if="users.length === 0"
					class="py-16 text-center text-zinc-600 text-sm"
				>
					No users found
				</div>

				<!-- Rows -->
				<div
					v-for="(user, index) in users"
					:key="user.id"
					class="grid grid-cols-12 px-6 py-4 items-center border-b border-white/[0.03] transition-colors duration-150 hover:bg-white/[0.03]"
					:class="{ 'border-b-0': index === users.length - 1 }"
				>
					<!-- ID -->
					<div class="col-span-1">
						<span class="text-xs text-zinc-600 font-mono">#{{ user.id }}</span>
					</div>

					<!-- User -->
					<div class="col-span-4 flex items-center gap-3">
						<div
							class="w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shrink-0"
							:class="getAvatarColor(user.id)"
						>
							{{ getInitials(user.name || user.email) }}
						</div>
						<span class="text-sm text-white font-medium truncate">{{ user.name || "—" }}</span>
					</div>

					<!-- Email -->
					<div class="col-span-3">
						<span class="text-sm text-zinc-400 truncate block">{{ user.email }}</span>
					</div>

					<!-- Role -->
					<div class="col-span-2">
						<span
							class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
							:class="user.role === 'admin'
								? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
								: 'bg-white/5 text-zinc-400 border border-white/10'"
						>
							<span
								class="w-1.5 h-1.5 rounded-full"
								:class="user.role === 'admin' ? 'bg-violet-400' : 'bg-zinc-500'"
							/>
							{{ user.role }}
						</span>
					</div>

					<!-- Jobs count -->
					<div class="col-span-2 text-right">
						<span
							class="inline-block px-2.5 py-1 rounded-lg text-sm font-semibold"
							:class="(user.processing_jobs?.length ?? 0) > 0
								? 'text-violet-300 bg-violet-500/10'
								: 'text-zinc-600'"
						>
							{{ user.processing_jobs?.length ?? 0 }}
						</span>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<p class="text-center text-zinc-700 text-xs mt-6">
				{{ users.length }} users loaded
			</p>
		</div>
	</div>
</template>
