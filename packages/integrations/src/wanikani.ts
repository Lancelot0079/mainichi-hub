import type { WanikaniSnapshot } from "@mainichi/core";
import { z } from "zod";
import { HttpError, type Fetch } from "./http";

const BASE_URL = "https://api.wanikani.com/v2";
const API_REVISION = "20170710";

const userSchema = z.object({
  data: z.object({
    username: z.string(),
    level: z.number(),
    subscription: z.object({ max_level_granted: z.number() }),
  }),
});

const bucketSchema = z.object({
  available_at: z.string(),
  subject_ids: z.array(z.number()),
});

const summarySchema = z.object({
  data: z.object({
    lessons: z.array(bucketSchema),
    reviews: z.array(bucketSchema),
    next_reviews_at: z.string().nullable(),
  }),
});

const collectionSchema = z.object({ total_count: z.number() });

const SRS_GROUPS = {
  apprentice: "1,2,3,4",
  guru: "5,6",
  master: "7",
  enlightened: "8",
  burned: "9",
} as const;

export interface WanikaniOptions {
  token: string;
  fetch?: Fetch;
}

export class WanikaniClient {
  private readonly fetch: Fetch;

  constructor(private readonly options: WanikaniOptions) {
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  private async get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const res = await this.fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${this.options.token}`,
        "Wanikani-Revision": API_REVISION,
      },
    });
    if (!res.ok) throw new HttpError("WaniKani", res.status);
    return schema.parse(await res.json());
  }

  private async count(query: string): Promise<number> {
    return (await this.get(`/assignments?${query}`, collectionSchema)).total_count;
  }

  /** `activeSince` is the start of the user's day; started assignments change when reviewed. */
  async snapshot(now: Date, activeSince: Date): Promise<WanikaniSnapshot> {
    const [user, summary, activeToday, srs] = await Promise.all([
      this.get("/user", userSchema),
      this.get("/summary", summarySchema),
      this.count(`started=true&updated_after=${activeSince.toISOString()}`),
      this.srsCounts(),
    ]);
    const available = (buckets: z.infer<typeof bucketSchema>[]) =>
      buckets
        .filter((b) => new Date(b.available_at) <= now)
        .reduce((sum, b) => sum + b.subject_ids.length, 0);
    return {
      username: user.data.username,
      level: user.data.level,
      maxLevelGranted: user.data.subscription.max_level_granted,
      reviewsAvailable: available(summary.data.reviews),
      lessonsAvailable: available(summary.data.lessons),
      nextReviewsAt: summary.data.next_reviews_at,
      activeToday: activeToday > 0,
      srs,
    };
  }

  private async srsCounts(): Promise<WanikaniSnapshot["srs"]> {
    const entries = await Promise.all(
      Object.entries(SRS_GROUPS).map(
        async ([group, stages]) =>
          [group, await this.count(`srs_stages=${stages}&hidden=false`)] as const,
      ),
    );
    return Object.fromEntries(entries) as WanikaniSnapshot["srs"];
  }
}
