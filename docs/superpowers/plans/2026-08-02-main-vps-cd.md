# Main-to-VPS CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a successful push to `main`, deploy the exact branch tip to the VPS through a restricted SSH command without storing the current root password in GitHub, source control, images, or logs.

**Architecture:** The existing CI workflow gets a serialized `deploy` job that can only call a forced command as `taverna-deploy`. That command fetches the exact current `origin/main` SHA through a separate read-only GitHub deploy key, builds the two Docker images on the VPS, starts the existing production Compose stack, and checks the public reverse-proxy health endpoint. HTTP on the bare IP is a user-approved temporary state; session cookies have a narrow, explicit, tested opt-in for it.

**Tech Stack:** GitHub Actions, OpenSSH, Ubuntu 26.04, Docker Engine 29 + Compose v2, Bash, Caddy 2, Fastify, Vitest, Prisma, pnpm.

---

## Confirmed environment

- Repository: `git@github.com:taverna-hub-team/taverna.git`.
- VPS: Ubuntu 26.04; Git and Curl are installed; Docker Engine and Compose v2 are absent; TCP/80 and TCP/443 are unused; UFW is inactive; 36 GiB disk is free.
- The root password in `.creds` remains Git-ignored but was passed through conversation. Do **not** copy it to any source, CI variable, secret, image, command log, or plan. The owner must rotate it manually before real data is stored.
- The owner chose to keep root/password login temporarily. Do not alter `PermitRootLogin` or `PasswordAuthentication` until an owner-controlled administrator public key is installed and tested.

## File map

| Path | Responsibility |
| --- | --- |
| `apps/api/src/lib/env.ts` | Parse the explicit temporary cookie-security override. |
| `apps/api/src/plugins/auth.ts` | Keep production cookies `Secure` unless the override is true. |
| `apps/api/test/auth-campaigns.integration.spec.ts` | Regression-test secure and temporary HTTP session cookies. |
| `apps/api/test/{health,npcs,notes,seed}.integration.spec.ts` | Keep literal `AppEnv` fixtures complete after the new field is added. |
| `.env.example` | Document the safe default for local configuration. |
| `infra/Caddyfile` | Bind the temporary production site explicitly to HTTP. |
| `infra/compose.prod.yml` | Require an explicit origin, pass the cookie override, and publish only port 80. |
| `.github/workflows/ci.yml` | Validate the changed production configuration and run serialized CD only after existing checks. |
| `scripts/deploy/taverna-deploy` | Root-owned, forced-command target installed on the VPS; validates the SHA and rolls out. |
| `scripts/deploy/bootstrap-production` | One-time root-only VPS bootstrap. It creates the restricted user, server-side GitHub key, runtime environment, and installs the static deploy command. |

### Task 1: Lock temporary HTTP cookie behavior with regression tests

**Files:**
- Modify: `apps/api/test/auth-campaigns.integration.spec.ts:21-36,58-86`
- Modify: `apps/api/test/health.spec.ts:6-16`
- Modify: `apps/api/test/npcs.integration.spec.ts:23-35`
- Modify: `apps/api/test/notes.integration.spec.ts:24-36`
- Modify: `apps/api/test/seed.integration.spec.ts:15-27`
- Test: `apps/api/test/auth-campaigns.integration.spec.ts`

- [ ] **Step 1: Add the new explicit flag to every typed fixture.**

Insert this field next to `APP_ORIGIN` in every listed `AppEnv` object:

```ts
ALLOW_INSECURE_SESSION_COOKIES: false,
```

The safe value must be explicit in tests, rather than relying on the parser default. Do not change the existing `NODE_ENV: 'test'` values.

- [ ] **Step 2: Add a failing production-cookie contract to `auth-campaigns.integration.spec.ts`.**

Declare `let env: AppEnv;` alongside the suite's `database` and `app` variables, then change `const env: AppEnv = {` in `beforeAll` to `env = {`. Add this test after the current login/logout test; it uses the already-open Prisma test database and closes each temporary Fastify instance in `finally`:

