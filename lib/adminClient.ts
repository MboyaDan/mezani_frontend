import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios"
import { getAdminAccessToken, getAdminRefreshToken, saveAdminTokens, clearAdminTokens } from "@/lib/adminAuth"

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
}

export const ADMIN_API: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

ADMIN_API.interceptors.request.use((config) => {
  const token = getAdminAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else if (token) p.resolve(token)
  })
  failedQueue = []
}

ADMIN_API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as CustomAxiosRequestConfig | undefined
    if (!original) return Promise.reject(error)

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers = original.headers ?? {}
          original.headers.Authorization = `Bearer ${token}`
          return ADMIN_API(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refreshToken = getAdminRefreshToken()
      if (!refreshToken) {
        clearAdminTokens()
        window.location.href = "/superadmin/login"
        return Promise.reject(error)
      }

      try {
        const res = await axios.post<{ access_token: string; refresh_token: string }>(
          `${process.env.NEXT_PUBLIC_API_URL}/superadmin/refresh`,
          { refresh_token: refreshToken }
        )

        saveAdminTokens(res.data)
        ADMIN_API.defaults.headers.common.Authorization = `Bearer ${res.data.access_token}`
        processQueue(null, res.data.access_token)

        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${res.data.access_token}`
        return ADMIN_API(original)
      } catch (err: unknown) {
        processQueue(err, null)
        clearAdminTokens()
        window.location.href = "/superadmin/login"
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default ADMIN_API