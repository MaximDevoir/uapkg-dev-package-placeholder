# uapkg-dev-package-placeholder

A barebones Unreal Engine plugin for exercising the
[UAPKG](https://github.com/MaximDevoir/uapkg) release and publishing pipeline. The plugin
source does nothing meaningful; this repository is a deliberately flexible test fixture.

Nothing runs automatically on pushes or tags. Release creation, release deletion, and
registry publishing are separate manually dispatched workflows.

## Repository contents

| Path | Purpose |
|---|---|
| `uapkg.json` | UAPKG package manifest and package version. |
| `UapkgDevPlaceholder.uplugin` | Minimal Unreal plugin descriptor. |
| `Source/UapkgDevPlaceholder/` | Throwaway Unreal module boilerplate. |
| `.github/actions/setup-uapkg/` | Builds a selected UAPKG source branch once and exposes its CLI. |
| `.github/workflows/create-release.yml` | Packs and creates one or more GitHub Releases. |
| `.github/workflows/delete-github-releases.yml` | Deletes one or more releases and their tags. |
| `.github/workflows/publish-oidc.yml` | Publishes one existing release with GitHub Actions OIDC. |

Packed archives intentionally exclude Git metadata, GitHub workflows, toolchain checkouts,
caches, dependencies, and previously generated archives.

## UAPKG source setup

Both release creation and OIDC publishing build UAPKG directly from
`MaximDevoir/uapkg`. Their common inputs are:

- `uapkg_branch`: branch to build, defaulting to `main`.
- `uapkg_environment`: `development` (default) or `production`.

The selected environment is stamped into the CLI at build time:

| Environment | Account/API routing | Default registry source |
|---|---|---|
| `development` | `account-dev.uapkg.dev` / `api-dev.uapkg.dev` | `uapkg/registry-dev-tmp` |
| `production` | `account.uapkg.dev` / `api.uapkg.dev` | `uapkg/registry` |

The setup action resolves the branch to an exact commit, installs the pnpm version declared
by that source tree, performs a frozen install, and builds the CLI plus its runtime
dependencies. The pnpm store and build outputs are cached by the exact source commit and
environment, so repeated workflow runs do not rebuild unchanged UAPKG source.

## Create releases

Run **Create GitHub releases** from the Actions tab on `main`. The `versions` input accepts
one or more comma-separated SemVers without a leading `v`:

```text
0.2.0,0.3.0
```

The workflow validates the complete list and checks every requested release and tag before
creating anything. It builds UAPKG once, then performs the following cycle for each version:

1. Start from the same captured `main` commit.
2. Set `uapkg.json.version` and the `.uplugin` `VersionName`.
3. Keep the fixture's numeric `.uplugin` `Version` at `1`.
4. Pack and verify `uapkg-dev-package-placeholder-<version>.tgz` and its integrity sidecar.
5. Create an independent tag-only commit and annotated `v<version>` tag.
6. Push only the tag and create a GitHub Release with the two assets.

The default branch is never moved by a release run. A tag pushed by an interrupted run can
be resumed when it has no release and its commit contains only the expected version changes.
Completed earlier items remain available if a later item in the batch fails.

The numeric Unreal `Version` normally increases between real plugin releases. It remains
`1` here intentionally because this repository tests UAPKG release mechanics rather than
Unreal plugin upgrade ordering.

## Delete releases

Run **Delete GitHub releases and tags** on `main` with comma-separated SemVers or tags:

```text
v0.2.0,0.3.0
```

The workflow preflights the entire list, then deletes both the GitHub Release and its tag.
It also repairs partial states containing only a release or only a tag. Deletion is permanent;
use **Create GitHub releases** again to rebuild a deleted fixture from the current `main`.

## Publish with OIDC

Run **Publish release with OIDC** on `main` with one existing release version. The workflow:

1. Downloads the versioned archive and integrity sidecar from the GitHub Release.
2. Verifies the exact size and SHA-256 digest.
3. Builds the requested UAPKG branch and environment.
4. Checks the release tag's committed manifest versions.
5. Runs `uapkg publish --auth oidc` with the explicit tag, asset name, repository, and local
   archive path.

Before this can succeed, the UAPKG account must have active GitHub User App coverage for the
canonical package source and a trusted-publisher rule bound to:

- repository `MaximDevoir/uapkg-dev-package-placeholder`;
- workflow `publish-oidc.yml`;
- event `workflow_dispatch`;
- branch `main`, if the rule restricts refs;
- audience `uapkg`.

The workflow grants `id-token: write` and does not use a long-lived publishing secret.
Account-side trusted-publisher setup is intentionally outside this repository change.

## GAT and CLI login

There is no GAT publishing workflow. The current UAPKG security model requires an attended
TTY and a fresh TOTP for GAT publishing, so it deliberately rejects GAT in headless CI.
Persistent CLI login is also unsupported in CI. Automated publishing therefore uses OIDC.

> This repository and its releases are development fixtures, not production plugin builds.
