# The Practical Modernization of Configuration Manager

**Published:** November 14, 2025 • **Read Time:** 8 min

## Introduction

Configuration Manager is still a supported and viable product—not technically considered legacy by Microsoft. Yet, many technical folks I speak with dismiss it as "old" or "not modern." That perception got me thinking: **Without modifying core code, could there be a way to practically modernize Configuration Manager?**

While Microsoft doesn't officially label Configuration Manager as legacy, they are [moving to fewer updates per year and not implementing newer improvements](https://techcommunity.microsoft.com/blog/configurationmanagerblog/announcing-the-annual-release-cadence-for-microsoft-configuration-manager/4464794), signaling a shift in their investment priorities.

Before we get into the "just move to Intune" conversation, let's establish something important: **for servers in large enterprises, Configuration Manager is still the way to go** for patching, compliance baselines, and application deployments—if you already have it. While Microsoft pushes Azure Arc and Azure Update Manager as the modern alternative, the reality is more nuanced. Azure Arc is fundamentally just an Azure agent for resources not running in Azure, and Microsoft still doesn't have a true one-size-fits-all server management solution (though I anticipate this will evolve over time). Full disclosure: while I've investigated alternatives in this space, I'm far from an expert on every creative solution available. What I can say with confidence is that for many organizations today, Configuration Manager remains the most practical choice for comprehensive server management.  

---

## The Modernization Gap

Configuration Manager was built in an era before cloud-first architecture, containerization, and infrastructure-as-code became the industry standard. While it remains actively developed and supported, several gaps make it feel "old" compared to modern tooling:

- **CI/CD (Continuous Integration/Continuous Deployment)** - Modern software development practices emphasize automated pipelines where code changes are continuously integrated, tested, and deployed. Configuration Manager's management processes—creating packages, distributing content, updating task sequences—are still largely manual or require custom scripting. There's no native CI/CD pipeline for Configuration Manager configurations themselves.

- **Containerization** - Modern applications increasingly run in containers (Docker, Kubernetes) for portability and consistency across environments. Configuration Manager was designed for traditional server and desktop operating systems, not containerized workloads. While you can manage container hosts, managing the containers themselves requires different tooling.

- **Python vs. PowerShell** - The automation ecosystem has shifted. While PowerShell remains powerful for Windows administration, Python has become the lingua franca of modern DevOps and automation. Configuration Manager's SDK and automation tooling are heavily PowerShell-centric with limited Python support, creating a barrier for teams standardizing on cross-platform automation languages.

- **User Interface** - The Configuration Manager console hasn't fundamentally changed in years. While functional, it lacks the polish and user experience of modern cloud-native management portals. It can feel clunky compared to Intune's web-based interface or Azure's sleek management experience.

- **On-Premises Infrastructure** - Modern IT emphasizes cloud-first, reducing on-premises infrastructure footprint. Configuration Manager requires significant infrastructure: SQL servers, site servers, distribution points, and management points. While you can run Configuration Manager entirely in the cloud using IaaS (Infrastructure-as-a-Service) VMs in Azure—which I've successfully implemented—it's still virtual machines, not cloud-native PaaS (Platform-as-a-Service). Even with Cloud Management Gateway (CMG), the core architecture remains rooted in traditional server thinking rather than modern serverless or container-based cloud services.

---

## What Does "Modernization" Actually Mean?

"Modern" has become one of those overused buzzwords that means everything and nothing at the same time. Ask five different engineers what "modernization" means and you'll get five different answers—often delivered with immediate distaste if you're not using their preferred "right" tools.

Here's the uncomfortable truth: **once something is implemented, it's usually not far from being "not modern" anymore.** Technology moves fast. What's cutting-edge today becomes legacy tomorrow. The tools and practices considered modern in 2025 will likely be viewed as outdated by 2030.

So if "modern" is a moving target that's impossible to catch, what does modernization actually mean in a practical sense?

I'd argue it's not about chasing the latest trends or forcing every workload into containers because "that's what modern companies do." Instead, practical modernization should focus on:

- **Reducing Operational Toil** - Can you automate repetitive tasks? Can you eliminate manual processes that waste time and introduce human error?

