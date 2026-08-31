import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Nobodxyz Brain",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "ko-KR",
    baseUrl: "nobodxyz-brain.vercel.app",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Noto Sans KR",
        body: "Noto Sans KR",
        code: "IBM Plex Mono",
      },
      // Always light: darkMode mirrors lightMode so the OS dark preference is ignored.
      // Body text #2a2d31 on #faf9f6 ≈ 13.5:1 — higher contrast reads faster.
      colors: {
        lightMode: {
          light: "#faf9f6",
          lightgray: "#e3e0d8",
          gray: "#8f8a7e",
          darkgray: "#2a2d31",
          dark: "#14161a",
          secondary: "#0b6e4f",
          tertiary: "#8a4baf",
          highlight: "rgba(11, 110, 79, 0.10)",
          textHighlight: "#fff3bf",
        },
        darkMode: {
          light: "#faf9f6",
          lightgray: "#e3e0d8",
          gray: "#8f8a7e",
          darkgray: "#2a2d31",
          dark: "#14161a",
          secondary: "#0b6e4f",
          tertiary: "#8a4baf",
          highlight: "rgba(11, 110, 79, 0.10)",
          textHighlight: "#fff3bf",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      // ```d2 blocks → inline SVG at build time (auto layout, no client JS)
      Plugin.D2Diagrams({ layout: "elk", themeID: 1, maxWidth: 560, scale: 0.85, sketch: true }),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // CustomOgImages disabled to speed up build time
    ],
  },
}

export default config
