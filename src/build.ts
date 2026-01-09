import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import hljs from "highlight.js";
import MarkdownIt from "markdown-it";

interface Config {
  name: string;
  title: string;
  description: string;
  email: string;
  github: string;
  twitter?: string;
  linkedin: string;
  siteUrl: string;
  author: string;
  profileImage: string;
  ogImage: string;
  wordsPerMinute: number;
  socialLinks: {
    github: string;
    twitter: string;
    linkedin: string;
  };
  authors?: {
    [key: string]: {
      name: string;
      url: string;
    };
  };
  sections: string[];
  showSponsorBlocks: boolean;
  assets: {
    staticFiles: string[];
    metaFiles?: string[];
  };
  colors: {
    background: string;
    text: string;
    textSecondary: string;
    accent: string;
  };
}

interface Post {
  title: string;
  date: string;
  modified?: string;
  type: string;
  path: string;
  readingTime: number;
  image?: string;
  author?: string;
  authorId?: string;
  tags?: string[];
  excerpt?: string;
}

interface SEOData {
  title?: string;
  description?: string;
  excerpt?: string;
  image?: string;
  author?: string;
  date?: string;
  modified?: string;
  tags?: string[];
  keywords?: string;
  [key: string]: string | string[] | undefined;
}

interface StructuredData {
  "@context": string;
  "@type": string;
  headline?: string;
  description?: string;
  author?: { "@type": string; name: string; url: string };
  datePublished?: string;
  dateModified?: string;
  url?: string;
  image?: string;
  keywords?: string;
  name?: string;
}

const config: Config = JSON.parse(fs.readFileSync("../config.json", "utf8"));

// Directory constants
const CONTENT_DIR = "../content";
const OUTPUT_DIR = "../public";
const TEMPLATES_DIR = "../templates";

const cssContent = fs.readFileSync(`${TEMPLATES_DIR}/style.css`, "utf8");
const cssHash = crypto
  .createHash("md5")
  .update(cssContent)
  .digest("hex")
  .substring(0, 8);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Custom Task List Plugin
md.core.ruler.push("task_lists", (state) => {
  const tokens = state.tokens;
  for (let i = 2; i < tokens.length; i++) {
    if (tokens[i].type !== "inline" || !tokens[i].content) {
      continue;
    }

    const content = tokens[i].content;
    const isTaskItem = content.startsWith("[ ] ") || content.startsWith("[x] ");

    if (isTaskItem) {
      const isChecked = content.startsWith("[x] ");

      // Remove the marker from the content
      tokens[i].content = content.slice(4);
      if (tokens[i].children) {
        tokens[i].children![0].content =
          tokens[i].children![0].content.slice(4);
      }

      // Create checkbox token using state.Token constructor
      const checkboxToken = new state.Token("html_inline", "", 0);
      checkboxToken.content = `<input type="checkbox" disabled ${
        isChecked ? 'checked=""' : ""
      } class="task-list-item-checkbox"> `;

      // Insert checkbox before the text
      if (tokens[i].children) {
        tokens[i].children!.unshift(checkboxToken);
      }

      // Find parent list item and add class
      let j = i - 1;
      while (j >= 0) {
        if (tokens[j].type === "list_item_open") {
          const cls = tokens[j].attrGet("class") || "";
          tokens[j].attrSet("class", `${cls} task-list-item`.trim());
          break;
        }
        j--;
      }

      // Find parent unordered list and add class
      while (j >= 0) {
        if (tokens[j].type === "bullet_list_open") {
          const cls = tokens[j].attrGet("class") || "";
          if (!cls.includes("contains-task-list")) {
            tokens[j].attrSet("class", `${cls} contains-task-list`.trim());
          }
          break;
        }
        j--;
      }
    }
  }
});

