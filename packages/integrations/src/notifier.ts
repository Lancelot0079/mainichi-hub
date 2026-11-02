import type { Alert } from "@mainichi/core";
import { HttpError, type Fetch } from "./http";

/** Port for alert channels. Adding Telegram or email means one more class like `NtfyNotifier`. */
export interface Notifier {
  send(alert: Alert, clickUrl?: string): Promise<void>;
}

export interface NtfyOptions {
  topic: string;
  server?: string;
  fetch?: Fetch;
}

const PRIORITY = { default: 3, high: 4 } as const;

export class NtfyNotifier implements Notifier {
  private readonly fetch: Fetch;

  constructor(private readonly options: NtfyOptions) {
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /** Publishes as JSON because HTTP headers cannot carry the Japanese title. */
  async send(alert: Alert, clickUrl?: string): Promise<void> {
    const server = (this.options.server ?? "https://ntfy.sh").replace(/\/$/, "");
    const res = await this.fetch(server, {
      method: "POST",
      body: JSON.stringify({
        topic: this.options.topic,
        title: alert.title,
        message: alert.body,
        tags: alert.tags,
        priority: PRIORITY[alert.priority],
        ...(clickUrl ? { click: clickUrl } : {}),
      }),
    });
    if (!res.ok) throw new HttpError("ntfy", res.status);
  }
}

/** Prints instead of sending, for dry runs and for setups without a channel. */
export class ConsoleNotifier implements Notifier {
  async send(alert: Alert): Promise<void> {
    console.log(`[alerta] ${alert.title}\n${alert.body}`);
  }
}
