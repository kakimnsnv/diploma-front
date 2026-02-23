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
</script>

<template>
	<UDashboardPanel>
		<template #header>
			<DashboardNavbar />
		</template>
		<template #body>
			<div class="h-full overflow-y-auto">
				<div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
					<div class="mb-8 sm:mb-10">
						<h1 class="text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">
							Admin Panel
						</h1>
						<p class="mt-1 text-sm text-dimmed">
							Manage users and monitor activity
						</p>
					</div>

					<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<UCard variant="subtle">
							<p class="mb-2 text-xs uppercase tracking-widest text-dimmed">
								Total Users
							</p>
							<p class="text-3xl font-bold text-highlighted">
								{{ users.length }}
							</p>
						</UCard>
						<UCard variant="subtle">
							<p class="mb-2 text-xs uppercase tracking-widest text-dimmed">
								Processing Jobs
							</p>
							<p class="text-3xl font-bold text-primary">
								{{ totalJobs }}
							</p>
						</UCard>
						<UCard variant="subtle">
							<p class="mb-2 text-xs uppercase tracking-widest text-dimmed">
								Admins / Users
							</p>
							<p class="text-3xl font-bold text-highlighted">
								{{ adminCount }}
								<span class="mx-1 text-xl font-normal text-dimmed">/</span>
								{{ userCount }}
							</p>
						</UCard>
					</div>

					<div
						v-if="pending"
						class="flex items-center justify-center gap-3 py-24"
					>
						<UIcon
							name="i-heroicons-arrow-path"
							class="h-5 w-5 animate-spin text-primary"
						/>
						<span class="text-sm text-dimmed">Loading users...</span>
					</div>

					<UAlert
						v-else-if="error"
						color="error"
						variant="soft"
						title="Failed to load users"
						description="Please try again."
						class="mb-6"
					/>

					<UCard
						v-else
						variant="subtle"
						class="overflow-hidden"
					>
						<div class="hidden grid-cols-12 border-b border-default bg-elevated px-6 py-3 md:grid">
							<span class="col-span-1 text-xs uppercase tracking-widest text-dimmed">ID</span>
							<span class="col-span-4 text-xs uppercase tracking-widest text-dimmed">User</span>
							<span class="col-span-3 text-xs uppercase tracking-widest text-dimmed">Email</span>
							<span class="col-span-2 text-xs uppercase tracking-widest text-dimmed">Role</span>
							<span class="col-span-2 text-right text-xs uppercase tracking-widest text-dimmed">Jobs</span>
						</div>

						<div
							v-if="users.length === 0"
							class="py-16 text-center text-sm text-dimmed"
						>
							No users found
						</div>

						<div
							v-for="(user, index) in users"
							v-else
							:key="user.id"
							class="grid grid-cols-1 gap-3 border-b border-default px-4 py-4 transition-colors last:border-b-0 hover:bg-elevated/50 md:grid-cols-12 md:items-center md:gap-0 md:px-6"
							:class="{ 'border-b-0': index === users.length - 1 }"
						>
							<div class="md:col-span-1">
								<span class="font-mono text-xs text-dimmed">#{{ user.id }}</span>
							</div>

							<div class="flex items-center gap-3 md:col-span-4">
								<UAvatar
									:text="getInitials(user.name || user.email)"
									size="sm"
									color="primary"
									variant="soft"
								/>
								<span class="truncate text-sm font-medium text-highlighted">{{ user.name || "—" }}</span>
							</div>

							<div class="md:col-span-3">
								<span class="block truncate text-sm text-toned">{{ user.email }}</span>
							</div>

							<div class="md:col-span-2">
								<UBadge
									:color="user.role === 'admin' ? 'primary' : 'neutral'"
									variant="soft"
									size="sm"
								>
									{{ user.role }}
								</UBadge>
							</div>

							<div class="md:col-span-2 md:text-right">
								<UBadge
									:color="(user.processing_jobs?.length ?? 0) > 0 ? 'primary' : 'neutral'"
									variant="soft"
									size="sm"
								>
									{{ user.processing_jobs?.length ?? 0 }}
								</UBadge>
							</div>
						</div>
					</UCard>

					<p class="mt-6 text-center text-xs text-dimmed">
						{{ users.length }} users loaded
					</p>
				</div>
			</div>
		</template>
	</UDashboardPanel>
</template>
