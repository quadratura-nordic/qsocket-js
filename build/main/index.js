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
var _qsocket, _onsuccess, _onerror, _Local;
Object.defineProperty(exports, "__esModule", { value: true });
class QSocket {
    constructor(host, onsuccess, onerror, protocol = null) {
        this.channels = {};
        this.onerror = onerror;
        this.onsuccess = onsuccess;
        this.closing = false;
        this.reconnectTimeout = 1;
        this.ws = null;
        this.connected = false;
        this.host = host;
        if (protocol == null) {
            protocol = "wss://";
            if (window.location.protocol == "http:") {
                protocol = "ws://";
            }
        }
        this.protocol = protocol;
        this.open();
    }
    open() {
        let pingInterval;
        this.ws = null;
        const ws = new WebSocket(this.protocol + this.host);
        ws.onopen = (evt) => {
            if (!pingInterval) {
                pingInterval = setInterval(() => {
                    if (ws.readyState != ws.OPEN) {
                        clearInterval(pingInterval);
                    }
                    ws.send("");
                }, 10000);
            }
            this.connected = true;
            if (this.onsuccess) {
                this.onsuccess(evt);
            }
        };
        ws.onclose = () => {
            this.connected = false;
            if (pingInterval) {
                clearInterval(pingInterval);
            }
            if (this.closing) {
                return;
            }
            this.closing = false;
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
        this.ws = ws;
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
    }) {
        _qsocket.set(this, void 0);
        _onsuccess.set(this, void 0);
        _onerror.set(this, void 0);
        _Local.set(this, void 0);
        __classPrivateFieldSet(this, _qsocket, null);
        __classPrivateFieldSet(this, _onsuccess, onsuccess);
        __classPrivateFieldSet(this, _onerror, onerror);
        __classPrivateFieldSet(this, _Local, {});
    }
    init() {
        return new QSocket(window.location.host + "/api/ws", __classPrivateFieldGet(this, _onsuccess), __classPrivateFieldGet(this, _onerror));
    }
    subscribe(channel, event, callback) {
        if (!__classPrivateFieldGet(this, _qsocket)) {
            __classPrivateFieldSet(this, _qsocket, this.init());
        }
        __classPrivateFieldGet(this, _qsocket).subscribe(channel, event, (e) => {
            callback(e);
        });
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
_qsocket = new WeakMap(), _onsuccess = new WeakMap(), _onerror = new WeakMap(), _Local = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLE1BQU0sT0FBTztJQVVYLFlBQ0UsSUFBWSxFQUNaLFNBQWdDLEVBQ2hDLE9BQThCLEVBQzlCLFdBQTBCLElBQUk7UUFFOUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDckIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztRQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksUUFBUSxJQUFJLElBQUksRUFBRTtZQUNwQixRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ3BCLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLElBQUksT0FBTyxFQUFFO2dCQUN2QyxRQUFRLEdBQUcsT0FBTyxDQUFDO2FBQ3BCO1NBQ0Y7UUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBQ0QsSUFBSTtRQUNGLElBQUksWUFBZ0MsQ0FBQztRQUNyQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztRQUNmLE1BQU0sRUFBRSxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BELEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNsQixJ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