type MessageCallback =  (args: any) => void;
type Channel = Record<string, Record<string, MessageCallback>>;
class QSocket {
  host: string;
  onsuccess: (args: Event) => void;
  onerror: (args: Event) => void;
  protocol: string;
  channels: Channel;
  closing: boolean;
  ws: WebSocket | null;
  connected: boolean;
  reconnectTimeout: number;
  constructor(
    host: string,
    onsuccess: (args: Event) => void,
    onerror: (args: Event) => void,
    protocol: string | null = null
  ) {
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
    let pingInterval: number | undefined;
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
    ws.onclose = (e : CloseEvent) => {
      console.log("Socket closed", e.code);
      this.connected = false;
      if(e.code == 4401 || e.code == 4403){
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
    this.ws = ws;
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
    path:string
  ) {
    this.#qsocket = null;
    this.#onsuccess = onsuccess;
    this.#onerror = onerror;
    this.#Local = {};
    this.#path = path || (window.location.host + '/api/ws');
  }

  private init(){
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
    this.#qsocket.subscribe<T>(channel, event, (e: T) => {
      callback(e);
    });
    if(!this.#qsocket.connected){
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
