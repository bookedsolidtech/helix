# Manual Steps Required — Agent Protocol

## Purpose

When an agent implements a feature that requires manual configuration of a third-party service, that agent **MUST create a Linear issue assigned to the project owner before the feature can be considered complete**.

Automated quality gates passing does NOT mean the feature is fully deployed if it depends on manual human actions.

---

## What Counts as a "Manual Step"

Any action that cannot be automated by the agent and requires human access to an external dashboard or account:

| Service | Examples |
|---------|----------|
| **Vercel** | Adding environment variables, creating projects, configuring custom domains, adding deploy hooks |
| **GitHub** | Adding repository secrets, enabling GitHub Actions, configuring branch protection rules, adding webhooks |
| **npm** | Creating publish tokens, configuring package access, org settings |
| **Discord** | Creating webhooks, setting up bots, channel permissions |
| **External APIs** | API key creation, service activation, account setup |
| **DNS / CDN** | Domain records, SSL certs, CDN configuration |
| **Database** | Provisioning, credentials, schema migrations that require human approval |

---

## Required Action

When your feature implementation requires any of the above, before submitting your PR or marking the feature done:

1. **Create a Linear issue** with this structure:
   - **Team**: ProtoLabsAI (team ID: `185e7caa-2855-4c67-a347-2011016bdddf`)
   - **Title**: `[Manual Required] <service>: <specific action needed>`
   - **Description**: Include exactly what needs to be done, where (URL/dashboard), and why it's needed for the feature to work end-to-end
   - **Priority**: Match the priority of the feature you just implemented
   - **Assignee**: Project owner — search Linear for `josh` to get the user ID
   - **Label**: `manual-required`
   - **Note**: Reference the PR/feature in the description

2. **Add a comment to your PR** with: `⚠️ Manual setup required — see Linear issue [ISSUE-ID]`

3. **Do NOT block your PR** — merge the code, the Linear issue tracks the remaining work.

---

## Example

```
Title: [Manual Required] Vercel: Add NEXT_PUBLIC_API_URL env var to helix-admin project
Description:
The admin dashboard requires this Vercel environment variable:

- Project: helix-admin
- Variable: NEXT_PUBLIC_API_URL
- Value: The production API endpoint
- Environments: Production, Preview

Related PR: #XX
```

---

## Why This Matters

Josh is off-hands during autonomous operation. Without a tracked Linear issue, manual configuration steps get lost and features appear "done" when they are not functional in production.

**Zero silent failures. Every required human action gets a ticket.**
