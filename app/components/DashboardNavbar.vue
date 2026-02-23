<template>
	<UDashboardNavbar
		class="sticky top-0 inset-x-0 border-b-0 z-10 bg-default/75 backdrop-blur lg:bg-transparent lg:backdrop-blur-none pointer-events-none"
		:ui="{ left: 'pointer-events-auto', right: 'pointer-events-auto' }"
	>
		<template #leading>
			<slot name="leading" />
		</template>
		<template #right>
			<slot name="action1" />
			<slot name="action2" />

			<UColorModeButton />
			<slot name="trailing" />
		</template>
	</UDashboardNavbar>
</template>