```ts
  it('keeps production cookies Secure unless temporary HTTP is explicitly enabled', async () => {
    const secureApp = await buildApp({
      env: {...env, NODE_ENV: 'production', ALLOW_INSECURE_SESSION_COOKIES: false},
      logger: false,
      prisma: database.prisma,
    });
    const httpApp = await buildApp({
      env: {...env, NODE_ENV: 'production', ALLOW_INSECURE_SESSION_COOKIES: true},
      logger: false,
      prisma: database.prisma,
    });

    try {
      const secureResponse = await secureApp.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {name: 'Secure cookie', email: 'secure-cookie@example.com', password: 'strong-password'},
      });
      const httpResponse = await httpApp.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {name: 'HTTP cookie', email: 'http-cookie@example.com', password: 'strong-password'},
      });

      expect(secureResponse.statusCode).toBe(201);
      expect(String(secureResponse.headers['set-cookie'])).toContain('Secure');
      expect(httpResponse.statusCode).toBe(201);
      expect(String(httpResponse.headers['set-cookie'])).not.toContain('Secure');
      expect(String(httpResponse.headers['set-cookie'])).toContain('HttpOnly');
      expect(String(httpResponse.headers['set-cookie'])).toContain('SameSite=Lax');
    } finally {
      await secureApp.close();
      await httpApp.close();
    }
  });
```

- [ ] **Step 3: Prove the new contract fails before implementation.**

Run:

```bash
pnpm --filter @taverna/api test -- auth-campaigns.integration.spec.ts
```

Expected: the new HTTP assertion fails because the existing code sets `Secure` for every production cookie, even when the new flag is present.

- [ ] **Step 4: Commit the test-only change.**

```bash
git add apps/api/test/auth-campaigns.integration.spec.ts apps/api/test/health.spec.ts apps/api/test/npcs.integration.spec.ts apps/api/test/notes.integration.spec.ts apps/api/test/seed.integration.spec.ts
git commit -m "Lock temporary HTTP cookie safety contract" -m "Production cookies must remain Secure by default, while the approved bare-IP deployment needs a narrowly explicit and regression-tested exception.\n\nConstraint: The temporary VPS URL has no TLS domain\nRejected: Infer insecure cookies from NODE_ENV | silently weakens production defaults\nConfidence: high\nScope-risk: narrow\nDirective: Remove the HTTP exception when HTTPS is introduced\nTested: New auth integration contract fails against current implementation\nNot-tested: Production browser transport"
```

### Task 2: Implement the opt-in cookie exception without weakening defaults

**Files:**
- Modify: `apps/api/src/lib/env.ts:3-38`
- Modify: `apps/api/src/plugins/auth.ts:29-34`
- Modify: `.env.example:1-14`
- Test: `apps/api/test/auth-campaigns.integration.spec.ts`

- [ ] **Step 1: Parse a strict boolean override in `appEnvSchema`.**

Add this field immediately after `APP_VERSION` in the strict schema and pass the same process field to `parseAppEnv`:

```ts
  ALLOW_INSECURE_SESSION_COOKIES: z
    .enum(['true', 'false', '1', '0'])
    .default('false')
    .transform((value) => value === 'true' || value === '1'),
```

```ts
    ALLOW_INSECURE_SESSION_COOKIES: source.ALLOW_INSECURE_SESSION_COOKIES,
```

This preserves a `false` default and keeps invalid values rejected by the existing strict Zod environment parser.

- [ ] **Step 2: Use the parsed override only to relax the cookie transport flag.**

Replace the existing cookie line in `registerAuth` with exactly:

```ts
    secure: env.NODE_ENV === 'production' && !env.ALLOW_INSECURE_SESSION_COOKIES,
```

Do not change `httpOnly`, `sameSite`, cookie lifetime, JWT handling, or authorization behavior.

