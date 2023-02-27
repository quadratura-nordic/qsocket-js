"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _qsocket, _onsuccess, _onerror, _Local, _path;
Object.defineProperty(exports, "__esModule", { value: true });
class QSocket {
    constructor(host, onsuccess, onerror) {
        this.protocol = "wss://";
        this.channels = {};
        this.closing = false;
        this.ws = null;
        this.reconnectTimeout = 1;
        this.host = host;
        this.onerror = onerror;
        this.onsuccess = onsuccess;
        if (window.location.protocol == "http:") {
            this.protocol = "ws://";
        }
        this.open();
    }
    open() {
        this.closing = false;
        let pingInterval;
        const ws = new WebSocket(this.protocol + this.host);
        this.ws = ws;
        ws.onopen = (evt) => {
            if (!pingInterval) {
                pingInterval = setInterval(() => {
                    if (ws.readyState != ws.OPEN) {
                        clearInterval(pingInterval);
                        // let 1 send trough to trigger err?
                    }
                    ws.send("");
                }, 10000);
            }
            if (this.onsuccess) {
                this.onsuccess(evt);
            }
        };
        ws.onclose = (e) => {
            console.log("Socket closed", e.code);
            if (pingInterval) {
                clearInterval(pingInterval);
            }
            if (e.code == 4401 || e.code == 4403) { // == .close(), socket should be closed
                this.closing = true;
                this.onerror(e);
                return;
            }
            if (this.closing) {
                return;
            }
            setTimeout(() => {
                this.open();
                if (this.reconnectTimeout < 8192) {
                    this.reconnectTimeout *= 2;
                }
            }, this.reconnectTimeout);
        };
        ws.onmessage = (evt) => {
            const response = JSON.parse(evt.data);
            if (response &&
                response.channel &&
                response.event &&
                this.channels[response.channel] &&
                this.channels[response.channel][response.event]) {
                this.channels[response.channel][response.event](response.content);
            }
        };
        ws.onerror = (evt) => {
            if (this.onerror) {
                this.onerror(evt);
            }
            console.log("Socket error", evt);
        };
    }
    subscribe(channel, event, callback) {
        if (!this.channels[channel]) {
            this.channels[channel] = {};
        }
        this.channels[channel][event] = callback;
    }
    unsubscribe(channel) {
        this.channels[channel] = {};
    }
    send(data) {
        if (this.ws) {
            this.ws.send(JSON.stringify(data));
        }
    }
    close() {
        this.closing = true;
        if (this.ws) {
            this.ws.close();
        }
    }
}
class Notification {
    constructor(onsuccess = () => {
        return;
    }, onerror = () => {
        return;
    }, path = "") {
        _qsocket.set(this, void 0);
        _onsuccess.set(this, void 0);
        _onerror.set(this, void 0);
        _Local.set(this, void 0);
        _path.set(this, void 0);
        __classPrivateFieldSet(this, _qsocket, null);
        __classPrivateFieldSet(this, _onsuccess, onsuccess);
        __classPrivateFieldSet(this, _onerror, onerror);
        __classPrivateFieldSet(this, _Local, {});
        __classPrivateFieldSet(this, _path, path || (window.location.host + '/api/ws'));
    }
    init() {
        return new QSocket(__classPrivateFieldGet(this, _path), __classPrivateFieldGet(this, _onsuccess), __classPrivateFieldGet(this, _onerror));
    }
    subscribe(channel, event, callback) {
        if (!__classPrivateFieldGet(this, _qsocket)) {
            __classPrivateFieldSet(this, _qsocket, this.init());
        }
        // this.#qsocket.reconnectTimeout = 1; // we just resubscribed, we cleary want socket to be open
        __classPrivateFieldGet(this, _qsocket).subscribe(channel, event, (e) => {
            callback(e);
        });
        if (__classPrivateFieldGet(this, _qsocket).closing) {
            __classPrivateFieldGet(this, _qsocket).open();
        }
        if (!__classPrivateFieldGet(this, _Local)[channel]) {
            __classPrivateFieldGet(this, _Local)[channel] = {};
        }
        __classPrivateFieldGet(this, _Local)[channel][event] = callback;
    }
    message(channel, event, content) {
        if (!__classPrivateFieldGet(this, _qsocket)) {
            __classPrivateFieldSet(this, _qsocket, this.init());
        }
        __classPrivateFieldGet(this, _qsocket).send({ channel, event, content });
    }
    unsubscrbe(channel) {
        if (__classPrivateFieldGet(this, _qsocket)) {
            __classPrivateFieldGet(this, _qsocket).unsubscribe(channel);
        }
    }
    notify(channel, event, e = null) {
        if (__classPrivateFieldGet(this, _Local)[channel] && __classPrivateFieldGet(this, _Local)[channel][event]) {
            __classPrivateFieldGet(this, _Local)[channel][event](e);
        }
    }
    close() {
        if (__classPrivateFieldGet(this, _qsocket)) {
            __classPrivateFieldGet(this, _qsocket).close();
        }
    }
}
exports.default = Notification;
_qsocket = new WeakMap(), _onsuccess = new WeakMap(), _onerror = new WeakMap(), _Local = new WeakMap(), _path = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU0sT0FBTztJQVNYLFlBQ0UsSUFBWSxFQUNaLFNBQWdDLEVBQ2hDLE9BQThCO1FBUmhDLGFBQVEsR0FBVyxRQUFRLENBQUM7UUFDNUIsYUFBUSxHQUFZLEVBQUUsQ0FBQztRQUN2QixZQUFPLEdBQVksS0FBSyxDQUFDO1FBQ3pCLE9BQUUsR0FBcUIsSUFBSSxDQUFDO1FBQzVCLHFCQUFnQixHQUFXLENBQUMsQ0FBQztRQU0zQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUUzQixJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxJQUFJLE9BQU8sRUFBRTtZQUN2QyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztTQUN6QjtRQUNELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFDRCxJQUFJO1FBQ0YsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDckIsSUFBSSxZQUFnQyxDQUFDO1FBQ3JDLE1BQU0sRUFBRSxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ2xCLElBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQ2pCLFlBQVksR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFO29CQUM5QixJQUFJLEVBQUUsQ0FBQyxVQUFVLElBQUksRUFBRSxDQUFDLElBQUksRUFBRTt3QkFDNUIsYUFB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