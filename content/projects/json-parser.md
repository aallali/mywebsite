---
title: "Zero-Copy JSON Parser"
date: 2025-05-18
type: projects
---

A JSON parser that avoids allocations by returning string slices into the original input.

## Design

- Hand-written recursive descent parser
- No intermediate AST allocation
- Lazy value parsing on access
- Supports streaming for large files

## Benchmark Results

Parsing 10MB JSON file:
- This parser: 12ms, 0 allocations
- serde_json: 45ms, ~50K allocations
- Standard lib: 89ms, ~150K allocations

## Trade-offs

Requires input to remain valid. Not suitable for all use cases, but perfect for high-throughput services.

Source: github.com/username/zero-json