md.set({
  highlight: (str: string, lang: string): string => {
    // Regular code highlighting
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre><code class="hljs language-${lang}">${
          hljs.highlight(str, { language: lang }).value
        }</code></pre>`;
      } catch {}
    }
    return `<pre><code class="hljs">${escapeHtml(str)}</code></pre>`;
  },
});

md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const info = token.info ? md.utils.unescapeAll(token.info).trim() : "";
  const lang = info.split(/\s+/g)[0];

  if (["warning", "info", "tip", "danger"].includes(lang)) {
    const iconMap: Record<string, string> = {
      warning: "⚠️",
      info: "ℹ️",
      tip: "💡",
      danger: "🚨",
    };
    const title = lang.charAt(0).toUpperCase() + lang.slice(1);
    return `<div class="${lang}-block"><div class="${lang}-title">${
      iconMap[lang]
    } ${title}</div><div class="${lang}-content">${md.render(
      token.content
    )}</div></div>`;
  }

  // Standard fence rendering logic
  let highlighted = "";
  if (options.highlight) {
    highlighted =
      options.highlight(token.content, lang, "") ||
      md.utils.escapeHtml(token.content);
  } else {
    highlighted = md.utils.escapeHtml(token.content);
  }

  if (highlighted.indexOf("<pre") === 0) {
    return `${highlighted}\n`;
  }

  return `<pre><code${self.renderAttrs(token)}>${highlighted}</code></pre>\n`;
};

md.renderer.rules.heading_open = (tokens, idx) => {
  const token = tokens[idx];
  const nextToken = tokens[idx + 1];
  if (nextToken && nextToken.type === "inline" && nextToken.content) {
    const match = nextToken.content.match(/^(.+?)\s*\{#([^}]+)\}\s*$/);
    if (match) {
      nextToken.content = match[1].trim();
      if (nextToken.children?.[0]) {
        nextToken.children[0].content = match[1].trim();
      }
      return `<${token.tag} id="${match[2]}">`;
    }
  }
  return `<${token.tag}>`;
};

const BASE = fs.readFileSync(`${TEMPLATES_DIR}/base.html`, "utf8");
const PAGE = fs.readFileSync(`${TEMPLATES_DIR}/page.html`, "utf8");
const LIST = fs.readFileSync(`${TEMPLATES_DIR}/list.html`, "utf8");
const HOME = fs.readFileSync(`${TEMPLATES_DIR}/home.html`, "utf8");

function render(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (out, [k, v]) => out.replaceAll(`{{${k}}}`, v),
    template
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(date: string) {
  return new Date(date).toISOString().split("T")[0];
}

function formatDateTime(date: string | Date): {
  date: string;
  time: string;
  hasTime: boolean;
} {
  const dateStr = typeof date === "string" ? date : date.toISOString();
  const d = new Date(dateStr);
  const hasTime = dateStr.includes("T") || dateStr.includes(":");

  // Format: "09:00, Monday September 15, 2025"
  const timeStr = hasTime
    ? d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  const dateFormatted = d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fullDate = hasTime ? `${timeStr}, ${dateFormatted}` : dateFormatted;

  return {
    date: fullDate,
    time: d.toISOString(), // ISO for datetime attribute
    hasTime,
  };
}

function calculateReadingTime(text: string) {
  return Math.ceil(text.trim().split(/\s+/).length / config.wordsPerMinute);
}

function slugify(filename: string) {
  return filename
    .replace(/^\d{4}[-_]\d{2}[-_]\d{2}[-_]/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isExternalUrl(url: string): boolean {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("//")
  );
}

function copyAsset(sourcePath: string, destPath: string): void {
  // Check if path contains wildcards
  if (sourcePath.includes("*") || sourcePath.includes("?")) {
    const dir = path.dirname(sourcePath);
    const pattern = path.basename(sourcePath);

    if (!fs.existsSync(dir)) {
      console.warn(`⚠ Directory not found: ${dir}`);
      return;
    }

    const files = fs.readdirSync(dir);
    const regex = new RegExp(
      `^${pattern.replace(/\*/g, ".*").replace(/\?/g, ".")}$`
    );
    const matches = files.filter((file) => regex.test(file));

    if (matches.length === 0) {
      console.warn(`⚠ No files matching pattern: ${sourcePath}`);
      return;
    }

    for (const file of matches) {
      const fileSource = path.join(dir, file);
      const fileDest = path.join(path.dirname(destPath), file);
      copyAsset(fileSource, fileDest);
    }
    return;
  }

  if (fs.existsSync(sourcePath)) {
    const stat = fs.statSync(sourcePath);
    if (stat.isDirectory()) {
      // Copy entire directory
      fs.mkdirSync(destPath, { recursive: true });
      const files = fs.readdirSync(sourcePath);
      for (const file of files) {
        copyAsset(path.join(sourcePath, file), path.join(destPath, file));
      }
      console.log(`✓ Copied directory: ${sourcePath} → ${destPath}`);
    } else {
      // Copy single file
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✓ Copied: ${sourcePath} → ${destPath}`);
    }
  } else {
    console.warn(`⚠ Asset not found: ${sourcePath}`);
  }
}

