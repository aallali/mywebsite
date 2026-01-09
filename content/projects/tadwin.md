---
title: "Tadwin: The Minimalist Static Site Generator Portfolio & Blogger"
date: 2026-01-07
type: projects
description: "A custom-built, high-performance static site generator focusing on speed, SEO, and simplicity. Built with TypeScript."
tags: ["project", "typescript", "ssg", "web-dev", "performance", "open-source"]
keywords: ["Static Site Generator", "SSG", "TypeScript", "Web Performance", "SEO", "Custom Blog Engine"]
image: "/assets/tadwin-og.png"
---

## Introduction

In an era dominated by complex JavaScript frameworks and heavy client-side hydration, **Tadwin** (Arabic for "Codification" or "Writing") takes a step back to basics. It is a custom-built Static Site Generator (SSG) designed to do one thing perfectly: convert Markdown content into a blazing-fast, SEO-optimized website.

I built Tadwin to power this very portfolio, tired of the maintenance overhead of managing dependencies for frameworks like Gatsby or Next.js just to serve static text.

## The Philosophy: "Just Enough Software"

### For the Business Mind
Why build a custom tool instead of using WordPress or Medium?

```info
**Performance is King**: Tadwin generates pure HTML and CSS. There is **zero** client-side JavaScript bundle required for the core content. This results in perfect Lighthouse scores (100/100) and instant page loads, which directly correlates to better SEO ranking and user retention.
```

- **Cost Efficiency**: Since the output is static files, the entire site can be hosted for free on GitHub Pages, Netlify, or Vercel, or extremely cheaply on AWS S3/CloudFront.
- **Future Proofing**: Content is stored in standard Markdown. If Tadwin ever needs to be replaced, the content (the real value) is portable and vendor-neutral.
- **SEO First**: Automatic Sitemap, Robots.txt, and Open Graph meta tag generation ensure content is discoverable and looks great on social media.

### For the Engineers
Tadwin is written in **TypeScript** and runs on Node.js. It follows a predictable pipeline:

1.  **Ingestion**: Reads content from the file system.
2.  **Processing**: Parses Markdown (using `markdown-it`) and extracts Frontmatter metadata (using `gray-matter`).
3.  **Transformation**: Applies custom renderers for code blocks and callouts.
4.  **Generation**: Injects content into minimalist HTML templates.

#### Key Technical Features

```info
**Smart Asset Management**: 
I implemented an automated **Cache Busting** strategy. The build system calculates the MD5 hash of `style.css` during the build process and appends it as a query parameter (e.g., `style.css?v=abc12345`). This allows us to set aggressive long-term caching headers on the CDN while instantly propagating design changes to users.
```

- **Syntax Highlighting**: Uses `highlight.js` at **build time**. This means the specific colors and spans are baked into the HTML. I recently customized this to match the **VS Code Dark+** theme, giving code snippets a professional, familiar look without requiring client-side libraries to re-parse the DOM.
- **Custom Markdown Extensions**: The engine supports custom message blocks for better content structuring:
    - `info` blocks for technical notes.
    - `tip` blocks for best practices.
    - `warning` blocks for caveats.
    - `danger` blocks for critical alerts.

#### Architecture Snapshot

The core logic is surprisingly simple. Here's a glimpse of the configuration interface that drives the generator:

```typescript
interface Config {
  name: string;
  title: string;
  description: string;
  siteUrl: string;
  // ... SEO and Social configuration
  assets: {
    staticFiles: string[];
    metaFiles?: string[];
  };
  colors: {
    background: string;
    text: string;
    accent: string;
  };
}
```

## Results

By stripping away the "fat" of modern web development, Tadwin delivers a reading experience that respects the user's resources.

- **0ms** Input Latency.
- **<50ms** First Contentful Paint.
- **100/100** SEO Score.

It's a testament to the fact that sometimes, the best tool for the job is the one you craft yourself to fit your exact needs.
