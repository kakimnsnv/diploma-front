import { useFetch } from '#app';

type useFetchType = typeof useFetch;

export const useAPIFetch: useFetchType = (path, options = {}) => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();

  options.baseURL = config.public.baseURL;
  options.immediate = false;
  options.credentials = 'include';
  options.onResponseError = (ctx) => {
    if (ctx.response.status === 401) {
      authStore.clearUser();
      navigateTo('/auth/login');
    }
  };
  options.onResponse = (ctx) => {
    if (authStore.cookiesChecked == false) {
      if (ctx.response.ok) {
        authStore.cookiesChecked = true;
      }
    }
  };
  return useFetch(path, options);
};
