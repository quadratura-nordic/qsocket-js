declare type MessageCallback = (args: any) => void;
declare type Channel = Record<string, Record<string, MessageCallback>>;
declare class QSocket {
    host: string;
    onsuccess: (args: Event) => void;
    onerror: (args: Event) => void;
    protocol: string;
    channels: Channel;
    closing: boolean;
    ws: WebSocket | null;
    reconnectTimeout: number;
    constructor(host: string, onsuccess: (args: Event) => void, onerror: (args: Event) => void);
    open(): void;
    subscribe<T>(channel: string, event: string, callback: (args: T) => void): void;
    unsubscribe(channel: string): void;
    send(data: {
        [key: string]: string;
    }): void;
    close(): void;
}
export default class Notification {
    _qsocket: QSocket | null;
    _onsuccess: (args: Event) => void;
    _onerror: (args: Event) => void;
    _Local: Channel;
    _path: string;
    constructor(onsuccess?: () => void, onerror?: () => void, path?: string);
    private init;
    subscribe<T>(channel: string, event: string, callback: (args: T) => void): void;
    message(channel: string, event: string, content: string): void;
    unsubscribe(channel: string): void;
    notify(channel: string, event: string, e?: null): void;
    close(): void;
}
export {};
