# Security

## Reporting a vulnerability

Please use [GitHub private vulnerability reporting](../../security/advisories/new) rather than a
public issue.

## Threat model

| Asset                | Where it lives                | Protection                                   |
| -------------------- | ----------------------------- | -------------------------------------------- |
| Study data           | Private GitHub repository     | Repository privacy                           |
| Data token (browser) | Local storage on your devices | Limited to one repository; strict CSP        |
| Service tokens       | GitHub Actions secrets        | Never sent to the browser or written to logs |
| ntfy topic           | GitHub Actions secret         | Long random name that acts as a password     |

Measures in place:

- Content Security Policy that allows only same-origin scripts and known API hosts.
- No third-party scripts or fonts at runtime.
- Stored links are restricted to `http` and `https`.
- Assistant replies, backups and API responses are validated before use.
- React escapes rendered content, and the app does not use raw HTML injection.
- Workflows run with read-only permissions, and scheduled logs contain outcomes only.

## Known limitations

- The browser token is readable by any script on the page, so the CSP is an important control.
- ntfy message content passes through the ntfy server. It includes review counts and the next
  milestone, but no diary text.
- CSP delivered by a meta tag cannot set `frame-ancestors`, because GitHub Pages does not allow
  custom headers.
