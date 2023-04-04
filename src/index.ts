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
  _qsocket: QSocket | null;
  _onsuccess: (args: Event) => void;
  _onerror: (args: Event) => void;
  _Local: Channel;
  _path: string;
  constructor(
    onsuccess = () => {
      return;
    },
    onerror = () => {
      return;
    },
    path: string = ""
  ) {
    this._qsocket = null;
    this._onsuccess = onsuccess;
    this._onerror = onerror;
    this._Local = {};
    this._path = path || (window.location.host + '/api/ws');
  }

  private init() {
    return new QSocket(
      this._path,
      this._onsuccess,
      this._onerror
    );
  }

  subscribe<T>(channel: string, event: string, callback: (args: T) => void) {
    if (!this._qsocket) {
      this._qsocket = this.init();
    }
    // this._qsocket.reconnectTimeout = 1; // we just resubscribed, we cleary want socket to be open
    this._qsocket.subscribe<T>(channel, event, (e: T) => {
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

  message(channel: string, event: string, content: string) {
    if (!this._qsocket) {
      this._qsocket = this.init();
    }
    this._qsocket.send({ channel, event, content });
  }

  unsubscribe(channel: string) {
    if (this._qsocket) {
      this._qsocket.unsubscribe(channel);
    }
  }

  notify(channel: string, event: string, e = null) {
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
