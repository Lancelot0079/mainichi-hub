import {
  ConsoleNotifier,
  GitHubFileStore,
  NtfyNotifier,
  WanikaniClient,
  type FileStore,
} from "@mainichi/integrations";
import { parseArgs, parseEnv } from "./config";
import { runSync } from "./run";

const env = parseEnv(process.env);
const options = parseArgs(process.argv.slice(2));

const remote = new GitHubFileStore({ repo: env.DATA_REPO, token: env.DATA_REPO_TOKEN });
const store: FileStore = options.dryRun
  ? { read: (path) => remote.read(path), write: async () => "dry-run" }
  : remote;

const useNtfy = env.NTFY_TOPIC && !options.dryRun;
const notifier = useNtfy
  ? new NtfyNotifier({ topic: env.NTFY_TOPIC!, server: env.NTFY_SERVER })
  : new ConsoleNotifier();

const result = await runSync(
  {
    store,
    notifier,
    wanikani: env.WANIKANI_TOKEN ? new WanikaniClient({ token: env.WANIKANI_TOKEN }) : null,
    timeZone: env.HUB_TIMEZONE,
    hubUrl: env.HUB_URL,
    alertHours: { morning: env.ALERT_MORNING_HOUR, evening: env.ALERT_EVENING_HOUR },
    now: () => new Date(),
  },
  options.slot,
);

// Logs of a public repository are public: report only outcomes, never study data.
console.log(
  `día ${result.today} · alerta: ${result.alert} · errores: ${result.snapshot.errors.length}`,
);
for (const error of result.snapshot.errors) console.warn(`${error.source}: ${error.message}`);