function generateTOC(content: string): { toc: string; content: string } {
  const headings: Array<{ level: number; text: string; id: string }> = [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  const idCounts: Record<string, number> = {};

  match = headingRegex.exec(content);
  while (match !== null) {
    const level = match[1].length;
    const text = match[2];
    let id = slugifyHeading(text);
    
    // Make IDs unique by appending counter if duplicate
    if (idCounts[id] !== undefined) {
      idCounts[id]++;
      id = `${id}-${idCounts[id]}`;
    } else {
      idCounts[id] = 0;
    }
    
    headings.push({ level, text, id });
    match = headingRegex.exec(content);
  }

  if (headings.length === 0) {
    return { toc: "", content };
  }

  let tocHtml = "";
  let prevLevel = 2;

  for (const [i, h] of headings.entries()) {
    if (h.level === 2) {
      if (i > 0 && prevLevel === 3) {
        tocHtml += "</ul></li>\n";
      } else if (i > 0) {
        tocHtml += "</li>\n";
      }
      tocHtml += `<li><a href="#${h.id}">${h.text}</a>`;
    } else if (h.level === 3) {
      if (prevLevel === 2) {
        tocHtml += "\n<ul>\n";
      }
      tocHtml += `<li><a href="#${h.id}">${h.text}</a></li>\n`;
    }
    prevLevel = h.level;
  }

  if (prevLevel === 3) {
    tocHtml += "</ul></li>";
  } else {
    tocHtml += "</li>";
  }

  const toc = `<nav class="toc"><h2>Table of Contents</h2><ul>\n${tocHtml}\n</ul></nav>`;

  let updatedContent = content;
  for (const h of headings) {
    const pattern = new RegExp(
      `^#{${h.level}}\\s+${h.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "m"
    );
    updatedContent = updatedContent.replace(
      pattern,
      `${"#".repeat(h.level)} ${h.text} {#${h.id}}`
    );
  }

  return { toc, content: updatedContent };
}

function generateSEO(data: SEOData, fullUrl: string, isArticle = false) {
  const description = data.excerpt || data.description || config.description;

  const cssVars = `<style>:root{--bg:${config.colors.background};--text:${config.colors.text};--text-secondary:${config.colors.textSecondary};--accent:${config.colors.accent};}</style>`;

  const seo: Record<string, string> = {
    title: data.title || config.name,
    description,
    author: data.author || config.author,
    url: fullUrl,
    name: config.name,
    year: new Date().getFullYear().toString(),
    ogType: isArticle ? "article" : "website",
    siteName: config.name,
    favicon: "/favicon.ico",
    appleTouchIcon: "/assets/apple-touch-icon.png",
    webManifest: "/site.webmanifest",
    keywords: data.keywords
      ? `<meta name="keywords" content="${data.keywords}" />`
      : "",
    canonical: `<link rel="canonical" href="${fullUrl}" />`,
    ogLocale: `<meta property="og:locale" content="en_US" />`,
    ogImage: "",
    ogImageWidth: "",
    ogImageHeight: "",
    twitterImage: "",
    twitterCreator: "",
    publishDate: data.date
      ? `<meta property="article:published_time" content="${data.date}" />`
      : "",
    modifiedDate: data.modified
      ? `<meta property="article:modified_time" content="${data.modified}" />`
      : "",
    articleAuthor: "",
    structuredData: "",
    cssVars,
    cssHash,
  };

  // For articles: only include image if post explicitly defines one
  // For non-articles: use site's OG image
  if (isArticle && data.image) {
    let image = data.image;
    if (!isExternalUrl(image)) {
      image = `${config.siteUrl}${image}`;
    }
    seo.ogImage = `<meta property="og:image" content="${image}" />`;
    seo.ogImageWidth = `<meta property="og:image:width" content="1200" />`;
    seo.ogImageHeight = `<meta property="og:image:height" content="630" />`;
    seo.twitterImage = `<meta name="twitter:image" content="${image}" />`;
  } else if (!isArticle) {
    let image = config.ogImage;
    if (!isExternalUrl(image)) {
      image = `${config.siteUrl}${image}`;
    }
    seo.ogImage = `<meta property="og:image" content="${image}" />`;
    seo.ogImageWidth = `<meta property="og:image:width" content="1200" />`;
    seo.ogImageHeight = `<meta property="og:image:height" content="630" />`;
    seo.twitterImage = `<meta name="twitter:image" content="${image}" />`;
  }

  if (isArticle && data.date) {
    const structuredDataObj: StructuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: data.title,
      description,
      author: { "@type": "Person", name: seo.author, url: config.siteUrl },
      datePublished: data.date,
      dateModified: data.modified || data.date,
      url: fullUrl,
    };

    if (data.image) {
      let image = data.image;
      if (!isExternalUrl(image)) {
        image = `${config.siteUrl}${image}`;
      }
      structuredDataObj.image = image;
    }

    if (data.tags && data.tags.length > 0) {
      structuredDataObj.keywords = data.tags.join(", ");
    }
    seo.structuredData = `<script type="application/ld+json">${JSON.stringify(
      structuredDataObj
    )}</script>`;
  } else if (!isArticle && fullUrl === config.siteUrl) {
    seo.structuredData = `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: config.name,
      description: config.description,
      url: config.siteUrl,
      author: { "@type": "Person", name: config.author, url: config.siteUrl },
    })}</script>`;
  }

  return seo;
}

function buildFile(filePath: string, allPosts?: Post[]): Post | null {
  const { data, content } = matter(fs.readFileSync(filePath, "utf8"));

  if (data.active === false) return null;

  const { toc, content: contentWithIds } = generateTOC(content);
  const body = md.render(contentWithIds);
  const readingTime = calculateReadingTime(content);
  const slug = slugify(path.basename(filePath, ".md"));
  const directory = path.dirname(filePath).replace(CONTENT_DIR, OUTPUT_DIR);
  const outPath = path.join(directory, `${slug}.html`);
  const relPath = `/${outPath.replace(`${OUTPUT_DIR}/`, "")}`;
  const fullUrl = `${config.siteUrl}${relPath}`;

  const modifiedDate = data.modified ? formatDate(data.modified) : null;
  const modifiedMeta = modifiedDate
    ? `<span class="separator">•</span><span class="modified-date" title="Last updated">Updated: ${modifiedDate}</span>`
    : "";

  const dateTime = formatDateTime(data.date);

  // Resolve author from authorId
  let authorData = null;
  let authorName = data.author || config.author;

  if (data.author && config.authors && config.authors[data.author]) {
    authorData = config.authors[data.author];
    authorName = authorData.name;
  } else if (!data.author) {
    // Default to owner with LinkedIn
    const linkedinUrl = config.socialLinks.linkedin.replace("{username}", config.linkedin);
    authorData = {
      name: config.name,
      url: linkedinUrl,
    };
    authorName = config.name;
  }

  const authorMeta = authorData
    ? `<span class="separator">•</span><span class="author-info">By <a href="${authorData.url}" class="author-link" target="_blank" rel="noopener">${authorData.name}</a></span>`
    : "";

  // Generate more_articles with other articles
  let more_articles_html = "";
  if (allPosts && allPosts.length > 0) {
    const otherPosts = allPosts
      .filter(p => p.path !== relPath && p.type === data.type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    if (otherPosts.length > 0) {
      const more_articles_items = otherPosts
        .map(p => `<li><a href="${p.path}">${p.title}</a><div class="more_articles-meta">${p.readingTime} min read</div></li>`)
        .join("");
      more_articles_html = `<div class="more_articles"><h3>More ${data.type}</h3><ul>${more_articles_items}</ul></div>`;
    }
  }

  const page = render(PAGE, {
    title: data.title,
    date: dateTime.date,
    datetime: dateTime.time,
    modified: modifiedMeta,
    author: authorMeta,
    toc,
    body,
    type: data.type,
    readingTime: readingTime.toString(),
    url: fullUrl,
    image: data.image
      ? `<img src="${data.image}" alt="${data.title}" style="max-width: 100%; max-height: 400px; display: block; margin: 0 auto 1.5rem auto; border-radius: 4px;" />`
      : "",
    sponsorTop: config.showSponsorBlocks
      ? '<div class="sponsor-block"></div>'
      : "",
    sponsorBottom: config.showSponsorBlocks
      ? '<div class="sponsor-block"></div>'
      : "",
    more_articles: more_articles_html,
  });

  const html = render(BASE, {
    ...generateSEO(
      {
        ...data,
        date: data.date,
        modified: data.modified,
        image: data.image,
        author: authorName,
        tags: data.tags,
        excerpt: data.excerpt,
      },
      fullUrl,
      true
    ),
    content: page,
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);

  return {
    title: data.title,
    date: formatDate(data.date),
    modified: data.modified ? formatDate(data.modified) : undefined,
    type: data.type,
    path: relPath,
    readingTime,
    image: data.image,
    author: authorName,
    authorId: data.author,
    tags: data.tags,
    excerpt: data.excerpt,
  };
}

function walk(dir: string, posts: Post[] = []): Post[] {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full, posts);
    } else if (full.endsWith(".md")) {
      const post = buildFile(full);
      if (post) posts.push(post);
    }
  }
  return posts;
}

