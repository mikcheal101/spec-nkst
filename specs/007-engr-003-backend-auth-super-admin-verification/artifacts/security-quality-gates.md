# ENGR-003 Security & Quality Gates (T070)

Date: 2026-11-22  
Branch: `ENGR-003-backend-auth-super-admin-verification`  
Spec: `specs/007-engr-003-backend-auth-super-admin-verification/spec.md`

## Gate Execution Summary

| Gate | Command / Check | Result | Evidence / Artifact |
|---|---|---|---|
| Frontend typecheck/build | `cd src/web && npm run -s build` (includes `tsc -b`) | **PASS** | Built successfully (vite build; chunk-size warning only). |
| Frontend lint | `npm run lint` / package script inspection | **NOT CONFIGURED / BLOCKED** | `src/web/package.json` has no `lint` script (`grep "\"lint\"" src/web/package.json` returned none). No ESLint gate executed. |
| Frontend SCA | `cd src/web && npm audit --json` | **FINDINGS PRESENT (triaged below)** | 13 vulnerabilities: **7 high, 4 moderate, 2 low, 0 critical**. `fixAvailable=true` for reported packages. Raw JSON captured during run (`/tmp/npm-audit-engr003.json` in execution environment). |
| Semgrep SAST | `semgrep --version` / `npx semgrep --version` | **BLOCKED - tool unavailable** | `semgrep` CLI not installed; npx resolution unavailable in environment. No SAST artifact generated. |
| Backend SCA | OWASP Dependency-Check / Snyk / Trivy | **BLOCKED - tool unavailable** | No `snyk`, `trivy`, or `dependency-check` CLI detected; no Maven dependency-check plugin evidence collected in this run. No backend SCA artifact generated. |
| Secret scan | gitleaks / trufflehog / detect-secrets | **BLOCKED - tool unavailable** | No secret-scan CLI detected. No secret-scan artifact generated. |

## npm audit triage (frontend, `src/web`)

Summary from `npm audit --json`: **13 vulnerabilities total (7 high, 4 moderate, 2 low, 0 critical)**. All reported vulnerable package entries show `fixAvailable: true`.

