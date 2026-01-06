---
# Required Fields
title: "Your Post Title Here"
date: 2026-01-04
type: section_name

# Optional Metadata
modified: 2026-01-05
description: "A brief description of your post for SEO and social media sharing"
excerpt: "Custom excerpt that overrides description for social media previews"
keywords: "seo, keywords, comma, separated"

# Custom Image & Author
image: /images/post-cover.jpg
author: Custom Author Name

# Tags (array format)
tags: [web, development, tutorial, javascript]

# Visibility Control
active: false
---

## Introduction

Start your content here. This template shows all supported frontmatter fields.

## Why Markdown Works

### Plain Text Benefits

Your content goes here with proper headings for table of contents.

### Version Control Friendly

More content with hierarchical structure.

## Code Examples

```javascript
function example() {
  console.log("Syntax highlighting works!");
}
```

## Tables

| Feature | Support |
| ------- | ------- |
| Tables  | ✓       |
| Code    | ✓       |
| TOC     | ✓       |

## Conclusion

Your closing thoughts.

---

## Metadata Field Descriptions

### Required Fields:

- **title**: Post title (used in <title>, h1, and social media)
- **date**: Publication date (YYYY-MM-DD format)
- **type**: Content type (blog, papers, or projects)

### Optional Fields:

- **modified**: Last update date (adds "Updated: date" badge in listing and post)
- **description**: SEO meta description and Open Graph description
- **excerpt**: Overrides description for social media sharing
- **keywords**: SEO keywords (comma-separated string)
- **image**: Custom cover image path for Open Graph (default: /og-image.png)
- **author**: Override default author name
- **tags**: Array of tags for categorization and structured data
- **active**: Set to false to hide post from listings and builds

### Notes:

- Remove this file or set `active: false` before deploying
- Use ## and ### headings for automatic table of contents generation
- Modified date shows "✱ Updated" badge in post listings
- Tags appear in JSON-LD structured data for SEO
