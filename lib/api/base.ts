import API from "@/lib/client"

export async function get<T>(url: string): Promise<T> {
  const res = await API.get<T>(url)
  return res.data
}   

export async function post<T, B = unknown>(url: string, body: B): Promise<T> {
  const res = await API.post<T>(url, body)
  return res.data
}