| Severity | Package | Direct | Vulnerability | Advisory | Affected range | Triage / action |
|---:|---|:---:|---|---|---|---|
| High | vite | Yes | launch-editor: `fs.existsSync()` existence check can be bypassed on Windows | https://github.com/advisories/GHSA-587h-7wmj-h5pm | <=6.4.3 | **Upgrade vite** to patched release; dev-server/build tooling risk, Windows-specific path-bypass. Validate build/test after bump. |
| High | browserslist | No | Unbounded memory growth (no cache eviction) via distinct query results, leading to eventual OOM | https://github.com/advisories/GHSA-c83g-rgw3-j3cx | <=4.28.6 | Transitive; update lockfile/deps (`npm audit fix`/targeted update). Low runtime exposure in deployed SPA, but fix in CI. |
| High | browserslist | No | Uncaught crash/prototype write via untrusted browserslist-stats.json custom stats | https://github.com/advisories/GHSA-73wf-gq98-2v4g | <=4.28.6 | Transitive; fix via dependency update. Requires untrusted stats file input; primarily build-time risk. |
| High | nanoid | No | Custom generators can loop indefinitely when size is zero | https://github.com/advisories/GHSA-2v37-7h3g-55p8 | <3.3.18 | Transitive; update dependency graph. DoS potential if untrusted size reaches generator. |
| High | nanoid | No | Non-secure generators can loop indefinitely with negative size | https://github.com/advisories/GHSA-28wg-ghj8-5hjv | <3.3.16 | Transitive; update dependency graph. |
| High | postcss | No | Path Traversal in Previous Source Map Auto-Loading leads to arbitrary .map file disclosure | https://github.com/advisories/GHSA-r28c-9q8g-f849 | <=8.5.17 | Transitive build tooling; upgrade via parent deps. Risk mainly in build/dev workflows processing untrusted content. |
| High | react-router | No | RSC Mode CSRF Bypass Allows Action Execution Before 400 Response | https://github.com/advisories/GHSA-qwww-vcr4-c8h2 | >=7.12.0 <7.18.2 | **High priority** for app using react-router; evaluate upgrade to >=7.18.2. Confirm RSC mode not used; still patch. |
| High | react-router | No | Unauthenticated Denial of Service via Inefficient Route Matching | https://github.com/advisories/GHSA-chx6-hx7r-mcp5 | >=7.0.0 <7.18.0 | Upgrade react-router/react-router-dom to patched version; test routing. |
| High | source-map-js | No | Event-loop denial of service through indexed source-map section offsets | https://github.com/advisories/GHSA-68fv-2mgg-jv7q | >=1.0.0 <1.2.2 | Transitive; build/tooling DoS risk. Update lockfile. |
| High | undici | No | Multiple advisories (DoS, TLS validation bypass, cache poisoning/cross-user disclosure, cross-origin routing, etc.; 10 high advisories reported by npm) | https://github.com/advisories/GHSA-vxpw-j846-p89q (representative; see npm audit JSON for full set) | ranges within >=7.0.0 <7.30.1 depending advisory | Transitive; upgrade to >=7.30.1 where possible. Runtime impact depends on server-side/node usage; frontend dev/test tooling can also be affected. |
| Moderate | @vitest/coverage-v8 | Yes (dev) | Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock (transitive) | https://github.com/advisories/GHSA-82fw-gwwq-j7x9 | 2.1.0-beta.1 - 4.1.10 | Dev/test dependency; upgrade vitest/coverage-v8 to patched versions. Avoid running tests on untrusted repos/config. |
| Moderate | @vitest/mocker | No | Code injection via unauthenticated manual mock registration | https://github.com/advisories/GHSA-qxg6-89mg-rqv8 | >=2.1.0-beta.7 <4.1.12 | Dev/test dependency; patch with vitest upgrade. |
| Moderate | @vitest/mocker | No | Path Traversal / Arbitrary File Read via Redirect Mock | https://github.com/advisories/GHSA-82fw-gwwq-j7x9 | >=2.1.0 <4.1.11 | Dev/test dependency; patch with vitest upgrade. |
| Moderate | baseline-browser-mapping | No | Process termination on invalid input causes denial of service | https://github.com/advisories/GHSA-w5vr-8v7q-w6rv | >=2.0.0 <2.11.0 | Transitive; update lockfile. |
| Moderate | postcss | No | Incomplete fix of GHSA-6g55-p6wh-862q - arbitrary .map file read when `from` unset | https://github.com/advisories/GHSA-fxqj-rqcc-2cmp | <=8.5.22 | Transitive build tooling; upgrade via parent deps. |
| Moderate | react-router | No | Arbitrary Constructor Injection via deserializeErrors() in SSR hydration | https://github.com/advisories/GHSA-337j-9hxr-rhxg | >=6.4.0 <7.18.0 | Patch with react-router upgrade; SSR not primary in SPA but fix required. |
| Moderate | react-router | No | Open redirect via backslash in <Link>/useNavigate (CVE-2025-68470 bypass) | https://github.com/advisories/GHSA-wrjc-x8rr-h8h6 | >=6.0.0 <7.18.0 | **User-facing routing risk**; upgrade react-router-dom. |
| Moderate | react-router | No | RSCErrorHandler Missing Protocol Validation (XSS) | https://github.com/advisories/GHSA-h8fp-f39c-q6mh | >=7.11.0 <7.18.0 | Patch with react-router upgrade. |
| Moderate | undici | No | Multiple moderate advisories (DoS, header injection, cache/cookie disclosure, integrity bypass etc.; 13 moderate advisories reported by npm) | https://github.com/advisories/GHSA-9fm3-97px-rjf6 (representative; see npm audit JSON for full set) | ranges within >=7.0.0 <7.30.1 depending advisory | Transitive; upgrade to >=7.30.1 where possible. |
| Moderate | vite | Yes | Files outside `server.fs.allow` served when project paths match system paths on non-Windows | https://github.com/advisories/GHSA-rq7h-c2jc-7f22 | <=6.4.3 | Upgrade vite; dev-server exposure in non-Windows environments. |
| Moderate | vite | Yes | launch-editor editor CLI flag misinterpretation causing arbitrary command execution for some editors | https://github.com/advisories/GHSA-r825-w8mm-5pxw | <=6.4.3 | Upgrade vite; dev-server risk. |
| Moderate | vite | Yes | launch-editor NTLMv2 hash disclosure via UNC path handling on Windows | https://github.com/advisories/GHSA-v6wh-96g9-6wx3 | <=6.4.2 | Upgrade vite; Windows dev risk. |
| Moderate | vite | Yes | launch-editor escapeCmdArgs() omits % escaping on Windows | https://github.com/advisories/GHSA-698v-4r3x-3vcv | <=6.4.3 | Upgrade vite. |
| Moderate | vite | Yes | `server.fs.deny` bypass on Windows alternate paths | https://github.com/advisories/GHSA-fx2h-pf6j-xcff | <=6.4.2 | Upgrade vite. |
| Moderate | vitest | Yes (dev) | Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock | https://github.com/advisories/GHSA-82fw-gwwq-j7x9 | >=2.1.0 <4.1.11 | Upgrade vitest and @vitest/coverage-v8 together. |
| Low | @babel/core | No | Arbitrary File Read via sourceMappingURL Comment | https://github.com/advisories/GHSA-4x5r-pxfx-6jf8 | <=7.29.0 | Transitive build tooling; update lockfile. |
| Low | react-router-dom | Yes | Potential CSRF via PUT/PATCH/DELETE document requests | https://github.com/advisories/GHSA-84g9-w2xq-vcv6 | 7.12.0-pre.0 - 7.15.1 | Upgrade react-router-dom; validate auth flows. |
| Low | undici | No | Multiple low advisories (cache poisoning/replay, response splitting/truncation, SameSite downgrade; 5 low advisories reported by npm) | https://github.com/advisories/GHSA-35p6-xmwp-9g52 (representative; see npm audit JSON for full set) | ranges within >=7.0.0 <7.29.1 depending advisory | Transitive; patch with undici upgrade. |

