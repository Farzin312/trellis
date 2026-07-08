# Go Template

Go has built-in testing — no config file needed.

## Testing

```bash
go test ./...              # run all tests
go test -cover ./...       # with coverage
go test -race ./...        # with race detector
```

## Coverage Threshold

Go doesn't enforce coverage thresholds natively. Use:
```bash
go test -coverprofile=coverage.out ./... && go tool cover -func=coverage.out | grep total | awk '{if ($3+0 < 80) exit 1}'
```

## Mutation Testing

Use [go-mutesting](https://github.com/AntonStoeckl/go-mutesting):
```bash
go install github.com/zimmski/go-mutesting/cmd/go-mutesting@latest
go-mutesting ./...
```

## Property Testing

Use [gopter](https://github.com/leanovate/gopter) or Go 1.18+ `testing/quick`:
```go
import "github.com/leanovate/gopter"
```

## SDD Commands

SDD slash commands work in Go projects — the spec/task templates are language-agnostic.
The `verify` phase calls `go test ./...` instead of `vitest`.
