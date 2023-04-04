export default class Notification {
    #private;
    constructor(onsuccess?: () => void, onerror?: () => void, path?: string);
    private init;
    subscribe<T>(channel: string, event: string, callback: (args: T) => void): void;
    message(channel: string, event: string, content: string): void;
    unsubscribe(channel: string): void;
    notify(channel: string, event: string, e?: null): void;
    close(): void;
}
