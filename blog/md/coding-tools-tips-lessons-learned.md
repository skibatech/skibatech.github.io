# Coding Tools: Tips & Lessons Learned from 30 Days of AI-Assisted Development

**Published on January 8, 2025 • 12 min read**

For the last 30 days, I've been coding almost every day on pet projects and ideas I've wanted to try. My entire development process has changed thanks to GitHub Copilot. Instead of learning JavaScript syntax and best practices first, I focus on defining the solution and let Copilot build it alongside me. It's learning in reverse: show me what to do, then teach me how you did it. Below is the streamlined playbook, with real examples from the past month.

## How I Work with Copilot (Solution-First)

1. **Describe outcomes, not tech:** I tell Copilot what I want (e.g., "nightly Intune device export into Azure SQL with a Logic App trigger"), then let it pick the stack.
2. **Iterate fast:** Generate code → run it → adjust. If it loops, I say "get off the highway and try something else" and it pivots.
3. **Secure after it works:** Ask "make this more secure" once it functions; add secrets to config files, not code.
4. **Understand afterward:** "Explain how you did this like I'm 8" to cement the learning.

**Guardrails (rolled into the flow):** small commits by version, never commit secrets, pull before push, verify Copilot's one-liners before running.

## VS Code Setup (kept lean)

- **GitHub Copilot Chat:** Daily debugging, code explanations, prompt iteration.
- **PowerShell:** For the PowerShell-heavy plumbing around Azure Functions/Logic Apps.
- **Markdown Editor + HTML Preview:** WYSIWYG blogging; keep markdown the source of truth.
- **Microsoft Edge Tools:** In-editor DevTools for site tweaks.
- **vscode-pdf:** Quick reference to docs without leaving VS Code.

## Git: One-Liner, Versioned, Auditable

- **One-line commit/push:** `git add .; git commit -m "v2.2.7: Describe change"; git push` (Copilot proposes; I click **Allow?** once).
- **Version in code + commit:** Bump `APP_VERSION`, start the commit with the version so I can say "works in v2.2.6, broke in v2.2.7."
- **Changelog touch:** Copilot appends a bullet under the new version; optional notes go to `DEVELOPMENT.md`.
- **Example prompt:** "Stage/commit/push in one line, bump APP_VERSION to v2.2.7, update CHANGELOG with the Options modal tab split." Copilot returns a single command; I scan and run.

## Copilot Chat Prompts (with outcomes)

- **"Build me a solution that does X"** → Copilot produced the Intune → Azure SQL → Power BI pipeline scaffolding (Functions + Logic App schedule).
- **"This isn't working, try a different approach"** → Swapped from direct SQL writes to queue + batch insert when throttling hit.
- **"Make this more secure"** → Moved connection strings to `local.settings.json` and key vault; added parameterized queries.
- **"Explain what this code does"** → Used after the Planner Pro overlay Options modal refactor to validate tab wiring.
- **"Is there a cheaper way?"** → Replaced an always-on Function with a Logic App timer + consumption plan to cut cost.
- **When Copilot shows "Summarizing conversation history"** → Let it finish, then restate anchor details (one-line git, version in code+commit, secure configs) to keep it on track.

## Licensing and Models (what I’m using)

- **Started Free → Pro → Pro+:** Upgraded as I needed more throughput and premium requests.

| Plan | Pricing | Premium requests included | Buy extra premium requests |
| --- | --- | --- | --- |
| Copilot Free | $0 | 50 per month | No |
| Copilot Pro | $10/month or $100/year (free for some users) | 300 per month | Yes at $0.04/request |
| Copilot Pro+ | $39/month or $390/year | 1500 per month | Yes at $0.04/request |
| Copilot Business | $19 per granted seat per month | 300 per user per month | Yes at $0.04/request |
| Copilot Enterprise | $39 per granted seat per month | 1000 per user per month | Yes at $0.04/request |

- **Auto model (10% discount):** Let Copilot pick models to save ~10% on requests.
- **Step up only when stuck:** Switch to a higher model briefly if the default spins; expect more request churn.

## Real Examples from the Last 30 Days

- **Intune → Azure SQL → Power BI pipeline:** Prompted Copilot to scaffold an Azure Function to pull Intune devices, a Logic App to schedule/rerun failed batches, and parameterized inserts into Azure SQL. Power BI now reads that table for daily dashboards.
- **Planner Pro overlay:** Built from scratch with Copilot into a Planner-native overlay (no separate SQL store) that adds richer list views, dashboards/graphs, themes, and a weekly compass while saving directly to Microsoft Planner tasks.
- **Site/blog workflow:** Markdown-first edits; Copilot generated the matching HTML page and I linked it on `blog.html`. One-line git command shipped it.
- **Troubleshooting:** Pasted stack traces from the Function runtime; Copilot suggested retry policies and connection pooling tweaks that removed transient failures.

## Key Lessons (condensed)

- You can learn syntax after shipping; start with the problem.
- Copilot makes stack decisions—test and override when needed.
- Working code first, security and polish second.
- Human oversight is non-negotiable; you own validation and cost control.
- Iteration beats perfection; keep commits small and versioned.

## Conclusion

These tools - VS Code, Git, GitHub, and GitHub Copilot - have transformed how I build software. They're not just utilities; they're force multipliers that free me to focus on solving problems rather than fighting with tooling. The best investment you can make as a developer is learning to use your tools effectively.

The landscape of development tools continues to evolve. What remains constant is the principle: master the fundamentals, stay curious about new tools, and never stop learning. Your toolset should empower you, not constrain you.

---

What tools have transformed your development workflow? Have a tip I missed? Reach out at [maskiba@skibatech.com](mailto:maskiba@skibatech.com) - I'd love to hear what's working for you.