function buildIndex(posts: Post[], type: string) {
  const filtered = posts
    .filter((p) => p.type === type)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const items = filtered
    .map((p) => {
      const postDate = new Date(p.date);
      const isNew = postDate > oneDayAgo;
      const newTag = isNew ? `<span class="new-tag">NEW</span>` : "";
      const modifiedDate = p.modified
        ? `<span class="list-modified">${p.modified}</span>`
        : "";
      const dateDisplay = formatDate(p.date);
      return `<li><time datetime="${p.date}">${dateDisplay}</time><a href="${p.path}">${p.title}</a>${newTag}${modifiedDate}<span class="list-reading-time">${p.readingTime} min read</span></li>`;
    })
    .join("\n");

  const listHtml = render(LIST, {
    items,
    type: capitalize(type),
    count: filtered.length.toString(),
    sponsorTop: config.showSponsorBlocks
      ? '<div class="sponsor-block"></div>'
      : "",
    sponsorBottom: config.showSponsorBlocks
      ? '<div class="sponsor-block"></div>'
      : "",
  });

  const html = render(BASE, {
    ...generateSEO(
      {
        title: `${capitalize(type)} - ${config.name}`,
        description: `Browse all ${type} posts by ${config.author}. ${filtered.length} articles covering various topics.`,
      },
      `${config.siteUrl}/${type}/`
    ),
    content: listHtml,
  });

  const fullPath = path.join(OUTPUT_DIR, type, "index.html");
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, html);
}

