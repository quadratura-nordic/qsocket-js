"use strict";
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
        this._qsocket = null;
        this._onsuccess = onsuccess;
        this._onerror = onerror;
        this._Local = {};
        this._path = path || (window.location.host + '/api/ws');
    }
    init() {
        return new QSocket(this._path, this._onsuccess, this._onerror);
    }
    subscribe(channel, event, callback) {
        if (!this._qsocket) {
            this._qsocket = this.init();
        }
        // this._qsocket.reconnectTimeout = 1; // we just resubscribed, we cleary want socket to be open
        this._qsocket.subscribe(channel, event, (e) => {
            callback(e);
        });
        if (this._qsocket.closing) {
            this._qsocket.open();
        }
        if (!this._Local[channel]) {
            this._Local[channel] = {};
        }
        this._Local[channel][event] = callback;
    }
    message(channel, event, content) {
        if (!this._qsocket) {
            this._qsocket = this.init();
        }
        this._qsocket.send({ channel, event, content });
    }
    unsubscribe(channel) {
        if (this._qsocket) {
            this._qsocket.unsubscribe(channel);
        }
    }
    notify(channel, event, e = null) {
        if (this._Local[channel] && this._Local[channel][event]) {
            this._Local[channel][event](e);
        }
    }
    close() {
        if (this._qsocket) {
            this._qsocket.close();
        }
    }
}
exports.default = Notification;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSxNQUFNLE9BQU87SUFTWCxZQUNFLElBQVksRUFDWixTQUFnQyxFQUNoQyxPQUE4QjtRQVJoQyxhQUFRLEdBQVcsUUFBUSxDQUFDO1FBQzVCLGFBQVEsR0FBWSxFQUFFLENBQUM7UUFDdkIsWUFBTyxHQUFZLEtBQUssQ0FBQztRQUN6QixPQUFFLEdBQXFCLElBQUksQ0FBQztRQUM1QixxQkFBZ0IsR0FBVyxDQUFDLENBQUM7UUFNM0IsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFFM0IsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxPQUFPLEVBQUU7WUFDdkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7U0FDekI7UUFDRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBQ0QsSUFBSTtRQUNGLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLElBQUksWUFBZ0MsQ0FBQztRQUNyQyxNQUFNLEVBQUUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNsQixJQUFJLENBQUMsWUFBWSxFQUFFO2dCQUNqQixZQUFZLEdBQUcsV0FBVyxDQUFDLEdBQUcsRUFBRTtvQkFDOUIsSUFBSSxFQUFFLENBQUMsVUFBVSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUU7d0JBQzVCLGFBQWEsQ0FBQyxZQUFZLENB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