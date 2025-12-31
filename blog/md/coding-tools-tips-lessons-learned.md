# Coding Tools: Tips & Lessons Learned from 30 Days of AI-Assisted Development

**Published on January 8, 2025 • 12 min read**

For the last 30 days, I've been coding almost every day on pet projects and ideas I've wanted to try. My entire development process has changed thanks to GitHub Copilot. Instead of learning JavaScript syntax and best practices first, I focus on defining the solution and let Copilot build it alongside me. It's learning in reverse: show me what to do, then teach me how you did it. This article shares what I've learned about this new approach to development and the tools that make it possible.

## Visual Studio Code

### Extensions I Actually Use

VS Code is powerful out of the box, but a few key extensions make my workflow much more efficient:

- **GitHub Copilot Chat:** My AI pair programming partner - helps with debugging, code explanations, and problem-solving (more below)
- **PowerShell:** Essential for writing and debugging PowerShell scripts - syntax highlighting, IntelliSense, and integrated debugging
- **Markdown Editor:** WYSIWYG editor for markdown files - makes editing documentation and blog posts much easier
- **HTML Preview:** Quick preview of HTML files as I edit them
- **Microsoft Edge Tools:** Browser DevTools integration directly in VS Code for web development
- **vscode-pdf:** View PDF documentation without leaving the editor

## Git Version Control

### My Current Git Workflow

I keep Git simple and fast by having Copilot script the full commit/push on one line and by baking versioning into both code and commits. Copilot still prompts with a single **Allow?** before running the combined command, so I get one confirmation instead of three:

- **One-line commit/push:** `git add .; git commit -m "v2.2.7: Describe change"; git push` (Copilot proposes it, I click **Allow?** once)
- **Version in code:** I update an `APP_VERSION` or similar constant before committing so behavior can be tied to a version
- **Version in commit message:** The commit message starts with the version (e.g., `v2.2.7:`) so I can say "it worked in v2.2.6 but not v2.2.7"
- **Update CHANGELOG.md:** Copilot appends a brief bullet under the new version with what changed
- **Optionally update DEVELOPMENT.md:** Notes about in-progress work, decisions, and TODOs for the next session

### What I Ask Copilot to Do

1) **"Stage/commit/push in one line"** – avoid multiple prompts

2) **"Add versioning"** – bump the version constant and include the version in the commit message

3) **"Update CHANGELOG.md (and DEVELOPMENT.md)"** – append a concise entry describing the change and status

### Guardrails I Follow

- Keep commits focused and small - easier to trace regressions by version
- Never commit secrets - use .gitignore and environment/config files instead
- Pull before pushing if others might have changed the branch
- Verify the generated one-liner before running it; adjust the commit message if needed

## GitHub

### Repository Organization

I lean on Copilot to keep code and data separated so the solution stays reusable:

- **Data/config out of code:** For example, I created a folder (e.g., `csv/`) and told Copilot to move related static data into a new CSV there; it was smart enough to move the data and update the code to load it so nothing broke.
- **Reusable packaging:** Keeping config/data in separate files makes it easy to bundle or reuse the core code for other projects
- **Docs:** Keep `README.md` for how to run/use it, `CHANGELOG.md` for version history, and a sensible `.gitignore`
- **Structure:** Organize by purpose (src/, assets/, docs/, data/) and have Copilot refactor imports/loads when moving files

### GitHub Pages

- **Free hosting:** Perfect for static sites, documentation, and portfolios
- **Custom domains:** Use CNAME file to point your own domain
- **Automatic deployment:** Push to main and site updates automatically
- **Jekyll integration:** Built-in support for Jekyll static site generator
- **Limitations:** Static only - no server-side code, but that's fine for many use cases

## GitHub Copilot: The Game Changer

### My Development Workflow (Solution-First Approach)

This is how I actually build things now:

1. **Define the solution:** I describe what I want to build, not how to build it
2. **Let Copilot choose the approach:** I don't tell it to use JavaScript or a specific framework - it picks the tools
3. **Build iteratively:** Copilot generates code, I test it, we iterate
4. **Guide when it gets stuck:** Sometimes Copilot loops on the same approach - I tell it to "get off the highway and try something else"
5. **Make it fit for purpose:** Copilot gives you *a* way to do something, but you adapt it to your needs
6. **Secure it:** Once it works, run a security pass (ask "is this secure?" or "make this more secure")
7. **Learn what you built:** Ask Copilot to explain the code after it's working