function buildSocialLink(platform: string, username?: string) {
  if (!username) return null;
  const url = config.socialLinks[
    platform as keyof typeof config.socialLinks
  ].replace("{username}", username);
  return `    <a href="${url}">${url.replace("https://", "")}</a>`;
}

function generateSitemap(posts: Post[]) {
  const urls: Array<{
    loc: string;
    priority: string;
    changefreq: string;
    lastmod?: string;
  }> = [
    { loc: config.siteUrl, priority: "1.0", changefreq: "weekly" },
    ...config.sections.map((section) => ({
      loc: `${config.siteUrl}/${section}/`,
      priority: "0.8",
      changefreq: "daily",
    })),
    ...posts.map((post) => ({
      loc: `${config.siteUrl}${post.path}`,
      lastmod: post.date,
      priority: "0.6",
      changefreq: "monthly",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>${
      url.lastmod
        ? `
    <lastmod>${url.lastmod}</lastmod>`
        : ""
    }
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  fs.writeFileSync(`${OUTPUT_DIR}/sitemap.xml`, xml);
}

function generateRobotsTxt() {
  const template = fs.readFileSync(`${TEMPLATES_DIR}/robots.txt`, "utf-8");
  const robotsTxt = template.replace(/{{siteUrl}}/g, config.siteUrl);
  fs.writeFileSync(`${OUTPUT_DIR}/robots.txt`, robotsTxt);
}

// Build
if (process.env.NODE_ENV !== "dev") {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// First pass: build all files to collect post metadata
const posts = walk(CONTENT_DIR);

// Second pass: rebuild files with more_articles data
function rebuild_with_more_articles(dir: string) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      rebuild_with_more_articles(full);
    } else if (full.endsWith(".md")) {
      buildFile(full, posts);
    }
  }
}
rebuild_with_more_articles(CONTENT_DIR);

// Copy assets folder if it exists
const assetsSourcePath = path.join(TEMPLATES_DIR, "assets");
const assetsDestPath = path.join(OUTPUT_DIR, "assets");
if (fs.existsSync(assetsSourcePath)) {
  console.log("\nCopying assets folder...");
  copyAsset(assetsSourcePath, assetsDestPath);
}

// Copy static files if they exist
if (config.assets?.staticFiles) {
  console.log("\nCopying static assets...");
  for (const file of config.assets.staticFiles) {
    const sourcePath = path.join(TEMPLATES_DIR, file);
    const destPath = path.join(OUTPUT_DIR, file);
    copyAsset(sourcePath, destPath);
  }
}

// Copy meta files (favicon, manifest, robots, etc.)
if (config.assets?.metaFiles) {
  console.log("\nCopying meta files...");
  for (const file of config.assets.metaFiles) {
    const sourcePath = path.join(TEMPLATES_DIR, file);
    const destPath = path.join(OUTPUT_DIR, file);
    copyAsset(sourcePath, destPath);
  }
}

// Build section indexes
for (const section of config.sections) {
  buildIndex(posts, section);
}

// Build home page
const homeHtml = render(HOME, {
  name: config.name,
  title: config.title,
  profileImage: config.profileImage,
  items: config.sections
    .map((type) => `<li><a href="/${type}/">${capitalize(type)}</a></li>`)
    .join("\n"),
  social: [
    buildSocialLink("github", config.github),
    buildSocialLink("twitter", config.twitter),
    buildSocialLink("linkedin", config.linkedin),
    config.email
      ? `<a href="mailto:${config.email}">${config.email}</a>`
      : null,
  ]
    .filter(Boolean)
    .join("\n"),
});

const mainHtml = render(BASE, {
  ...generateSEO(
    { title: config.name, description: config.description },
    config.siteUrl
  ),
  content: homeHtml,
});

fs.writeFileSync(`${OUTPUT_DIR}/index.html`, mainHtml);

// Generate SEO files
generateSitemap(posts);
generateRobotsTxt();
