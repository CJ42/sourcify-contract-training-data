# sourcify-contract-training-data

Tooling to collect verified smart-contract data from [Sourcify](https://sourcify.dev/) for use as training data.

## Requirements

- Python 3.10+
- `pip` (bundled with Python)

Verify your Python version:

```bash
python3 --version
```

## Installation

On macOS (Homebrew Python) and many Linux distributions, the system Python is "externally managed" (PEP 668), so installing packages globally with `pip` is blocked. Use a virtual environment instead.

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/sourcify-contract-training-data.git
cd sourcify-contract-training-data
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

On Windows (PowerShell):

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Once activated, your shell prompt should be prefixed with `(.venv)`.

### 3. Install dependencies

```bash
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
```

### 4. Verify the installation

```bash
python3 -c "import requests; print(requests.__version__)"
```

## Running

```bash
python3 main.py
```

## Deactivating the virtual environment

When you are done working, deactivate the venv with:

```bash
deactivate
```

## Dependencies

| Package    | Purpose                                |
| ---------- | -------------------------------------- |
| `requests` | HTTP client used to query the Sourcify API |

Pinned versions live in [`requirements.txt`](./requirements.txt).

## Troubleshooting

### `error: externally-managed-environment`

This means you tried to `pip install` against the system Python. Always activate the project's virtual environment first:

```bash
source .venv/bin/activate
```

Then re-run the install command. Avoid `--break-system-packages`; it can corrupt your system Python.

---

# Steps

- [ ] 1. count how many files in "sources"
- [ ] 2. define the storage layout from the storage slots and draw a diagram out of it extract from "storageLayout"
- [ ] 3. extract the type of proxy looking at `proxyResolution`
- [ ] 4. extract from each file the pragma statement used
- [ ] 5. analyse the OZ imports / common libs imported