- **Improving Visibility** - Can you get better insights into what's happening in your environment? Can you make data-driven decisions instead of guessing?

- **Increasing Agility** - Can you respond to changes faster? Can you deploy patches, applications, or configurations more quickly when business needs demand it?

- **Enabling Self-Service** - Can you empower end users and other teams to solve their own problems without opening tickets to you?

- **Integration Over Replacement** - Can you connect your existing tools to modern workflows rather than ripping everything out and starting over?

Notice what's missing from that list? Specific technologies. Cloud vs. on-prem. Kubernetes vs. VMs. Python vs. PowerShell. Those are implementation details, not outcomes.

**Modernization isn't about the tools you use—it's about what you accomplish with them.** Configuration Manager can absolutely be part of a modern IT operation if you're using it to achieve modern outcomes. The question isn't whether the tool itself is modern; it's whether your approach to using it is.

## Practical Modernization Strategies

### 1. Reporting Modernization: Unlock the Data Goldmine

One of the biggest untapped areas for modernizing Configuration Manager is connecting **Power BI to your Configuration Manager database**. 

Here's something many people miss: **Configuration Manager's greatest strength isn't just what it does—it's the amount of data it collects.** Even if you're not using it for patching or compliance baselines, it's continuously gathering inventory information, application usage data, hardware configurations, software installations, and user associations across your entire environment.

Think of the Configuration Manager console as the surface web—it shows you what Microsoft designed you to see through predefined reports and views. But the **SQL database underneath is like the dark web: a massive area of untapped, cross-referenced data** waiting to be explored.

Power BI can transform this raw data into actionable insights:

- **Custom dashboards** that answer your organization's specific questions, not just Microsoft's generic reports
- **Cross-collection analysis** that reveals patterns invisible in the console
- **Real-time data visualization** that updates automatically as new inventory comes in
- **Executive-friendly reporting** that translates technical data into business value
- **Self-service analytics** where stakeholders can explore data without opening a ticket

The Configuration Manager console was built for ConfigMgr admins. Power BI lets you build reporting for everyone else—security teams, procurement, leadership, application owners—giving each audience exactly the view of the data they need.

By modernizing how you surface Configuration Manager data, you transform it from an endpoint management tool into an enterprise intelligence platform.

