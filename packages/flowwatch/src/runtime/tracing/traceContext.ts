import { AsyncLocalStorage } from "node:async_hooks"

export interface TraceContext {
    traceId: string
    currentSpanId?: string
    userId?: string
    ip?: string
}

const traceStorage = new AsyncLocalStorage<TraceContext>()
//Added a generic class named async local storage with the type tracecontext, as its a generic class all its methods also return the generic type.
export function runWithTraceContext<T>(context: TraceContext, callback: () => T): T {
    return traceStorage.run(context, callback)
}

export function getCurrentTraceContext(): TraceContext | undefined {
    return traceStorage.getStore()
}

export function getCurrentClientIp(): string | undefined {
    return traceStorage.getStore()?.ip
}

export function getCurrentTraceId(): string | undefined {
    return traceStorage.getStore()?.traceId
}

export function getCurrentSpanId(): string | undefined {
    return traceStorage.getStore()?.currentSpanId
}

export function runWithSpanContext<T>(spanId: string, callback: () => T): T {
    const currentContext = traceStorage.getStore()

    if (!currentContext) {
        return callback()
    }

    return traceStorage.run(
        {
            ...currentContext,
            currentSpanId: spanId,
        },
        callback
    )
}
