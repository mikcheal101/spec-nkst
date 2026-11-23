# ENGR-003 Test Run Artifacts

## Purpose
Retained command logs for ENGR-003 verification evidence. These files are evidence artifacts, not source code.

## Hygiene / PR policy
- Keep retained logs that are referenced by `tasks.md` or `gap-analysis-verification.md`.
- Do **not** modify `specs/007-engr-003-backend-auth-super-admin-verification/checklists/release-gate.md` (reviewer-owned).
- Do not include unrelated generated outputs. Prefer targeted, named logs (`T###-<Test>.log`).
- If a log is superseded, keep the latest referenced log and note supersession in evidence docs.
- Untracked artifact logs in this worktree should be intentionally included/excluded in PR based on reviewer evidence needs; do not silently delete.

## Current retained logs
- `T057-AuthContractIntegrationTest.log` - AuthContractIntegrationTest 11/0/0/0, BUILD SUCCESS.
- `T058-TokenRevocationIntegrationTest.log` - TokenRevocationIntegrationTest 2/0/0/0, BUILD SUCCESS.
