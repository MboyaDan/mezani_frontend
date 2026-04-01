import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios"

export interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
}

export const API: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

// ─── Attach access token ───────────────────────────────────────────────
API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token")

    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

// ─── Refresh logic ─────────────────────────────────────────────────────
let isRefreshing = false

let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else if (token) {
      p.resolve(token)
    }
  })

  failedQueue = []
}

// ─── Response interceptor ──────────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as CustomAxiosRequestConfig | undefined

    // Safety check
    if (!original) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !original._retry) {
      // ─── Queue requests while refreshing ───
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers = original.headers ?? {}
          original.headers.Authorization = `Bearer ${token}`
          return API(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem("refresh_token")

      if (!refreshToken) {
        localStorage.clear()
        window.location.href = "/login"
        return Promise.reject(error)
      }

      try {
        const res = await axios.post<{
          access_token: string
          refresh_token: string
        }>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        )

        const { access_token, refresh_token } = res.data

        // Store new tokens
        localStorage.setItem("access_token", access_token)
        localStorage.setItem("refresh_token", refresh_token)

        // Update default headers
        API.defaults.headers.common.Authorization = `Bearer ${access_token}`

        // Resolve queued requests
        processQueue(null, access_token)

        // Retry original request
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${access_token}`

        return API(original)
      } catch (err: unknown) {
        processQueue(err, null)

        localStorage.clear()
        window.location.href = "/login"

        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default API