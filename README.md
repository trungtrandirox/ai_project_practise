# QA AI Assistant — Manual to Automation

> **Dành cho ai?** Manual QA tester muốn dùng AI để làm việc nhanh hơn — không cần biết code.

> **Dùng tool nào?** Tool này chạy với **Claude Code** (CLI) — không phải Claude Chat hay Claude Cowork.
> - **Claude Chat** → hỏi, brainstorm, draft nhanh (chat.claude.ai)
> - **Claude Code** ← tool này dùng cái này (`claude` CLI trong terminal)
> - **Claude Cowork** → delegate task phức tạp qua nhiều file/app (desktop app)

**Bạn có thể làm gì với tool này:**
- Paste requirement/Jira ticket → nhận test cases ngay lập tức
- Paste manual test steps → nhận Playwright automation script
- Mô tả bug → nhận bug report chuyên nghiệp
- Paste test cases → nhận đánh giá coverage còn thiếu gì

**Powered by:** Claude AI (Anthropic) + Claude Code Skills

---

## Bắt đầu trong 5 phút

### Bước 1 — Cài đặt

Cần có sẵn:
- [Node.js 18+](https://nodejs.org/) — download và cài như bình thường
- API key của Claude → đăng ký tại [console.anthropic.com](https://console.anthropic.com)

```bash
# Clone project về máy
git clone https://github.com/trungtrandirox/ai_project_practise.git
cd manual-test-to-playwright-generator

# Cài dependencies
npm install

# Tạo file .env chứa API key
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
```

### Bước 2 — Dùng với Claude Code (khuyên dùng)

Cài Claude Code:
```bash
npm install -g @anthropic-ai/claude-code
```

Mở project trong terminal:
```bash
cd manual-test-to-playwright-generator
claude
```

### Bước 3 — Nói chuyện với AI

Chỉ cần gõ yêu cầu bằng tiếng Anh hoặc tiếng Việt:

| Bạn muốn làm gì | Ví dụ câu gõ |
|-----------------|-------------|
| Tạo test cases | `"Generate test cases for: User can login with email and password"` |
| Convert sang Playwright | `"Convert to Playwright: 1. Go to /login 2. Enter email 3. Click Login 4. Verify dashboard"` |
| Phân tích bug | `"Analyze this bug: Checkout button disappears on mobile"` |
| Viết bug report | `"Write a bug report: Search returns no results with accented characters"` |
| Kiểm tra coverage | `"Review these test cases, what am I missing?"` |

---

## Các tính năng (Skills)

7 AI skills được tự động kích hoạt theo từ khóa — bạn không cần nhớ lệnh phức tạp:

| Skill | Khi nào dùng | Output |
|-------|-------------|--------|
| `test-case-generator` | Có requirement/user story mới | Test cases đầy đủ (Happy Path, Edge Cases, Error, Security) với label Smoke/Regression |
| `manual-to-playwright` | Có manual test steps cần automate | Playwright TypeScript script chạy được |
| `api-test-generator` | Cần test API endpoint | Playwright API test với assertions |
| `mobile-test-generator` | Test trên mobile (iOS/Android) | Playwright mobile emulation hoặc Appium pseudocode |
| `bug-analyzer` | Tìm được bug, cần phân tích | Root causes + Severity + Regression areas |
| `bug-report-writer` | Cần log bug chuyên nghiệp | Bug report đúng format với Steps/Expected/Actual |
| `test-coverage-reviewer` | Muốn check còn thiếu test gì | Điểm coverage + danh sách test cases còn thiếu |

---

## Cấu trúc project

```
manual-test-to-playwright-generator/
├── CLAUDE.md                    # Quy tắc AI áp dụng cho mọi cuộc trò chuyện
├── AI-POLICY.md                 # Chính sách sử dụng AI có trách nhiệm
├── src/
│   ├── main.ts                  # Entry point
│   ├── mcp-server.ts            # MCP Server — kết nối Claude với external tools
│   ├── agents/
│   │   └── playwright.agent.ts  # Gọi Claude API để generate Playwright tests
│   ├── prompts/
│   │   └── playwright.prompt.ts # Prompt template
│   └── services/
│       └── mcp-client.ts        # MCP Client
├── claude/
│   └── skills/                  # 7 AI skills (tự động kích hoạt theo từ khóa)
└── .claude/
    ├── commands/                # Custom commands (/testcases, /playwright, ...)
    ├── agents/                  # Subagents (test-reviewer)
    └── settings.json            # Hooks bảo vệ source code
```

---

## QA Standards

Tất cả output AI tạo ra đều theo chuẩn:

| Chuẩn | Format |
|-------|--------|
| Test case ID | `TC-001`, `TC-002`... |
| Bug severity | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low |
| Test type | 🚀 Smoke / 🔁 Regression |
| Playwright locator | `getByRole` → `getByLabel` → `getByText` → `getByTestId` |
| Language | TypeScript only |

---

## Ví dụ thực tế

**Input — Requirement:**
```
User can reset password via email OTP
```

**Output — Test cases được tạo tự động:**
```
TC-001 — Reset password with valid email | 🚀 Smoke
TC-002 — Reset password with unregistered email | 🔁 Regression
TC-003 — OTP expires after 5 minutes | 🔁 Regression
TC-004 — OTP used twice | 🔁 Regression
...
```

---

**Input — Manual steps:**
```
1. Go to /login
2. Enter email: user@test.com
3. Enter password: Test@1234
4. Click Login button
5. Verify user is on dashboard
```

**Output — Playwright script:**
```typescript
test('user can login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('Test@1234');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL('/dashboard');
});
```

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

## Maintainer & Distribution

**Owner:** Trung Tran (QA Engineer) — reviews all skill changes, runs evals before every publish, decides when to retire a skill.

**To use this toolkit on your team:**
1. Clone the repo
2. Run `claude` in the project folder
3. Type `/setup` — Claude will interview you and recommend the right skills for your role

**Before shipping any skill update:**
- Run `/eval [skill-name]` and confirm all 3 test prompts pass
- If adding a new skill, give it a specific name (e.g. `api-auth-test-generator`, not `api-tests`)
- Update this README if the skill list changes

**Quarterly review checklist:**
- [ ] Are all 7 skills still relevant to the team's workflow?
- [ ] Run `/eval` on each skill — do outputs still meet the quality bar?
- [ ] Any skill nobody uses in the last quarter? → retire it
- [ ] Any new recurring task that deserves its own skill?
- [ ] Is `references/good-output-example.ts` still representative of good output?

---

## Author

Built by a QA Manual engineer learning AI-assisted automation.
Part of the [Anthropic Academy](https://anthropic.skilljar.com) learning path.
