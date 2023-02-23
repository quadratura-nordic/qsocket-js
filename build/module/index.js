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
        this.#qsocket.subscribe(channel, event, (e) => {
            callback(e);
        });
        if (!this.#qsocket.connected) {
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
    unsubscrbe(channel) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsTUFBTSxPQUFPO0lBVVgsWUFDRSxJQUFZLEVBQ1osU0FBZ0MsRUFDaEMsT0FBOEIsRUFDOUIsV0FBMEIsSUFBSTtRQUU5QixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNyQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ2YsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFO1lBQ3BCLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDcEIsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxPQUFPLEVBQUU7Z0JBQ3ZDLFFBQVEsR0FBRyxPQUFPLENBQUM7YUFDcEI7U0FDRjtRQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFDRCxJQUFJO1FBQ0YsSUFBSSxZQUFnQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ2YsTUFBTSxFQUFFLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEQsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ2xCLElBQUksQ0FBQyxZQUFZLEVB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