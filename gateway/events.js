const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.natsUrl = opts.natsUrl || process.env.NATS_URL || 'nats://localhost:4222';
    this.connected = false;
    this.queue = [];
    this.subjects = new Map();
  }

  async connect() {
    try {
      const { connect } = require('nats');
      this.nc = await connect({ servers: this.natsUrl });
      this.connected = true;
      console.log('[EventBus] Connected to NATS at ' + this.natsUrl);
      for (const { subject, data } of this.queue) {
        this.nc.publish(subject, JSON.stringify(data));
      }
      this.queue = [];
      for (const [subject, handler] of this.subjects) {
        const sub = this.nc.subscribe(subject);
        (async () => {
          for await (const msg of sub) {
            handler(JSON.parse(msg.data.toString()), msg);
          }
        })();
      }
      this.emit('connected');
    } catch (err) {
      console.warn('[EventBus] NATS unavailable (' + err.message + '), using local events');
      this.connected = false;
    }
  }

  publish(subject, data) {
    if (this.connected && this.nc) {
      this.nc.publish(subject, JSON.stringify(data));
    } else {
      this.queue.push({ subject, data });
    }
    this.emit(subject, data);
  }

  subscribe(subject, handler) {
    this.subjects.set(subject, handler);
    this.on(subject, handler);
    if (this.connected && this.nc) {
      const sub = this.nc.subscribe(subject);
      (async () => {
        for await (const msg of sub) {
          handler(JSON.parse(msg.data.toString()), msg);
        }
      })();
    }
  }

  async close() {
    if (this.nc) await this.nc.close();
    this.connected = false;
  }
}

const bus = new EventBus();
module.exports = { EventBus, bus };
