type EventName = 'expand-active-selection' | 'remove-from-active-selection' | 'start-new-selection'

export const EventEmitter = {
    _events: new Map<EventName, (data: any) => any>([]),

    subscribe(event: EventName, callback: (data: any) => any) {
        this._events.set(event, callback)
    },

    dispatch(event: EventName, data: any) {
        const callback = this._events.get(event)
        if (callback) callback(data)
    },

    unsubscribe(event: EventName) {
        this._events.set(event, () => {})
    }
}