This is learning in reverse: build first, understand second.

### Your Role: Absolutely Necessary

Copilot is powerful, but it needs human guidance:

- **Course correction:** When it loops on the same failed approach, you need to redirect it
- **Validation:** You must test and verify everything it generates
- **Context switching:** Sometimes you need to tell it to try a completely different approach
- **Fit for purpose:** Generic solutions need customization for your specific use case
- **Security review:** Always do a security pass after it works

**You're not writing less code - you're writing smarter code with a partner who never gets tired.**

### Copilot Chat: My Co-Pilot, Literally

How I use GitHub Copilot Chat in my daily workflow:

- **"Build me a solution that does X"** - Describe the goal, not the implementation; let Copilot pick the approach
- **"This isn't working, try a different approach"** - When it gets stuck or loops
- **"Make this secure/more secure"** - Security pass after it works
- **"Explain what this code does" / "Why this approach?" / "Explain how you did this like I am an 8 year old"** - Learn after building
- **Paste screenshots of errors and ask "Seeing this error now"**
- **Is this the cheapest way to do this?** - Often the solution will get built and there is a cheaper solution available that will do the same thing.
- **When Copilot pops a "Summarizing conversation history":** Let it run, then restate key details it might drop (combining git commands on one line, use versions in code and with commits, etc). Don't close the chat—re-anchor it with specifics right after

### Licensing and Model Choices

- **Started Free, moved to Pro, then Pro+:** I upgraded as I needed more throughput and features

| Plan | Pricing | Premium requests included | Buy extra premium requests |
| --- | --- | --- | --- |
| Copilot Free | $0 | 50 per month | No |
| Copilot Pro | $10/month or $100/year (free for some users) | 300 per month | Yes at $0.04/request |
| Copilot Pro+ | $39/month or $390/year | 1500 per month | Yes at $0.04/request |
| Copilot Business | $19 per granted seat per month | 300 per user per month | Yes at $0.04/request |
| Copilot Enterprise | $39 per granted seat per month | 1000 per user per month | Yes at $0.04/request |

- **Auto model (10% discount):** Let Copilot choose the model automatically to save about 10% on requests
- **Step up the model when stuck:** If the default is not working, temporarily select a more powerful model, but expect more request churn and cost

### What I've Learned in 30 Days

- **You don't need to learn syntax first:** Focus on the problem, learn the language as you go
- **Copilot makes decisions too:** Don't dictate the tech stack - see what it recommends
- **Working code is the first milestone:** Optimization and understanding come after
- **Human oversight is non-negotiable:** Copilot will confidently go down wrong paths; you own validation and security
- **Ask "why" after "how":** Build it, then understand it
- **Security is a second pass:** Get it working, then make it secure
- **Iteration beats perfection:** Build, test, adjust, repeat
- **Experience helps, but isn't required:** Dev experience speeds up debugging, but it is not mandatory anymore. You can say, "build me an army," like Sauron to Saruman in Lord of the Rings, and a working solution can appear fast. The tradeoff is you must validate and harden it, especially security, because you may not spot subtle risks without experience.

## Use Cases

- **This website:** Built and maintained the entire site with Copilot
- **Blog posts:** Drafted and iterated articles (like this one) end-to-end
- **Azure Functions and Logic Apps:** Built serverless automations to pull Microsoft Intune data on a schedule
- **Azure SQL:** Ingested Intune data into Azure SQL for downstream use
- **Power BI:** Consumed the Azure SQL Intune data in Power BI dashboards
- **Troubleshooting:** Frequent debugging assistance across stacks
- **Planner Pro overlay:** Created a Planner Pro tool as an overlay for Microsoft Planner

## Conclusion

These tools - VS Code, Git, GitHub, and GitHub Copilot - have transformed how I build software. They're not just utilities; they're force multipliers that free me to focus on solving problems rather than fighting with tooling. The best investment you can make as a developer is learning to use your tools effectively.

The landscape of development tools continues to evolve. What remains constant is the principle: master the fundamentals, stay curious about new tools, and never stop learning. Your toolset should empower you, not constrain you.

---

What tools have transformed your development workflow? Have a tip I missed? Reach out at [maskiba@skibatech.com](mailto:maskiba@skibatech.com) - I'd love to hear what's working for you.
