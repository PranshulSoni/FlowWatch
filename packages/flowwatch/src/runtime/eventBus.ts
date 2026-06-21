import { EventEmitter } from "node:events"

export type EventBus = EventEmitter

export function createEventBus(): EventBus {
  const bus = new EventEmitter()
  bus.setMaxListeners(100)
  return bus
}

//To publish fw.events.emit('user.created',{id:'123',email:'hi@exmaple.com'})
//To subscribe for an event you can use fw.events.on('user.created',(user)=>{sendWelcomeEmail()})