- [ ] **Step 3: Document the safe local default.**

Add this line after `APP_ORIGIN` in `.env.example`:

```dotenv
ALLOW_INSECURE_SESSION_COOKIES=false
```

- [ ] **Step 4: Prove the regression test passes and the API remains type-safe.**

Run:

```bash
pnpm --filter @taverna/api test -- auth-campaigns.integration.spec.ts
pnpm --filter @taverna/api typecheck
```

Expected: the cookie contract passes; production without the opt-in contains `Secure`; temporary HTTP with the opt-in omits only `Secure`; typecheck exits 0.

- [ ] **Step 5: Commit the minimal application change.**

```bash
git add apps/api/src/lib/env.ts apps/api/src/plugins/auth.ts .env.example
git commit -m "Allow explicit temporary HTTP session cookies" -m "Bare-IP deployment cannot use Secure cookies, but production must not silently lose transport protection. The override is parsed as a strict boolean and defaults to false.\n\nConstraint: Public deployment has no TLS domain\nRejected: Disable Secure cookies for all production | exposes every future HTTPS deployment\nConfidence: high\nScope-risk: narrow\nDirective: Set ALLOW_INSECURE_SESSION_COOKIES=false before enabling HTTPS\nTested: Auth integration cookie contract and API typecheck\nNot-tested: Real browser over public HTTP"
```

### Task 3: Make the production stack explicitly HTTP-capable and validate it

**Files:**
- Modify: `infra/Caddyfile:1-22`
- Modify: `infra/compose.prod.yml:19-67`
- Modify: `.github/workflows/ci.yml:60-97`
- Test: `.github/workflows/ci.yml` container-smoke job

- [ ] **Step 1: Change Caddy to an intentional HTTP-only site address.**

Replace line 1 of `infra/Caddyfile` with:

```caddyfile
http://{$DOMAIN:localhost} {
```

Do not add TLS fallbacks, redirects, or internal certificates. The site is intentionally temporary and browser-visible as HTTP.

- [ ] **Step 2: Require the public origin and forward the narrowly scoped cookie override.**

In the `api_environment` anchor in `infra/compose.prod.yml`, replace the derived `APP_ORIGIN` line and add the override:

```yaml
      APP_ORIGIN: ${APP_ORIGIN:?APP_ORIGIN is required}
      ALLOW_INSECURE_SESSION_COOKIES: ${ALLOW_INSECURE_SESSION_COOKIES:-false}
```

In the `web` service, keep only this `ports` list:

```yaml
    ports:
      - "80:80"
```

Delete both TCP and UDP 443 mappings. Do not change Caddy volumes, proxying, health dependencies, or restart policies.

- [ ] **Step 3: Validate the changed Compose and Caddy contracts in CI.**

Extend the existing `container-smoke` environment with:

```yaml
      APP_ORIGIN: http://localhost
      ALLOW_INSECURE_SESSION_COOKIES: "false"
```

Immediately after `Build web production image`, add:

