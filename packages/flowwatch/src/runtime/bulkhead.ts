export interface BulkheadOptions {
  limit: number
  queue?: number
}

export interface Bulkhead {
  execute<T>(fn: () => Promise<T>): Promise<T>
  readonly active: number
  readonly queued: number
}

export function createBulkhead({ limit, queue = 0 }: BulkheadOptions): Bulkhead {
  let active = 0
  const pending: Array<() => void> = []

  async function execute<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= limit) {
      if (pending.length >= queue) {
        throw new Error(`Bulkhead full: ${limit} concurrent, ${queue} queued`)
      }
      await new Promise<void>((resolve) => pending.push(resolve))
    }
    active++
    try {
      return await fn()
    } finally {
      active--
      pending.shift()?.()
    }
  }

  return {
    execute,
    get active() { return active },
    get queued() { return pending.length },
  }
}
