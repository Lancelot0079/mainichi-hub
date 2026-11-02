# Setup

The hub works as soon as it opens, saving to the browser. These steps add sync between devices,
automatic data and alerts. Plan on about 20 minutes.

## 1. Create the private data repository

Create an empty **private** repository, for example `mainichi-data`. Your progress and diary live
here, so it must stay private.

## 2. Create a token for it

In GitHub, go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
and generate a token with:

- **Repository access:** only the data repository.
- **Permissions:** Contents, read and write. Nothing else.
- **Expiration:** the longest you are comfortable with. Add a calendar reminder to rotate it.

## 3. Connect the hub

Open **Ajustes** in the hub, then enter `your-user/mainichi-data` and the token. Repeat on each
device. The token is stored only in that browser.

## 4. Move your old progress

If you used the original single-page version, press **Copiar respaldo** there. Then paste the text
into **Ajustes → Respaldo** and press **Restaurar**. It merges with what you have.

## 5. Get notifications

1. Install the [ntfy](https://ntfy.sh) app on your phone.
2. Subscribe to a long random topic name. Without an account, the topic name works as a password,
   so do not use a guessable one. This generates a good one:

   ```bash
   node -e "console.log('mainichi-' + crypto.randomUUID())"
   ```

## 6. Get your WaniKani token

In WaniKani, open **Settings → API Tokens** and create a token. Read-only access is enough.

## 7. Configure GitHub Actions

In this repository, open **Settings → Secrets and variables → Actions**.

**Secrets**

| Name              | Value                            |
| ----------------- | -------------------------------- |
| `DATA_REPO`       | `your-user/mainichi-data`        |
| `DATA_REPO_TOKEN` | The token from step 2            |
| `WANIKANI_TOKEN`  | The token from step 6 (optional) |
| `NTFY_TOPIC`      | The topic name from step 5       |

**Variables** (all optional)

| Name                 | Default          | Purpose                     |
| -------------------- | ---------------- | --------------------------- |
| `HUB_URL`            | none             | Opens when you tap an alert |
| `HUB_TIMEZONE`       | `America/Bogota` | Defines your day            |
| `ALERT_MORNING_HOUR` | `7`              | Morning plan                |
| `ALERT_EVENING_HOUR` | `20`             | Evening reminder            |

## 8. Publish the page

Open **Settings → Pages** and set **Source** to **GitHub Actions**. Every push to `main` that passes
CI deploys automatically.

## 9. Test it

Open **Actions → Sync and alerts → Run workflow** and choose `morning`. Your phone should get the
plan, and **Ajustes** in the hub should show the update.

## 10. Connect Anki (PC only)

1. In Anki, open **Tools → Add-ons → Get Add-ons** and enter the AnkiConnect code `2055492159`.
2. Open the add-on's **Config** and add your hub's origin to `webCorsOriginList`. For example:
   `https://your-user.github.io`.
3. Restart Anki, then press **Leer de Anki** in **Recursos**.

Anki stats refresh only when you press that button with Anki open. Afterward they sync to your
other devices.

## Maintenance

- GitHub disables scheduled workflows on public repositories after 60 days without activity. If
  that happens, the dashboard shows a warning. Re-enable the workflow from the **Actions** tab or
  run `gh workflow enable sync.yml`.
- When a token expires, the status pill changes to **Sin sincronizar**. Create a new one and update
  it in **Ajustes** and in the Actions secrets.
