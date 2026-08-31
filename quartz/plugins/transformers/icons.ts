import { QuartzTransformerPlugin } from "../types"
import { Root, Text, Parent } from "mdast"
import { visit } from "unist-util-visit"
import * as lucide from "lucide-static"

export interface Options {
  /** CSS class put on the wrapping <span>. */
  className: string
}

const defaultOptions: Options = {
  className: "icon",
}

// :icon-name: — lowercase words joined by hyphens, e.g. :brain: or :circle-help:
const ICON_RE = /:([a-z][a-z0-9]*(?:-[a-z0-9]+)*):/g

function toExportName(kebab: string): string {
  return kebab
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("")
}

const cache = new Map<string, string | null>()
function lucideSvg(name: string): string | null {
  if (cache.has(name)) return cache.get(name)!
  const raw = (lucide as unknown as Record<string, unknown>)[toExportName(name)]
  const svg = typeof raw === "string" ? raw.trim() : ""
  const result = svg.startsWith("<svg") ? svg : null
  cache.set(name, result)
  return result
}

/**
 * Replaces `:icon-name:` in text with the matching Lucide icon as inline SVG.
 * Unknown names are left untouched. The icon becomes a custom mdast node with
 * no text value, so table-of-contents and description extraction ignore it.
 */
export const LucideIcons: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts: Options = { ...defaultOptions, ...userOpts }
  return {
    name: "LucideIcons",
    markdownPlugins() {
      return [
        () => (tree: Root) => {
          visit(tree, "text", (node: Text, index, parent: Parent | undefined) => {
            if (!parent || index === undefined) return
            const value = node.value
            if (!value.includes(":")) return

            const pieces: (Text | IconNode)[] = []
            let last = 0
            for (const m of value.matchAll(ICON_RE)) {
              const svg = lucideSvg(m[1])
              if (!svg) continue
              const start = m.index!
              if (start > last) pieces.push({ type: "text", value: value.slice(last, start) })
              pieces.push({
                type: "lucideIcon",
                data: {
                  hName: "span",
                  hProperties: { className: [opts.className, `icon-${m[1]}`], "aria-hidden": "true" },
                  hChildren: [{ type: "raw", value: svg }],
                },
              })
              last = start + m[0].length
            }
            if (pieces.length === 0) return
            if (last < value.length) pieces.push({ type: "text", value: value.slice(last) })
            parent.children.splice(index, 1, ...(pieces as Parent["children"]))
            return index + pieces.length
          })
        },
      ]
    },
  }
}

interface IconNode {
  type: "lucideIcon"
  data: {
    hName: string
    hProperties: Record<string, unknown>
    hChildren: { type: "raw"; value: string }[]
  }
}
