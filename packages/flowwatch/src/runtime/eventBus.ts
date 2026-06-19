import { EventEmitter } from "node:events"

export type EventBus = EventEmitter

export function createEventBus(): EventBus {
  const bus = new EventEmitter()
  bus.setMaxListeners(100)
  return bus
}
