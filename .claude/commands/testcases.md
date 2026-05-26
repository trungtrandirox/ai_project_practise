Generate comprehensive test cases for the following requirement or user story: $ARGUMENTS

## Process — Analyze before generating
Before writing any test case:
1. Identify input type: Jira ticket / requirement text / existing manual test case — adjust analysis accordingly
2. Identify the main user goal in this requirement
3. List all possible user actions and system states
4. Identify boundary conditions and edge cases
5. For each scenario, suggest smoke or regression based on criticality — final decision is made by the human
6. Note any ambiguous or missing information

Then generate test cases covering all identified scenarios.

## Performance — How to behave
- If the requirement is ambiguous, ask ONE clarifying question before proceeding — do not assume
- If a precondition is unclear, flag it with ⚠️ instead of guessing
- Generate 🚀 Smoke tests first, then 🔁 Regression tests
- Stop and ask if you are unsure whether a scenario is in scope

## Product — Output rules
- Number each test case as TC-001, TC-002...
- Group test cases by category (Happy Path, Edge Cases, Error Handling, Security)
- Classify each as 🚀 Smoke or 🔁 Regression
- Use plain language — no code, just steps
- Each test case must include: Steps + Expected Result
- Use severity for bug risk notes: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

Output format for each test case:
**TC-001 — [Test Name]** | 🚀 Smoke / 🔁 Regression
- **Precondition:** ...
- **Steps:**
  1. ...
  2. ...
- **Expected Result:** ...
