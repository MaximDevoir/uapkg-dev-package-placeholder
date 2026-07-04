# uapkg-dev-package-placeholder

A **barebones placeholder Unreal Engine plugin** whose only job is to exercise the
[UAPKG](https://github.com/MaximDevoir/uapkg) publishing pipeline end-to-end. The plugin
source does nothing meaningful — it exists so there is a real, packable, publishable
package to test against.

## What's in here

| Path | Purpose |
|---|---|
| `uapkg.json` | UAPKG package manifest (plugin) — everything the registry needs to publish. |
| `UapkgDevPlaceholder.uplugin` | Unreal plugin descriptor (required by `uapkg pack`). |
| `Source/UapkgDevPlaceholder/` | Throwaway module boilerplate (`Build.cs`, `Public/`, `Private/`). |
| `.github/workflows/publish.yml` | On a `v*` tag: pack → GitHub Release → publish. |
| `.gitignore` | Standard Unreal Engine ignores. |

### `uapkg.json`

```json
{
  "name": "uapkg-dev-package-placeholder",
  "version": "0.1.0",
  "kind": "plugin",
  "publish": { "registry": "default" }
}
```

- `name` — lowercase, hyphenated package name.
- `version` — semver; should match the pushed tag (minus the leading `v`).
- `kind` — `plugin`.
- `publish.registry` — target registry name. Change or remove to use your default registry.
  Add `"private": true` to refuse publishing to the official public registry.

## How publishing is wired

The workflow triggers on **pushing a git tag that starts with `v`**:

```bash
git tag v0.1.0
git push origin v0.1.0        # this push starts the workflow
```

or, without cloning:

```bash
gh release create v0.1.0 --repo MaximDevoir/uapkg-dev-package-placeholder --generate-notes
```

On each `v*` tag the workflow:

1. Checks out the repo (with Git LFS).
2. Installs the `@uapkg/cli`.
3. Runs `uapkg pack` to produce `dist/uapkg-dev-package-placeholder-<version>.tgz` (+ integrity).
4. Creates a GitHub Release for the tag and uploads the packed artifact.
5. **Publish step (placeholder):** `uapkg publish` is not in the CLI yet, so this step is
   currently inert and carries the intended command as a comment. Once the CLI implements
   publish, uncomment it. It relies on GitHub Actions **OIDC trusted publishing**
   (`id-token: write`), and falls back to a `UAPKG_TOKEN` PAT secret for the initial publish.

To publish a new version later: bump `version` in `uapkg.json`, commit, and push a matching
tag (e.g. `v0.2.0`).

## Setting up trusted publishing (for when `uapkg publish` lands)

Trusted publishing lets the workflow publish with a short-lived OIDC token instead of a
long-lived PAT. Rough setup (see the UAPKG spec §12):

1. Create a UAPKG account and complete MFA.
2. Do the **initial** publish of this package with a UAPKG PAT (OIDC can't publish a package
   that doesn't exist yet). Until the CLI has `publish`, this is a manual/registry step.
3. Link your GitHub account via the UAPKG GitHub User App and install it on this repo.
4. Create a trusted publisher rule binding:
   - `provider = github-actions`
   - owner `MaximDevoir`, repo `uapkg-dev-package-placeholder`
   - workflow file `publish.yml`
5. After that, `uapkg publish` runs in this workflow will auto-exchange the GitHub Actions
   OIDC token (`id-token: write` is already granted) — no secret needed.

Until trusted publishing is set up, use the PAT fallback documented in `publish.yml`
(`UAPKG_TOKEN` repo secret).

> This is a development/test artifact — not intended for real use.
