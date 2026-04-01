export interface ApiErrorResponse {
  error: string
  code?: string
  details?: unknown
}

export interface ApiSuccess<T> {
  data: T
}