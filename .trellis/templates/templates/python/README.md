# Python Template

Copied to project root when init.sh detects Python (requirements.txt or
pyproject.toml with no Node.js).

## Files

- `pytest.ini` — test runner with 80% coverage via pytest-cov
- `mutmut.ini` — mutation testing config

## Requirements

Add to requirements.txt or pyproject.toml:
```
pytest
pytest-cov
pytest-timeout
mutmut
hypothesis    # property-based testing (fast-check equivalent)
```

## Running Evals

```bash
pytest                    # unit + integration tests
mutmut run                # mutation testing
mutmut results            # view mutation score
```

Hypothesis (property testing) integrates directly into pytest — no separate runner.

## Adjust paths

Edit `paths_to_mutate` in mutmut.ini and `--cov=` in pytest.ini to match your
source directory (src/, app/, package_name/, etc.).
