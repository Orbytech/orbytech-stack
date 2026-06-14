export interface StreamConfig {
  sender: string;
  recipient: string;
  totalAmount: string;
  durationSeconds: number;
  asset?: string;
}

export interface Stream {
  id: string;
  sender: string;
  recipient: string;
  totalAmount: string;
  durationSeconds: number;
  asset: string;
  status: 'active' | 'cancelled' | 'completed';
  startedAt: Date;
  endsAt: Date;
  withdrawn: string;
}

export class StreamingManager {
  private streams = new Map<string, Stream>();

  createStream(config: StreamConfig): Stream {
    const id = crypto.randomUUID();
    const now = new Date();
    const stream: Stream = {
      id,
      sender: config.sender,
      recipient: config.recipient,
      totalAmount: config.totalAmount,
      durationSeconds: config.durationSeconds,
      asset: config.asset ?? 'XLM',
      status: 'active',
      startedAt: now,
      endsAt: new Date(now.getTime() + config.durationSeconds * 1000),
      withdrawn: '0',
    };
    this.streams.set(id, stream);
    return stream;
  }

  /** Returns how much has vested so far based on elapsed time */
  vestedAmount(streamId: string): string {
    const stream = this.streams.get(streamId);
    if (!stream || stream.status !== 'active') return '0';
    const elapsed = (Date.now() - stream.startedAt.getTime()) / 1000;
    const ratio = Math.min(elapsed / stream.durationSeconds, 1);
    const vested = parseFloat(stream.totalAmount) * ratio;
    return vested.toFixed(7);
  }

  cancelStream(streamId: string): Stream {
    const stream = this.streams.get(streamId);
    if (!stream) throw new Error(`Stream ${streamId} not found`);
    if (stream.status !== 'active') throw new Error(`Stream is not active`);
    stream.status = 'cancelled';
    return stream;
  }

  getStream(streamId: string): Stream | undefined {
    return this.streams.get(streamId);
  }

  listStreams(): Stream[] {
    return Array.from(this.streams.values());
  }
}

export const streamingManager = new StreamingManager();

export const createStream = (config: StreamConfig) => streamingManager.createStream(config);
export const cancelStream = (streamId: string) => streamingManager.cancelStream(streamId);
export const getVestedAmount = (streamId: string) => streamingManager.vestedAmount(streamId);
