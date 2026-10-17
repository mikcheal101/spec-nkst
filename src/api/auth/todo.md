# TODO: Add Roles & Permissions to JWT

## Goal
Embed roles and permissions as JWT claims, map them to Spring Security `GrantedAuthority`, auto-assign default role on sign-up, and enable role-based authorization.

## Decisions
- **Self-contained JWT** — roles/permissions embedded as claims; no DB call per request
- **Default role on sign-up** — auto-assign `MEMBER_UNBAPTISED`
- **Refresh tokens stay sparse** — no roles/permissions in refresh tokens

---

## Tasks

### 1. Modify `JwtUtil.java` — Add claims to access token
- [ ] Create overload: `generateToken(User user, long expirationMs, String tokenType)`
- [ ] Add claims:
  - `"roles"` → list of role name strings (e.g., `["SUPER_ADMIN"]`)
  - `"permissions"` → list of permission name strings (e.g., `["CAN_CREATE_CHURCH"]`)
  - `"userId"` → `user.getId()`
- [ ] Keep the existing `generateToken(String username, ...)` for refresh tokens (unchanged)

### 2. Modify `UserService.java` — Return proper authorities
- [ ] In `loadUserByUsername()`, map `user.getRoles()` → `ROLE_<name>` and `user.getPermissions()` → `name` as `SimpleGrantedAuthority`
- [ ] Replace `Collections.emptyList()` with combined authority list
- [ ] Ensure `UserRepository` query uses `JOIN FETCH roles` / `JOIN FETCH permissions` to avoid `LazyInitializationException`

### 3. Modify `AuthServiceImpl.java` — Pass user to JWT creation + assign default role
- [ ] In `authenticateUser()`: load `User` entity with roles/permissions, call `jwtUtil.generateToken(user, jwtExpirationMs, "access")`
- [ ] In `registerUser()`: fetch `MEMBER_UNBAPTISED` role via `RoleService`, assign it to the new `User` before saving
- [ ] Ensure `@Transactional` where needed for lazy loading

### 4. Modify `AuthTokenFilter.java` — Extract authorities from JWT claims
- [ ] After parsing JWT, extract `roles` and `permissions` claim lists
- [ ] Convert them to `List<SimpleGrantedAuthority>`
- [ ] Build `UsernamePasswordAuthenticationToken` with those authorities (instead of `userDetails.getAuthorities()`)

### 5. Modify `WebSecurityConfig.java` — Enable method security
- [ ] Add `@EnableMethodSecurity` annotation
- [ ] (Optional) Add path-based rules: `.requestMatchers("/api/v1/admin/**").hasRole("SUPER_ADMIN")`

### 6. Verify sign-up assigns default role
- [ ] Check `AuthServiceImpl.registerUser()` sets `MEMBER_UNBAPTISED` role
- [ ] Verify `RoleRepository.findByName(ERole.MEMBER_UNBAPTISED)` exists (seeded by `Seeder.java`)

### 7. End-to-end verification
- [ ] Sign in → JWT contains `roles`, `permissions`, `userId` claims (decode and inspect)
- [ ] Authenticated request → `SecurityContextHolder.getContext().getAuthentication().getAuthorities()` is populated
- [ ] `@PreAuthorize("hasRole('SUPER_ADMIN')")` works on a test endpoint
- [ ] Sign-out still blacklists the JWT correctly

---

## Potential Pitfalls
- **Lazy loading**: `User.getRoles()` will fail if `loadUserByUsername()` runs outside a transaction. Either use `@Transactional` or a `@EntityGraph`/`JOIN FETCH` query
- **JWT size**: Embedding many roles/permissions inflates the token — negligible here (7 roles, 5 permissions max)
- **Stale claims**: Role changes take effect only on next token refresh. Acceptable for this use case
