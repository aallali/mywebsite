---
title: "Cache-Oblivious Data Structures for Modern Hardware"
date: 2023-08-15
type: papers
---

## Abstract

This paper introduces cache-oblivious variants of common data structures that perform optimally across memory hierarchies without explicit cache-size knowledge.

## Introduction

Modern processors feature multiple cache levels with varying sizes and latencies. Traditional algorithms assume specific cache parameters, limiting portability.

## Background

### Memory Hierarchy

- L1 cache: ~32KB, 1-4 cycles
- L2 cache: ~256KB, 10-20 cycles  
- L3 cache: ~8MB, 40-75 cycles
- Main memory: ~16GB, 200+ cycles

## Proposed Structures

We present cache-oblivious implementations of:
1. B-trees with optimal I/O complexity
2. Priority queues with amortized O(1/B log N/B) operations
3. Hash tables with O(1) expected access time

## Analysis

Theoretical analysis shows our structures achieve optimal cache complexity:
- Scanning: O(N/B)
- Searching: O(log_B N)
- Sorting: O(N/B log_{M/B} N/B)

## Experimental Results

Implementations tested on Intel and ARM architectures show 15-30% performance improvement over cache-aware counterparts.