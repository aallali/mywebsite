---
title: "Embedded Key-Value Store"
date: 2024-08-22
type: projects
---

A simple embedded database inspired by SQLite and LevelDB.

## Architecture

- Log-structured merge tree (LSM)
- Write-ahead logging for durability
- Block-based compression
- MVCC for concurrent reads

## API

```rust
let db = KVStore::open("data.db")?;
db.put(b"key", b"value")?;
let value = db.get(b"key")?;
db.delete(b"key")?;
```

```js
const name = "aaaaa"
console.log(name);
const { log } = console;
function main() {
    return 0;
}
```

```diff
+ asgasg
- gsdgsh
```
## Use Cases

- Application config storage
- Local caching layer  
- Embedded analytics
- Desktop app databases

## Status

Production-ready. Used in 3 commercial products.

Source: github.com/username/kvstore