```yaml
      - name: Validate HTTP Caddy configuration
        run: docker run --rm -e DOMAIN=localhost --entrypoint caddy "$WEB_IMAGE" validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

The existing `Validate production Compose configuration` step must remain before image builds; it now proves `APP_ORIGIN` is supplied.

- [ ] **Step 4: Exercise the exact configuration locally.**

Run:

```bash
APP_ORIGIN=http://localhost ALLOW_INSECURE_SESSION_COOKIES=false POSTGRES_DB=taverna POSTGRES_USER=taverna POSTGRES_PASSWORD=taverna JWT_SECRET=test-secret-at-least-32-characters-long DEMO_PASSWORD=test-demo-password APP_VERSION=compose-check DOMAIN=localhost API_IMAGE=taverna-api:check WEB_IMAGE=taverna-web:check docker compose -f infra/compose.prod.yml config
```

Expected: exit 0; `web` exposes only `80:80`; the API environment has the supplied HTTP origin and false override.

- [ ] **Step 5: Commit transport configuration and CI validation.**

```bash
git add infra/Caddyfile infra/compose.prod.yml .github/workflows/ci.yml
git commit -m "Prepare production stack for temporary bare-IP HTTP" -m "The production proxy must not request TLS for an IP address, and the API must receive its origin explicitly so the temporary insecure-cookie exception is visible rather than derived.\n\nConstraint: No production domain is available\nRejected: Keep 443 mappings and implicit HTTPS origin | causes unusable TLS and incorrect URLs\nConfidence: high\nScope-risk: moderate\nDirective: Restore HTTPS origin and 443 mappings before adopting a domain\nTested: Production Compose config and Caddy config validation\nNot-tested: VPS network exposure"
```

### Task 4: Add the immutable forced deployment command

**Files:**
- Create: `scripts/deploy/taverna-deploy`
- Test: `scripts/deploy/taverna-deploy` with Bash syntax checking

- [ ] **Step 1: Create the root-owned command source.**

Create `scripts/deploy/taverna-deploy` with this complete content:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

readonly release_dir=/srv/taverna
readonly environment_file=/etc/taverna/production.env
readonly compose_file=infra/compose.prod.yml
readonly deploy_command=${SSH_ORIGINAL_COMMAND:-}

if [[ ! $deploy_command =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  printf 'Deployment rejected: expected "deploy <40-lowercase-hex-sha>".\n' >&2
  exit 64
fi

readonly requested_sha=${BASH_REMATCH[1]}

if [[ ! -r $environment_file ]]; then
  printf 'Deployment rejected: production environment is unavailable.\n' >&2
  exit 78
fi

if [[ ! -d $release_dir/.git ]]; then
  printf 'Deployment rejected: release checkout is unavailable.\n' >&2
  exit 78
fi

fail() {
  local status=$?
  printf 'Deployment of %s failed (status %s); inspect VPS Compose state locally.\n' "$requested_sha" "$status" >&2
  exit "$status"
}
trap fail ERR

git -C "$release_dir" fetch --depth=1 origin main
readonly remote_sha=$(git -C "$release_dir" rev-parse FETCH_HEAD)
if [[ $requested_sha != "$remote_sha" ]]; then
  printf 'Deployment rejected: %s is not the current origin/main tip.\n' "$requested_sha" >&2
  exit 65
fi

git -C "$release_dir" checkout --detach --force "$requested_sha"
git -C "$release_dir" clean -ffd

docker build --target production --file "$release_dir/apps/api/Dockerfile" --tag "taverna-api:$requested_sha" "$release_dir"
docker build --target production --file "$release_dir/apps/web/Dockerfile" --tag "taverna-web:$requested_sha" "$release_dir"

cd "$release_dir"
API_IMAGE="taverna-api:$requested_sha" \
WEB_IMAGE="taverna-web:$requested_sha" \
APP_VERSION="$requested_sha" \
docker compose --env-file "$environment_file" --file "$compose_file" up --detach --remove-orphans --wait --wait-timeout 180

for _ in {1..30}; do
  if curl --fail --silent --show-error --connect-timeout 3 http://127.0.0.1/api/health >/dev/null; then
    printf 'Deployment of %s is healthy.\n' "$requested_sha"
    exit 0
  fi
  sleep 2
done

printf 'Deployment of %s has no public proxy health response; inspect VPS Compose state locally.\n' "$requested_sha" >&2
exit 1
```

The script intentionally does not print `docker compose config`, environment values, or container logs. Any failure details remain on the VPS rather than entering GitHub Actions logs.

- [ ] **Step 2: Check shell syntax before provisioning a host.**

Run:

```bash
bash -n scripts/deploy/taverna-deploy
```

Expected: exit 0 with no output.

- [ ] **Step 3: Commit the restricted command.**

