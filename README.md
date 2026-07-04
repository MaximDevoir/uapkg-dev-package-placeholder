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

> This is a development/test artifact — not intended for real use.
