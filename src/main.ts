import "dotenv/config";
import { generatePlaywrightTest } from "./agents/playwright.agent";

async function run() {
  const manualTest = `
1. Open homepage
2. Click login
3. Enter email
4. Enter password
5. Click submit
6. Verify dashboard
`;

  const result = await generatePlaywrightTest(
    manualTest
  );

  console.log(result);
}

run();