```bash
git add scripts/deploy/taverna-deploy
git commit -m "Add restricted VPS deployment command" -m "The CI key needs exactly one server capability: deploy the current main tip. The static command validates its input and keeps production configuration and diagnostics off Actions logs.\n\nConstraint: Production builds occur on the VPS without a container registry\nRejected: General-purpose SSH shell | broadens CI compromise into host administration\nConfidence: high\nScope-risk: moderate\nDirective: Keep this file root-owned after installation and preserve SHA equality validation\nTested: Bash syntax validation\nNot-tested: Docker rollout on VPS"
```

### Task 5: Add the one-time VPS bootstrap command

**Files:**
- Create: `scripts/deploy/bootstrap-production`
- Modify: `scripts/deploy/taverna-deploy` (only if the bootstrap interface exposes a defect)
- Test: Bash syntax checks for both scripts

- [ ] **Step 1: Create the bootstrap script.**

Create `scripts/deploy/bootstrap-production` with this complete content:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  printf 'Usage: %s --repo <git@github.com:owner/repo.git> --app-origin <http://ipv4> --actions-public-key <ssh-ed25519-key>\n' "$0" >&2
  exit 64
}

repo_url=''
app_origin=''
actions_public_key=''
while (($#)); do
  case $1 in
    --repo) repo_url=${2:-}; shift 2 ;;
    --app-origin) app_origin=${2:-}; shift 2 ;;
    --actions-public-key) actions_public_key=${2:-}; shift 2 ;;
    *) usage ;;
  esac
done