**Want to see this in action?** Check out my [Custom Application Dashboard](/portfolio.html#powerbi) example in my portfolio, which connects directly to ConfigMgr database tables to provide real-time visibility into application inventory across devices with interactive filtering capabilities.

### 2. Integrate with Modern DevOps Tools

If pure modernization—replacing Configuration Manager entirely—isn't practical for your environment, consider a **hybrid approach: running modern technologies alongside Configuration Manager** rather than trying to force Configuration Manager itself to be something it's not.

- **Python Integration** - While Configuration Manager's SDK is PowerShell-based, nothing stops you from using Python to interact with the ConfigMgr database, automate reporting, or orchestrate workflows. Python can query the SQL database, process inventory data, trigger actions via REST APIs, and integrate CM data with other modern platforms.

- **Apache Kafka for Event Streaming** - Configuration Manager generates a constant stream of events: clients checking in, policies deploying, updates installing, inventory refreshing. By publishing these events to Kafka, you can build real-time monitoring dashboards, trigger automated responses, feed data lakes, or integrate with SIEM platforms—all without modifying Configuration Manager itself.

- **Ansible for Orchestration** - Use Ansible to orchestrate workflows that span Configuration Manager and other systems. Ansible can trigger ConfigMgr deployments via PowerShell, coordinate patching windows across CM and non-CM systems, or automate the provisioning of ConfigMgr infrastructure itself.

**The Key Insight: Configuration Manager doesn't have to be your only tool.** Instead of viewing it as an all-or-nothing proposition, treat it as one component in a modern, heterogeneous automation ecosystem. Let ConfigMgr do what it does best (Windows endpoint management), while modern tools handle orchestration, data processing, and cross-platform integration.

This hybrid approach gives you the modernization benefits your organization is looking for—Python, event streaming, infrastructure-as-code—while preserving the stability and proven capabilities of Configuration Manager.

### 3. Cloud Management Gateway (CMG)

One of Configuration Manager's most significant modernization features is the **Cloud Management Gateway (CMG)**—a service that fundamentally changes how you think about client connectivity.

Traditionally, Configuration Manager required devices to be on the corporate network or connected via VPN to communicate with management points and distribution points. This created friction for remote workers, traveling employees, and increasingly distributed workforces.

**CMG solves this by hosting a cloud-based relay in Azure** that sits between internet-connected clients and your on-premises Configuration Manager infrastructure. Clients authenticate to CMG using Azure AD or PKI certificates, then securely communicate with your management points through the encrypted tunnel.

**What This Enables:**

**Always-On Management** - Laptops get patches, policies, and applications whether users are at home, in a coffee shop, or at the office—no VPN required.

**Reduced VPN Load** - Offload thousands of ConfigMgr client connections from your VPN infrastructure, freeing capacity for applications that actually need direct network access.

**Modern Work Support** - Embrace remote and hybrid work models without sacrificing endpoint management and security.

**Global Distribution** - Deploy CMG instances in multiple Azure regions to provide low-latency access for geographically distributed teams.

**Cloud-Native Client Experience** - While your infrastructure remains on-premises, your clients interact with Configuration Manager through cloud services—delivering a modern, internet-first management experience.

**The Bottom Line:** CMG lets you modernize the client experience and connectivity model without re-architecting your entire Configuration Manager infrastructure. It's a practical step toward cloud-enabled management that works with your existing investment.

### 4. Co-Management with Intune

Co-management is Microsoft's bridge strategy between Configuration Manager and Intune—and it's one of the most practical ways to modernize without ripping and replacing your entire infrastructure.

The concept is simple: **enable both Configuration Manager and Intune to manage the same Windows devices simultaneously**, with the ability to shift specific workloads between them. This gives you the flexibility to leverage the strengths of each platform while gradually transitioning at your own pace.

**Why Co-Management Makes Sense:**

**Immediate Cloud Benefits** - You gain cloud-based capabilities like Conditional Access, Windows Autopilot, and remote actions from anywhere—without abandoning your existing ConfigMgr investment.

**Workload Flexibility** - You can choose which management responsibilities stay with ConfigMgr (like application deployment and OS imaging where it excels) and which move to Intune (like compliance policies and device configuration for mobile scenarios).

**Gradual Migration Path** - Instead of a risky "big bang" migration, you can shift workloads incrementally. Start with compliance policies, test thoroughly, then move resource access policies, then Windows Update management—all without disrupting operations.

**Real-World Hybrid Strategy** - Most enterprises aren't purely cloud or purely on-prem. Co-management acknowledges this reality and lets you operate in both worlds simultaneously.

**User Transparency** - End users don't know or care which system is managing their device. They just need their applications, policies, and updates to work—co-management delivers that seamlessly.

The key insight: **you don't have to choose between Configuration Manager and Intune.** Co-management lets you use the right tool for each specific workload, modernizing your approach while maintaining operational stability.

---

## Conclusion

Let's be realistic: without a crystal ball, Configuration Manager most likely has fewer days ahead of it than behind it. Microsoft's shift to annual releases and reduced feature investment signals where the industry is heading. The cloud-first future is real.

**But that doesn't mean Configuration Manager isn't useful today.** For organizations with existing investments, complex server environments, and infrastructure that won't magically migrate to the cloud overnight, Configuration Manager remains a practical, proven tool.

Configuration Manager doesn't have to feel like a legacy system. By embracing modern automation practices, integrating with cloud services where it makes sense, and focusing on practical improvements rather than wholesale replacement, organizations can modernize their approach to endpoint and server management without throwing away proven infrastructure.

The question isn't "Is Configuration Manager modern?"—it's "How are you using it?"

Modernization isn't about abandoning tools that work. It's about getting the most value from what you have while preparing for what comes next.

*(And let's be honest—by the time you finish reading this article, half of what I've called "modern" is probably already passé. Such is technology.)*