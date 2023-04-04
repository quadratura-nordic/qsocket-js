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
export default class Notification {
    constructor(onsuccess = () => {
        return;
    }, onerror = () => {
        return;
    }, path = "") {
        this.#qsocket = null;
        this.#onsuccess = onsuccess;
        this.#onerror = onerror;
        this.#Local = {};
        this.#path = path || (window.location.host + '/api/ws');
    }
    #qsocket;
    #onsuccess;
    #onerror;
    #Local;
    #path;
    init() {
        return new QSocket(this.#path, this.#onsuccess, this.#onerror);
    }
    subscribe(channel, event, callback) {
        if (!this.#qsocket) {
            this.#qsocket = this.init();
        }
        // this.#qsocket.reconnectTimeout = 1; // we just resubscribed, we cleary want socket to be open
        this.#qsocket.subscribe(channel, event, (e) => {
            callback(e);
        });
        if (this.#qsocket.closing) {
            this.#qsocket.open();
        }
        if (!this.#Local[channel]) {
            this.#Local[channel] = {};
        }
        this.#Local[channel][event] = callback;
    }
    message(channel, event, content) {
        if (!this.#qsocket) {
            this.#qsocket = this.init();
        }
        this.#qsocket.send({ channel, event, content });
    }
    unsubscribe(channel) {
        if (this.#qsocket) {
            this.#qsocket.unsubscribe(channel);
        }
    }
    notify(channel, event, e = null) {
        if (this.#Local[channel] && this.#Local[channel][event]) {
            this.#Local[channel][event](e);
        }
    }
    close() {
        if (this.#qsocket) {
            this.#qsocket.close();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsTUFBTSxPQUFPO0lBU1gsWUFDRSxJQUFZLEVBQ1osU0FBZ0MsRUFDaEMsT0FBOEI7UUFSaEMsYUFBUSxHQUFXLFFBQVEsQ0FBQztRQUM1QixhQUFRLEdBQVksRUFBRSxDQUFDO1FBQ3ZCLFlBQU8sR0FBWSxLQUFLLENBQUM7UUFDekIsT0FBRSxHQUFxQixJQUFJLENBQUM7UUFDNUIscUJBQWdCLEdBQVcsQ0FBQyxDQUFDO1FBTTNCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBRTNCLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLElBQUksT0FBTyxFQUFFO1lBQ3ZDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1NBQ3pCO1FBQ0QsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQUNELElBQUk7UUFDRixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNyQixJQUFJLFlBQWdDLENBQUM7UUFDckMsTUFBTSxFQUFFLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDbEIsSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDakIsWUFBWSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUU7b0JBQzlCLElBQUksRUFBRSxDQUFDLFVBQVUsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFO3dCQUM1QixhQUFhLENBQUMsWUFBWSxDQUFD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