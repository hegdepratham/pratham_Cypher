import { ApiError } from './ApiError'
import { mockApi } from '../mock/mockApi'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

async function request(method, path, body, timeoutMs = 20000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    let data = null
    try {
      data = await res.json()
    } catch {
      // The response may be empty or not JSON.
    }

    if (!res.ok) {
      throw new ApiError(
        (data && data.error) || `Request failed (${res.status})`,
        res.status,
      )
    }

    return data
  } catch (err) {
    if (err instanceof ApiError) throw err

    const message =
      err.name === 'AbortError'
        ? 'The server took too long to answer. Try again in a moment.'
        : 'Cannot reach the server. Check your connection and try again.'

    throw new ApiError(message, 0)
  } finally {
    clearTimeout(timer)
  }
}

const realApi = {
  getActions: () => request('GET', '/api/actions'),
  analyze: () => request('POST', '/api/agent/analyze', undefined, 45000),
  approve: (id) => request('POST', `/api/actions/${id}/approve`),
  reject: (id) => request('POST', `/api/actions/${id}/reject`),
  ask: (question) =>
    request('POST', '/api/agent/ask', { question }, 30000),
}

export const api = USE_MOCK ? mockApi : realApi