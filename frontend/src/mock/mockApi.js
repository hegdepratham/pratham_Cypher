
import { MOCK_ACTIONS } from './actions'
import { ApiError } from '../api/ApiError'

const wait = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms))

let store = []

function decide(id, status) {
  const action = store.find((a) => a.id === id)

  if (!action) {
    throw new ApiError(`Action ${id} not found`, 404)
  }

  if (action.status !== 'pending') {
    throw new ApiError(
      `Action ${id} is already ${action.status}`,
      409,
    )
  }

  action.status = status
  return structuredClone(action)
}

export const mockApi = {
  async getActions() {
    await wait()
    return structuredClone(store)
  },

  async analyze() {
    await wait(1200)

    const decidedIds = store
      .filter((a) => a.status !== 'pending')
      .map((a) => a.id)

    store = structuredClone(MOCK_ACTIONS).map((a) =>
      decidedIds.includes(a.id)
        ? { ...a, status: 'approved' }
        : a,
    )

    return structuredClone(store.filter((a) => a.status === 'pending'))
  },

  async approve(id) {
    await wait()
    return decide(id, 'approved')
  },

  async reject(id) {
    await wait()
    return decide(id, 'rejected')
  },

  async ask() {
    await wait(800)
    return {
      answer:
        'This is a sample answer. The real one comes from the backend.',
    }
  },
}