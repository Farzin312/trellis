# Rust Template

Rust has built-in testing via cargo — no config file needed.

## Testing

```bash
cargo test                # run all tests
cargo test -- --nocapture # show println output
cargo tarpaulin           # coverage (install: cargo install cargo-tarpaulin)
```

## Coverage Threshold

```bash
cargo tarpaulin --fail-under 80
```

## Mutation Testing

Use [cargo-mutants](https://github.com/sourcefrog/cargo-mutants):
```bash
cargo install cargo-mutants
cargo mutants
```

## Property Testing

Use [proptest](https://docs.rs/proptest) or [quickcheck](https://docs.rs/quickcheck):
```toml
[dev-dependencies]
proptest = "1"
```

## SDD Commands

SDD slash commands work in Rust projects — the spec/task templates are
language-agnostic. The `verify` phase calls `cargo test` instead of `vitest`.
