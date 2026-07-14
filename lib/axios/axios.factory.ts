import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
  AxiosInstance,
} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

const COOKIES_TO_CLEAR = ['access_token', 'refresh_token', 'role'];

function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;
  COOKIES_TO_CLEAR.forEach((name) => {
    document.cookie = `${name}=; path=/; max-age=0`;
  });
}

function getStatusCodeFromPayload(payload: unknown): number | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  // Backend might wrap the real payload under `data`
  const p = payload as any;
  return (
    p?.statusCode ??
    p?.error?.statusCode ??
    p?.data?.statusCode ??
    p?.data?.error?.statusCode
  );
}

/**
 * Factory function to create axios instance with interceptors.
 * On 401/403 (client only): clear auth cookies and redirect to sign-in.
 */
export const createAxiosService = (
  getCookie: (name: string) => Promise<string | null> | string | null
): AxiosInstance => {
  const serviceAxios = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
  });

  serviceAxios.interceptors.request.use(
    async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
      const accessToken = await getCookie('access_token');
      if (accessToken) {
        if (config.headers instanceof AxiosHeaders) {
          config.headers.set('Authorization', `Bearer ${accessToken}`);
        } else {
          config.headers = new AxiosHeaders(config.headers);
          (config.headers as AxiosHeaders).set('Authorization', `Bearer ${accessToken}`);
        }
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  serviceAxios.interceptors.response.use(
    (res) => {
      // Some backends return HTTP 200 but embed auth errors in body: { error: { statusCode: 401/403 } }
      const statusInBody = getStatusCodeFromPayload(res.data);
      console.log('statusInBody', statusInBody);
      console.log('res.data', res.data);
      if (statusInBody === 401 || statusInBody === 403) {
        if (typeof window !== 'undefined') {
          clearAuthCookies();
          const isAdmin = window.location.pathname.startsWith('/admin');
          window.location.href = isAdmin ? '/admin/sign-in' : '/sign-in';
        }

        const msg =
          (res.data as any)?.error?.message ??
          (res.data as any)?.message ??
          'Unauthorized';
        return Promise.reject(new AxiosError(msg, undefined, res.config, res.request, res));
      }

      return res;
    },
    async (error: AxiosError) => {
      const data = error.response?.data as
        | { statusCode?: number; error?: { statusCode?: number } }
        | undefined;
      const status =
        error.response?.status ??
        data?.error?.statusCode ??
        data?.statusCode;

      if ((status === 401 || status === 403) && typeof window !== 'undefined') {
        clearAuthCookies();
        const isAdmin = window.location.pathname.startsWith('/admin');
        window.location.href = isAdmin ? '/admin/sign-in' : '/sign-in';
      }

      return Promise.reject(error);
    }
  );

  return serviceAxios;
};

