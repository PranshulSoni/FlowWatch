export interface ServiceInstance {
    url: string
    healthy: boolean
    latencyMs: number
    lastCheckedAt: Date | null
}

export interface RegisterServiceOptions {
    healthPath?: string   // default "/health"
    intervalMs?: number   // default 10_000
    timeoutMs?: number    // default 3_000
}

export interface ServiceRegistry {
    register(name: string, urls: string[], options?: RegisterServiceOptions): void
    resolve(name: string): string | null
    status(): Record<string, ServiceInstance[]>
    close(): void
}

export function createServiceRegistry(): ServiceRegistry {
    const services = new Map<string, ServiceInstance[]>()
    const timers = new Map<string, ReturnType<typeof setInterval>>()
    const counters = new Map<string, number>()

    async function checkInstance(instance: ServiceInstance, healthPath: string, timeoutMs: number): Promise<void> {
        const start = Date.now()
        try {
            const controller = new AbortController()
            const tid = setTimeout(() => controller.abort(), timeoutMs)
            const res = await fetch(`${instance.url}${healthPath}`, { signal: controller.signal })
            clearTimeout(tid)
            instance.latencyMs = Date.now() - start
            instance.healthy = res.ok
        } catch {
            instance.latencyMs = Date.now() - start
            instance.healthy = false
        }
        instance.lastCheckedAt = new Date()
    }

    return {
        register(name, urls, options = {}) {
            const healthPath = options.healthPath ?? "/health"
            const intervalMs = options.intervalMs ?? 10_000
            const timeoutMs = options.timeoutMs ?? 3_000

            const instances: ServiceInstance[] = urls.map(url => ({
                url,
                healthy: true,   // optimistic until first check
                latencyMs: 0,
                lastCheckedAt: null,
            }))

            services.set(name, instances)
            counters.set(name, 0)

            // run immediately then on interval
            Promise.all(instances.map(i => checkInstance(i, healthPath, timeoutMs))).catch(() => {})

            const timer = setInterval(() => {
                Promise.all(instances.map(i => checkInstance(i, healthPath, timeoutMs))).catch(() => {})
            }, intervalMs)

            timers.get(name) && clearInterval(timers.get(name)!)
            timers.set(name, timer)
        },

        resolve(name) {
            const instances = services.get(name)
            if (!instances) return null
            const healthy = instances.filter(i => i.healthy)
            if (healthy.length === 0) return null
            const idx = (counters.get(name) ?? 0) % healthy.length
            counters.set(name, idx + 1)
            return healthy[idx].url
        },

        status() {
            const out: Record<string, ServiceInstance[]> = {}
            for (const [name, instances] of services) {
                out[name] = instances.map(i => ({ ...i }))
            }
            return out
        },

        close() {
            for (const timer of timers.values()) clearInterval(timer)
            timers.clear()
        },
    }
}
