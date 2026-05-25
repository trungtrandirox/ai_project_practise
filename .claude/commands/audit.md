Run a full dependency security audit for this project and fix any issues found.

Steps:
1. Run `npm audit` to list all vulnerabilities
2. Run `npm audit fix` to automatically fix safe updates
3. Run `npx tsc --noEmit` to verify TypeScript still compiles after the fixes
4. Report a summary of: what was found, what was fixed, and any remaining issues that need manual attention
