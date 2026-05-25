# QA AI Assistant — Manual to Automation

A QA AI Assistant built for manual testers transitioning to automation.
Powered by Claude (Anthropic API) and Claude Code Skills.

---

## What This Project Does

This project helps QA Manual engineers by:
- Generating comprehensive test cases from requirements
- Converting manual test steps into Playwright automation code (Web, API, Mobile)
- Analyzing bugs and writing professional bug reports
- Reviewing test coverage gaps

---

## Project Structure

```
.
├── CLAUDE.md                         # Global rules applied to every conversation
├── src/
│   ├── main.ts                       # Entry point — runs the Playwright generator
│   ├── agents/
│   │   └── playwright.agent.ts       # Calls Claude API to generate Playwright tests
│   └── prompts/
│       └── playwright.prompt.ts      # Prompt template for test generation
└── claude/
    └── skills/
        ├── test-case-generator/      # Generate test cases from requirements
        ├── bug-analyzer/             # Analyze bug root causes and severity
        ├── bug-report-writer/        # Write professional bug reports
        ├── test-coverage-reviewer/   # Review gaps in test coverage
        ├── manual-to-playwright/     # Convert manual web tests to Playwright
        ├── api-test-generator/       # Convert API tests to Playwright
        └── mobile-test-generator/   # Convert mobile tests to Playwright / Appium
```

---

## Claude Code Skills

Each skill in `.claude/skills/` is automatically triggered by Claude based on your input.

| Skill | Trigger keywords | Output |
|-------|-----------------|--------|
| `test-case-generator` | "generate test cases", "test this requirement" | Positive / Negative / Edge / Security / UX cases with Smoke & Regression labels |
| `bug-analyzer` | "bug", "not working", "root cause" | Root causes + Severity + Regression areas |
| `bug-report-writer` | "write bug report", "log this bug" | Professional bug report with Steps / Expected / Actual |
| `test-coverage-reviewer` | "review test cases", "what am I missing" | Coverage score + missing test cases by category |
| `manual-to-playwright` | "convert to playwright", "automate this test" | Playwright TypeScript test (Web UI) |
| `api-test-generator` | "API test", "test this endpoint" | Playwright API test with request context |
| `mobile-test-generator` | "mobile test", "iOS test", "swipe" | Playwright mobile emulation or Appium pseudocode |

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| TypeScript | All code — never JavaScript |
| `@anthropic-ai/sdk` | Call Claude API |
| `dotenv` | Manage environment variables |
| Claude Code Skills | AI-assisted QA workflows |

---

## Prerequisites

