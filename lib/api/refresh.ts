import axios, { AxiosError } from "axios"
import { API, CustomAxiosRequestConfig } from "@/lib/client"

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

API.interceptors.response.use(
  (res) => res,
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
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        )

        const { access_token, refresh_token } = res.data

        localStorage.setItem("access_token", access_token)
        localStorage.setItem("refresh_token", refresh_token)

        API.defaults.headers.common.Authorization = `Bearer ${access_token}`

        processQueue(null, access_token)

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