# Setup Skaffold

GitHub Action for installing Skaffold.

## Features

- Installs Skaffold on the host
- Supports installing a specific version of Skaffold

## Usage

```yaml
- uses: heypigeonhq/setup-skaffold@v1.0.0

  with:
    # Version of Skaffold to install. Only supports exact versions and
    # "latest". Defaults to latest.
    # Examples: 2.7.0
    version: ""
```