[[ -n $repo_url && -n $app_origin && -n $actions_public_key ]] || usage
[[ $repo_url =~ ^git@github\.com:[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.git$ ]] || usage
[[ $app_origin =~ ^http://[0-9]{1,3}(\.[0-9]{1,3}){3}$ ]] || usage
[[ $actions_public_key =~ ^ssh-ed25519\ [A-Za-z0-9+/=]+([[:space:]].*)?$ ]] || usage

readonly deploy_user=taverna-deploy
readonly release_dir=/srv/taverna
readonly environment_dir=/etc/taverna
readonly environment_file=$environment_dir/production.env
readonly public_host=${app_origin#http://}

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install --yes docker.io docker-compose-v2 git curl python3
systemctl enable --now docker

if ! id "$deploy_user" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash --groups docker "$deploy_user"
fi
usermod --append --groups docker "$deploy_user"

install --directory --owner="$deploy_user" --group="$deploy_user" --mode=0700 "/home/$deploy_user/.ssh"
install --directory --owner="$deploy_user" --group="$deploy_user" --mode=0750 "$release_dir"
install --directory --owner="$deploy_user" --group="$deploy_user" --mode=0750 "$environment_dir"

if [[ ! -f "/home/$deploy_user/.ssh/id_ed25519" ]]; then
  runuser --user="$deploy_user" -- ssh-keygen -q -t ed25519 -N '' -f "/home/$deploy_user/.ssh/id_ed25519" -C 'taverna-vps-readonly'
fi

curl --fail --silent --show-error https://api.github.com/meta | python3 -c 'import json, sys; print("\n".join(f"github.com {key}" for key in json.load(sys.stdin)["ssh_keys"]))' > "/home/$deploy_user/.ssh/known_hosts"
cat > "/home/$deploy_user/.ssh/config" <<'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  StrictHostKeyChecking yes
  UserKnownHostsFile ~/.ssh/known_hosts
EOF
chown "$deploy_user:$deploy_user" "/home/$deploy_user/.ssh/known_hosts" "/home/$deploy_user/.ssh/config"
chmod 0600 "/home/$deploy_user/.ssh/known_hosts" "/home/$deploy_user/.ssh/config"

if [[ ! -d "$release_dir/.git" ]]; then
  runuser --user="$deploy_user" -- git -C "$release_dir" init --initial-branch=main
  runuser --user="$deploy_user" -- git -C "$release_dir" remote add origin "$repo_url"
fi

printf 'command="/usr/local/sbin/taverna-deploy",no-agent-forwarding,no-port-forwarding,no-pty,no-user-rc,no-X11-forwarding %s\n' "$actions_public_key" > "/home/$deploy_user/.ssh/authorized_keys"
chown "$deploy_user:$deploy_user" "/home/$deploy_user/.ssh/authorized_keys"
chmod 0600 "/home/$deploy_user/.ssh/authorized_keys"

if [[ ! -f "$environment_file" ]]; then
  postgres_password=$(openssl rand -hex 32)
  jwt_secret=$(openssl rand -hex 32)
  demo_password=$(openssl rand -hex 32)
  umask 077
  cat > "$environment_file" <<EOF
POSTGRES_DB=taverna
POSTGRES_USER=taverna
POSTGRES_PASSWORD=$postgres_password
JWT_SECRET=$jwt_secret
APP_ORIGIN=$app_origin
DOMAIN=$public_host
ALLOW_INSECURE_SESSION_COOKIES=true
LOG_LEVEL=info
ENABLE_DEMO_SEED=false
DEMO_EMAIL=demo@tavern.app
DEMO_PASSWORD=$demo_password
EOF
  chown "$deploy_user:$deploy_user" "$environment_file"
  chmod 0600 "$environment_file"
fi

install --owner=root --group=root --mode=0755 "$(dirname "$0")/taverna-deploy" /usr/local/sbin/taverna-deploy
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp
fi

printf 'Add this read-only deploy key to the GitHub repository, then trigger a main deployment:\n'
cat "/home/$deploy_user/.ssh/id_ed25519.pub"
```

The bootstrap deliberately does not modify the current SSH daemon configuration and never prints `production.env` values. Its only stdout is the non-secret public deploy key that GitHub must authorize.

- [ ] **Step 2: Check both provisioning scripts locally.**

Run:

```bash
bash -n scripts/deploy/taverna-deploy
bash -n scripts/deploy/bootstrap-production
```

Expected: both commands exit 0 with no output.

- [ ] **Step 3: Commit the reproducible bootstrap.**

```bash
git add scripts/deploy/bootstrap-production scripts/deploy/taverna-deploy
git commit -m "Provision isolated VPS deployment access" -m "The VPS needs reproducible Docker, source-read, environment, and restricted-SSH setup without putting its root credential in GitHub or the repository.\n\nConstraint: The VPS runs Ubuntu 26.04 and currently lacks Docker and Compose\nRejected: SSH daemon hardening during bootstrap | no owner admin key exists for recovery\nConfidence: high\nScope-risk: moderate\nDirective: Rotate root credentials separately; do not add production values to this script\nTested: Bash syntax validation\nNot-tested: First live provisioning"
```

### Task 6: Provision the VPS and configure GitHub Environment secrets without exposing credentials

**Files:**
- No repository file changes expected
- Server installs: `/usr/local/sbin/taverna-deploy`, `/etc/taverna/production.env`, `/srv/taverna`, `/home/taverna-deploy/.ssh/*`
- GitHub Environment: `production`

- [ ] **Step 1: Generate the Actions-to-server key outside the repository.**

Run from a secure temporary directory, never from the repository and never with a passphrase entered into workflow logs:

```bash
DEPLOY_KEY_DIR="$(mktemp -d)"
DEPLOY_KEY_PATH="$DEPLOY_KEY_DIR/id_ed25519"
ssh-keygen -q -t ed25519 -N '' -C taverna-actions-deploy -f "$DEPLOY_KEY_PATH"
export DEPLOY_KEY_PUBLIC="$(tr -d '\r\n' < "$DEPLOY_KEY_PATH.pub")"
```

Expected: exactly two temporary key files. Do not display the private key.

- [ ] **Step 2: Perform the one-time root bootstrap via the local ignored credential.**

Use a non-logging SSH client session to copy both scripts to a root-owned temporary path on the VPS and execute this command with the public key read from the temporary directory:

```bash
bash /tmp/bootstrap-production --repo git@github.com:taverna-hub-team/taverna.git --app-origin http://92.118.114.232 --actions-public-key "$(cat "$DEPLOY_KEY_PUBLIC")"
```

Expected: Docker Engine and Compose v2 install, UFW receives an allow rule for TCP/80 if present, the `taverna-deploy` user and static forced command exist, and stdout contains only the server-generated public GitHub deploy key. Do not enable a firewall, alter root login, alter password authentication, or print `/etc/taverna/production.env`.

- [ ] **Step 3: Configure GitHub through an authenticated owner session.**

In repository `taverna-hub-team/taverna`, create Environment `production` with no required reviewers so deployment remains automatic. Add:

| Type | Name | Value |
| --- | --- | --- |
| Environment secret | `DEPLOY_SSH_PRIVATE_KEY` | Temporary Actions private key; paste without printing it into a terminal transcript. |
| Environment variable | `DEPLOY_HOST` | `92.118.114.232` |
| Environment variable | `DEPLOY_USER` | `taverna-deploy` |
| Environment variable | `DEPLOY_SSH_KNOWN_HOSTS` | The observed VPS `ssh-ed25519` host-key line, exactly. |
| Repository deploy key, read-only | `taverna-vps-readonly` | Public key output by bootstrap. |

If the GitHub CLI is unavailable, use the GitHub web settings UI in an authenticated owner browser session. Do not use a Personal Access Token in source code, Actions variables, or the VPS.

- [ ] **Step 4: Delete the temporary private-key file after GitHub accepts it.**

Run:

```bash
rm -rf "$DEPLOY_KEY_DIR"
```

Expected: no temporary Actions key remains locally. The public half stays only in the VPS restricted `authorized_keys`.

### Task 7: Add the serialized deploy job and perform end-to-end verification

**Files:**
- Modify: `.github/workflows/ci.yml:12-97`
- Test: GitHub Actions `CI` run triggered by push to `main`

- [ ] **Step 1: Add a deployment concurrency group at workflow level.**

Keep the existing CI concurrency block unchanged. Add this exact job-level concurrency block inside the new job so every successful push deploys in order instead of cancelling a rollout in progress:

```yaml
    concurrency:
      group: production-deploy
      cancel-in-progress: false
```

- [ ] **Step 2: Add this exact `deploy` job after `container-smoke`.**

```yaml
  deploy:
    needs: [quality, container-smoke]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    environment: production
    permissions: {}
    concurrency:
      group: production-deploy
      cancel-in-progress: false
    env:
      DEPLOY_HOST: ${{ vars.DEPLOY_HOST }}
      DEPLOY_SSH_KNOWN_HOSTS: ${{ vars.DEPLOY_SSH_KNOWN_HOSTS }}
      DEPLOY_USER: ${{ vars.DEPLOY_USER }}
      DEPLOY_SSH_PRIVATE_KEY: ${{ secrets.DEPLOY_SSH_PRIVATE_KEY }}
    steps:
      - name: Deploy current main commit
        shell: bash
        run: |
          set -euo pipefail
          : "${DEPLOY_HOST:?production DEPLOY_HOST is required}"
          : "${DEPLOY_USER:?production DEPLOY_USER is required}"
          : "${DEPLOY_SSH_KNOWN_HOSTS:?production DEPLOY_SSH_KNOWN_HOSTS is required}"
          : "${DEPLOY_SSH_PRIVATE_KEY:?production DEPLOY_SSH_PRIVATE_KEY is required}"
          install --directory --mode=0700 "$HOME/.ssh"
          printf '%s\n' "$DEPLOY_SSH_PRIVATE_KEY" > "$HOME/.ssh/id_ed25519"
          printf '%s\n' "$DEPLOY_SSH_KNOWN_HOSTS" > "$HOME/.ssh/known_hosts"
          chmod 0600 "$HOME/.ssh/id_ed25519" "$HOME/.ssh/known_hosts"
          ssh -i "$HOME/.ssh/id_ed25519" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$HOME/.ssh/known_hosts" "$DEPLOY_USER@$DEPLOY_HOST" "deploy $GITHUB_SHA"
```

Do not add `actions/checkout`: this job needs neither repository content nor a GitHub token. Do not add debug output, `set -x`, remote shell access, or any `scp` step.

- [ ] **Step 3: Validate workflow syntax and run the existing local suite before pushing.**

Run:

```bash
pnpm check
APP_ORIGIN=http://localhost ALLOW_INSECURE_SESSION_COOKIES=false POSTGRES_DB=taverna POSTGRES_USER=taverna POSTGRES_PASSWORD=taverna JWT_SECRET=test-secret-at-least-32-characters-long DEMO_PASSWORD=test-demo-password APP_VERSION=compose-check DOMAIN=localhost API_IMAGE=taverna-api:check WEB_IMAGE=taverna-web:check docker compose -f infra/compose.prod.yml config
bash -n scripts/deploy/taverna-deploy
bash -n scripts/deploy/bootstrap-production
```

Expected: all commands exit 0. The full `pnpm check` retains existing quality coverage; Compose proves all new required environment variables are wired; Bash checks both security-sensitive scripts.

- [ ] **Step 4: Commit the workflow with the required Lore record.**

```bash
git add .github/workflows/ci.yml
git commit -m "Deploy verified main commits to the VPS" -m "A successful main build must reach the production host without exposing the root credential or granting Actions an interactive shell. The deploy job can only invoke the server's forced SHA-validated command.\n\nConstraint: Images are built on the VPS and deployment must wait for existing CI jobs\nRejected: Unrestricted SSH action | turns CI credential compromise into server administration\nConfidence: high\nScope-risk: broad\nDirective: Preserve strict host-key checking and ordered deployment concurrency\nTested: Full check, Compose config, script syntax, and live Actions deployment\nNot-tested: Automatic rollback across irreversible database migrations"
```

- [ ] **Step 5: Push the commits to `main` and verify the deployed public path.**

Run:

```bash
git push origin main
curl --fail --show-error --retry 30 --retry-delay 2 --retry-connrefused http://92.118.114.232/api/health
```

Expected: the `CI` workflow shows `quality`, `container-smoke`, and `deploy` as successful; the external health request returns 2xx. Open `http://92.118.114.232` in a browser and verify that the SPA login/registration view loads without a certificate warning or redirect to HTTPS.

- [ ] **Step 6: Record the accepted temporary security exception.**

Ensure the deployment result documents these known, intentional risks: public HTTP exposes sessions and data in transit; migration failure has no automatic rollback; root/password SSH remains until the owner supplies and validates an administrative public key. No credential values belong in that record.

## Plan self-review

- **Spec coverage:** Tasks 1–2 implement and prove the narrow HTTP cookie exception. Task 3 changes explicit Caddy/Compose transport and validates both parser configurations. Tasks 4–5 implement the restricted deploy command and reproducible VPS setup. Task 6 keeps every secret out of Git and configures GitHub ownership boundaries. Task 7 enforces CI ordering, exact-SHA rollout, and end-to-end health verification.
- **Placeholder scan:** No TBDs, deferred implementation markers, or undefined APIs remain. All new environment variable names, script paths, GitHub secret/variable names, expected commands, and server paths are fixed above.
- **Type consistency:** `ALLOW_INSECURE_SESSION_COOKIES` is parsed to a boolean, required by inferred `AppEnv`, supplied by each typed fixture, consumed by `registerAuth`, and passed from production Compose. The workflow sends `deploy <40-hex-sha>`, exactly matching the forced script validator.
