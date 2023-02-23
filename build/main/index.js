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
        ws.onclose = (e) => {
            console.log("Socket closed", e.code);
            this.connected = false;
            if (e.code == 4401 || e.code == 4403) {
                this.onerror(e);
                return;
            }
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
        __classPrivateFieldGet(this, _qsocket).subscribe(channel, event, (e) => {
            callback(e);
        });
        if (!__classPrivateFieldGet(this, _qsocket).connected) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU0sT0FBTztJQVVYLFlBQ0UsSUFBWSxFQUNaLFNBQWdDLEVBQ2hDLE9BQThCLEVBQzlCLFdBQTBCLElBQUk7UUFFOUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDckIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztRQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksUUFBUSxJQUFJLElBQUksRUFBRTtZQUNwQixRQUFRLEdBQUcsUUFBUSxDQUFDO1lBQ3BCLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLElBQUksT0FBTyxFQUFFO2dCQUN2QyxRQUFRLEdBQUcsT0FBTyxDQUFDO2FBQ3BCO1NBQ0Y7UUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBQ0QsSUFBSTtRQUNGLElBQUksWUFBZ0MsQ0FBQztRQUNyQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztRQUNmLE1BQU0sRUFBRSxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BELEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNsQixJ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