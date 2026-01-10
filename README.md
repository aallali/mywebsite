# Tadwin (تدوين)

> **Tadwin** (تدوين) - *"blogging" in Arabic*

A minimalist, forkable static site generator by **[Remal](https://remal.dev)**. Designed as a sustainable foundation for your personal portfolio and blog--fork it, own your content, and pull updates as we improve the core.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-25.0.3-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

## Preview
![@remaldev/tadwin Blog](.github/tadwin-preview.gif)


## Philosophy

**Text survives, animations rot.**
- **Zero Client-Side JS**: Optional minimal scripts for pure UX.
- **Pure Static HTML**: Blazing fast, hack-proof, SEO-ready.
- **Markdown Centric**: Your content is portable and future-proof.
- **Fork-First**: Built to be your codebase, not a black-box dependency.

## Usage Workflow

### 1. Start via Fork
Fork this repository to your own GitHub account to start your journey.

```bash
git clone https://github.com/YOUR_USERNAME/tadwin.git
cd tadwin
```

### 2. Execution

```bash
# Development (Hot Reload) -> http://localhost:3013
docker compose --profile dev up

# Production (Nginx + Traefik Support)
docker compose --profile prod up -d
```

### 3. Customization
- **Config**: Update `config.json` with your details.
- **Content**: Add Markdown to `content/{articles,papers,projects}/`.
- **Updates**: `git fetch upstream && git merge upstream/main`

## Structure
Kept clean to focus on what matters.
```
.
├── config.json       # Your site configuration
├── content/          # Your compiled Markdown files
├── templates/        # HTML themes & minimal CSS
├── src/              # The build engine (TypeScript)
├── docker/           # Docker environments
└── public/           # Static output (git-ignored)
```

---

Made with ❤️ by [Remal](https://github.com/remaldev)
