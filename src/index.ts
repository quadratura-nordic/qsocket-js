type MessageCallback = (args: any) => void;
type Channel = Record<string, Record<string, MessageCallback>>;
class QSocket {
  host: string;
  onsuccess: (args: Event) => void;
  onerror: (args: Event) => void;
  protocol: string = "wss://";
  channels: Channel = {};
  closing: boolean = false;
  ws: WebSocket | null = null;
  reconnectTimeout: number = 1;
  constructor(
    host: string,
    onsuccess: (args: Event) => void,
    onerror: (args: Event) => void,
  ) {
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
    let pingInterval: number | undefined;
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
    ws.onclose = (e: CloseEvent) => {
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
      if (
        response &&
        response.channel &&
        response.event &&
        this.channels[response.channel] &&
        this.channels[response.channel][response.event]
      ) {
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
  subscribe<T>(channel: string, event: string, callback: (args: T) => void) {
    if (!this.channels[channel]) {
      this.channels[channel] = {};
    }
    this.channels[channel][event] = callback;
  }
  unsubscribe(channel: string) {
    this.channels[channel] = {};
  }
  send(data: { [key: string]: string }) {
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
  #qsocket: QSocket | null;
  #onsuccess: (args: Event) => void;
  #onerror: (args: Event) => void;
  #Local: Channel;
  #path: string;
  constructor(
    onsuccess = () => {
      return;
    },
    onerror = () => {
      return;
    },
    path: string = ""
  ) {
    this.#qsocket = null;
    this.#onsuccess = onsuccess;
    this.#onerror = onerror;
    this.#Local = {};
    this.#path = path || (window.location.host + '/api/ws');
  }

  private init() {
    return new QSocket(
      this.#path,
      this.#onsuccess,
      this.#onerror
    );
  }

  subscribe<T>(channel: string, event: string, callback: (args: T) => void) {
    if (!this.#qsocket) {
      this.#qsocket = this.init();
    }
    // this.#qsocket.reconnectTimeout = 1; // we just resubscribed, we cleary want socket to be open
    this.#qsocket.subscribe<T>(channel, event, (e: T) => {
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

  message(channel: string, event: string, content: string) {
    if (!this.#qsocket) {
      this.#qsocket = this.init();
    }
    this.#qsocket.send({ channel, event, content });
  }

  unsubscrbe(channel: string) {
    if (this.#qsocket) {
      this.#qsocket.unsubscribe(channel);
    }
  }

  notify(channel: string, event: string, e = null) {
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