- Node.js 18+
- An Anthropic API key → [console.anthropic.com](https://console.anthropic.com)

---

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/trungtrandirox/ai_project_practise.git
cd manual-test-to-playwright-generator

# 2. Install dependencies
npm install

# 3. Create environment file
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env

# 4. Run the generator
npx ts-node src/main.ts
```

---

## QA Standards Used in This Project

- Test case IDs: `TC-001`, `TC-002`...
- Bug severity: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
- Test classification: 🚀 Smoke / 🔁 Regression
- Locator priority: `getByRole` → `getByLabel` → `getByText` → `getByTestId`
- Language: TypeScript only, never JavaScript
- CSS class selectors (`.btn-primary`) are never used

---

## Example Usage (Claude Code)

**Generate test cases:**
> "Generate test cases for this requirement: User can reset password via email OTP"

**Convert manual steps to Playwright:**
> "Convert these steps to Playwright: 1. Go to login page 2. Enter email 3. Enter password 4. Click login 5. Verify dashboard"

**Analyze a bug:**
> "Analyze this bug: Checkout button disappears on mobile after adding item to cart"

**Write a bug report:**
> "Write a bug report: Search returns no results when keyword contains accented characters"

---

## 6-Week Learning Schedule

| | Week 1 | Week 2 | Week 3 | Week 4 | Week 5 | Week 6 |
|---|---|---|---|---|---|---|
| **Date** | 18/05 | 25/05 | 01/06 | 08/06 | 15/06 | 22/06 |
| | Introduction to Agent Skills ✅ | Introduction to MCP | AI Fluency for Educators | Teaching AI Fluency | Claude with Google Cloud Vertex AI | Claude with Amazon Bedrock |
| | Building with the Claude API 🔄 | Claude Code in Action | AI Fluency for Students | AI Fluency for Nonprofits | | |
| | | | Model Context Protocol: Advanced Topics | Introduction to Subagents | | |
| | | | AI Fluency: Framework & Foundations | AI Capabilities and Limitations | | |
| | | | Claude Code 101 | Introduction to Claude Cowork | | |

### QA Practice Plan Per Week

| Week | Course Focus | What to Build in This Project |
|------|-------------|-------------------------------|
| **Week 1** | Agent Skills ✅ + Claude API 🔄 | Skills library + Basic API agent |
| **Week 2** | MCP + Claude Code in Action | Connect Claude to read/write test files via MCP |
| **Week 3** | Claude Code 101 + MCP Advanced | Use Claude Code to run and debug Playwright tests |
| **Week 4** | Subagents + AI Capabilities | Build multi-step agent: requirement → test cases → Playwright code |
| **Week 5** | Vertex AI | Deploy QA agent on Google Cloud |
| **Week 6** | Amazon Bedrock | Deploy QA agent on AWS |

---

## Learning Path — Anthropic Academy (QA Perspective)

This project is built alongside the Anthropic Academy courses.
Each section below tracks: what the course teaches → what was practiced in this project.

---

### Course 1 — Introduction to Agent Skills
🔗 https://anthropic.skilljar.com/introduction-to-agent-skills
**Status: ✅ Completed**

| Topic | What I practiced in this project |
|-------|----------------------------------|
| What are Skills? | Understood SKILL.md concept — it's reusable markdown instructions Claude applies automatically |
| Creating your first skill | Created `manual-to-playwright/SKILL.md` from scratch |
| `description` frontmatter | Wrote trigger descriptions for all 7 skills |
| `allowed-tools` configuration | Added `Read`, `Write`, `Grep`, `WebSearch` restrictions per skill |
| Multi-file skills / folder structure | Each skill in its own folder under `.claude/skills/` |
| Skills vs CLAUDE.md | Created `CLAUDE.md` at root for global rules; skills for context-specific tasks |
| Sharing skills | Pushed all skills to GitHub public repo |

**Skills built in this course:**
- `test-case-generator` — generates Positive / Negative / Edge / Security / UX test cases with Smoke & Regression labels
- `bug-analyzer` — root cause analysis, severity, regression areas
- `bug-report-writer` — professional bug report with Steps / Expected / Actual
- `test-coverage-reviewer` — identifies gaps across 8 coverage categories
- `manual-to-playwright` — Web UI manual steps → Playwright TypeScript
- `api-test-generator` — API manual steps → Playwright request tests
- `mobile-test-generator` — Mobile manual steps → Playwright device emulation + Appium note

---

### Course 2 — Building with the Claude API
🔗 https://anthropic.skilljar.com/claude-with-the-anthropic-api
**Status: 🔄 In Progress**

> Note: Course uses Python. All code in this project is translated to TypeScript.

| Section | Topic | Practice Plan | Status |
|---------|-------|--------------|--------|
| 1 | Getting started with Claude | Basic API call — already in `playwright.agent.ts` | ✅ Done |
| 2 | Prompt engineering & evaluation | Improve `playwright.prompt.ts`, test multiple prompt versions | ✅ Done |
| 3 | Tool use with Claude | Add tools: read test file input, write `.spec.ts` output | 🔄 In Progress |
| 4 | Retrieval augmented generation (RAG) | Feed project docs to Claude for context-aware test generation | ⬜ Todo |
| 5 | Model Context Protocol (MCP) | Connect to Jira / TestRail to pull test cases automatically | ⬜ Todo |
| 6 | Claude Code & Computer Use | Use Claude Code for dev workflow, automate UI interactions | ⬜ Todo |
| 7 | Agents and workflows | Turn this project into a multi-step agent: read → analyze → generate → review | ⬜ Todo |

---

### Key QA Concepts Learned So Far

| Concept | Applied In |
|---------|-----------|
| Smoke vs Regression classification | `test-case-generator` skill — every TC is labeled |
| Locator priority (role → label → text → testId) | `manual-to-playwright` + `mobile-test-generator` skills |
| Bug severity levels (Critical / High / Medium / Low) | `bug-analyzer` + `bug-report-writer` skills |
| API test structure (status + body assertion) | `api-test-generator` skill |
| Mobile web vs native app distinction | `mobile-test-generator` skill |
| `allowed-tools` to restrict AI actions per skill | All 7 skills |

---

## AI Diligence Statement

In building this project, I collaborated with **Claude (Anthropic)** to assist with the following tasks: generating test cases from requirements, converting manual test steps into Playwright scripts, analyzing bugs, writing bug reports, and improving skill prompts.

I affirm that:
- All AI-generated test cases and scripts were reviewed by a QA engineer before use
- Playwright selectors were verified by running tests or using Playwright codegen
- Skill files and prompts reflect real QA domain knowledge and team standards
- I take full responsibility for the accuracy and quality of all final outputs

AI was used as a **collaborative tool** to enhance — not replace — the judgment of the QA engineer.

---

## Author

Built by a QA Manual engineer learning AI-assisted automation.
Part of the [Anthropic Academy](https://anthropic.skilljar.com) learning path.
