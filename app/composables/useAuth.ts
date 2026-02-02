import type { User } from "~/types/user"

export const useAuth = () => {
  const {error: logoutError, execute: logoutExecute} = useAPIFetch("/logout", {
      method: "POST"
    })
  const {data: profileData,  execute: profileExecute} = useAPIFetch<User>("/profile", {
      method: "GET"
  })
  
  const user = useState<User | undefined>('user', () => undefined)
  const isLoggedIn = computed(() => !!user.value)
  
  watch(isLoggedIn, (value) => {
    if (value) {
      navigateTo('/')
    } else {
      navigateTo('/login')
    }
  })
  
  // on load run profile to check if httpOnly cookie is set and valid so you get user and set isLoggedIn as true so user do not need to login again
  if(!isLoggedIn.value) {
     profileExecute()
     watch(profileData, (value) => {
      if (value) {
        user.value = value
      }
     })
  }

  const logout = async () => {
    await logoutExecute()
    if (!logoutError.value) {
      user.value = undefined
    }
  }

  return { user, isLoggedIn, logout}
}
