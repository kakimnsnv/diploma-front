export default defineNuxtRouteMiddleware((to, from) => {

  const { isLoggedIn } = useAuth()

  if (!isLoggedIn.value && !to.path.startsWith('/auth')) {
    return navigateTo({
      path: '/auth/login',
      query: { redirect: to.fullPath },
    })
  }

  if (isLoggedIn.value && to.path.startsWith('/auth')) {
    return navigateTo(from.path)
  }
})