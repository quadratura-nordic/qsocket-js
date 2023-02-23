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
export default class Notification {
    constructor(onsuccess = () => {
        return;
    }, onerror = () => {
        return;
    }) {
        this.#qsocket = null;
        this.#onsuccess = onsuccess;
        this.#onerror = onerror;
        this.#Local = {};
    }
    #qsocket;
    #onsuccess;
    #onerror;
    #Local;
    init() {
        return new QSocket(window.location.host + "/api/ws", this.#onsuccess, this.#onerror);
    }
    subscribe(channel, event, callback) {
        if (!this.#qsocket) {
            this.#qsocket = this.init();
        }
        this.#qsocket.subscribe(channel, event, (e) => {
            callback(e);
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxPQUFPO0lBVVgsWUFDRSxJQUFZLEVBQ1osU0FBZ0MsRUFDaEMsT0FBOEIsRUFDOUIsV0FBMEIsSUFBSTtRQUU5QixJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNyQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1FBQzFCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ2YsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFO1lBQ3BCLFFBQVEsR0FBRyxRQUFRLENBQUM7WUFDcEIsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsSUFBSSxPQUFPLEVBQUU7Z0JBQ3ZDLFFBQVEsR0FBRyxPQUFPLENBQUM7YUFDcEI7U0FDRjtRQUNELElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNkLENBQUM7SUFDRCxJQUFJO1FBQ0YsSUFBSSxZQUFnQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ2YsTUFBTSxFQUFFLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEQsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ2xCLElBQUksQ0FBQyxZQUFZLEVB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