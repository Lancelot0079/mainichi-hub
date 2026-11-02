import { alertSlotSchema, DEFAULT_ALERT_HOURS } from "@mainichi/core";
import { z } from "zod";
import type { SlotRequest } from "./run";

const optional = z
  .string()
  .optional()
  .transform((v) => v?.trim() || undefined);

/** An unset GitHub variable arrives as an empty string, which must not parse as midnight. */
const hour = (fallback: number) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().int().min(0).max(23).catch(fallback),
  );

const envSchema = z.object({
  DATA_REPO: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "usa el formato owner/name"),
  DATA_REPO_TOKEN: z.string().min(1),
  WANIKANI_TOKEN: optional,
  NTFY_TOPIC: optional,
  NTFY_SERVER: optional,
  HUB_URL: optional,
  HUB_TIMEZONE: optional.transform((v) => v ?? "America/Bogota"),
  ALERT_MORNING_HOUR: hour(DEFAULT_ALERT_HOURS.morning),
  ALERT_EVENING_HOUR: hour(DEFAULT_ALERT_HOURS.evening),
});

export type Env = z.infer<typeof envSchema>;

export const parseEnv = (env: NodeJS.ProcessEnv): Env => envSchema.parse(env);

export interface CliOptions {
  slot: SlotRequest;
  dryRun: boolean;
}

export function parseArgs(args: string[]): CliOptions {
  const value = args.find((a) => a.startsWith("--slot="))?.split("=")[1] ?? "none";
  const slot = value === "none" ? null : value === "auto" ? "auto" : alertSlotSchema.parse(value);
  return { slot, dryRun: args.includes("--dry-run") };
}