**Triage conclusion:** No critical vulnerabilities. Findings are concentrated in dev/build tooling (`vite`, `vitest`, `@vitest/*`, `babel`, `postcss`, `browserslist`, `source-map-js`) and transitive/runtime networking/routing deps (`undici`, `react-router`, `nanoid`). Recommended remediation: run controlled dependency upgrades (`vite`/`vitest`/`react-router-dom` and lockfile refresh), re-run full frontend tests/build and npm audit, and capture CI evidence. Do not mass-upgrade blindly without regression testing.

## ENGR-002 Modification Check

- Tracked ENGR-002 files: `specs/ENGR-002-web-auth-e2e-verification-plan.md`, `specs/ENGR-002-web-auth-e2e-verification.md`, `specs/ENGR-002-web-auth-e2e-verification/tasks.md`.
- `git diff --name-only -- 'specs/ENGR-002*' 'specs/002-*'`: **no output**.
- `git status --short -- 'specs/ENGR-002*' 'specs/002-*'`: **no output**.
- Result: **No tracked ENGR-002 modifications detected**.

## Phase 5 Convergence Alignment (T075, 2026-11-23)

| T075 item | Status | Evidence / blocker | Required for closure |
|---|---|---|---|
| Frontend lint gate in `src/web/package.json`/CI | **BLOCKED** | No `lint` script/config added in this pass; CI workflow evidence not attached. | Add lint script/config, run in CI, attach logs/artifact paths. |
| npm audit remediation or approved risk acceptance | **BLOCKED** | Existing triage retained (13 vulns: 7H/4M/2L/0C, fixAvailable=true). No dependency remediation/re-scan performed in this pass; no approved risk acceptance. | Remediate and re-run `npm audit` in CI, or record approved time-bound risk acceptances with owner/approver/expiry/compensating controls. |
| Semgrep SAST CI artifact | **BLOCKED** | Semgrep CLI unavailable in environment; no CI SAST artifact. | Run Semgrep in CI/tool-enabled env; attach report/artifact path. |
| Backend SCA (OWASP Dependency-Check/Snyk/Trivy) artifact | **BLOCKED** | Tool/plugin/CI evidence unavailable. | Run backend SCA in CI; attach report/artifact path. |
| Secret scan artifact | **BLOCKED** | No gitleaks/trufflehog/detect-secrets evidence. | Run secret scan in CI; attach report/artifact path. |

## Status / Blockers (T070/T075 - keep unchecked)

T070 and T075 are **NOT fully verified** and remain **[ ]** in `tasks.md`.

**Complete evidence captured:**
- Frontend typecheck/build PASS (`npm run -s build`, includes `tsc -b`).
- Frontend SCA executed previously: `npm audit --json` triaged — 13 vulns (7 high, 4 moderate, 2 low, 0 critical), `fixAvailable=true`; remediation guidance documented above.
- ENGR-002 untouched confirmed (`git diff/status` for `specs/ENGR-002*`/`specs/002-*` clean).
- 2026-11-23 docs/config alignment pass recorded; no false closure of CI/security gates.

**Missing / CI blockers (must be resolved before [X]):**
- **Lint gate missing**: no `lint` script in `src/web/package.json`; no lint artifact.
- **Semgrep SAST unavailable**: no SAST artifact.
- **Backend SCA unavailable/not configured**: no backend SCA artifact.
- **Secret scan unavailable**: no secret-scan artifact.
- **Remediation not completed**: npm audit findings not remediated/re-scanned in CI; no approved risk acceptances.

**Required for closure:** run lint, Semgrep, backend SCA, and secret scan in CI/tool-enabled environment; remediate/accept documented risk for npm audit findings with approvals; attach artifact paths/logs and rerun gates. Do not mark T070/T075 `[X]` without evidence.
