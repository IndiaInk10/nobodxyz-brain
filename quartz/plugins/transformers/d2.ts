import { QuartzTransformerPlugin } from "../types"
import { Root, Code, Html } from "mdast"
import { visit } from "unist-util-visit"
import { D2 } from "@terrastruct/d2"

export interface Options {
  /** Layout engine. ELK gives cleaner results for containers and CJK labels. */
  layout: "elk" | "dagre"
  /** D2 theme id (0 = Neutral default, 1 = Neutral grey, ...). */
  themeID: number
  /** Padding in px around the diagram. */
  pad: number
  /** D2 source prepended to every diagram (shared classes, vars). */
  prelude: string
  /** Diagrams wider than this (px) are scaled down proportionally. */
  maxWidth: number
  /** Extra scale applied to every diagram (1 = D2's natural size). */
  scale: number
  /** Hand-drawn rendering. */
  sketch: boolean
}

const defaultOptions: Options = {
  layout: "elk",
  themeID: 1,
  pad: 12,
  maxWidth: 640,
  scale: 0.85,
  sketch: false,
  prelude: `
# shared defaults: body-sized type, light fills, smaller container titles
**.style.font-size: 15
**.style.fill: "#ffffff"
**.style.stroke: "#8f8b82"
*.style.font-size: 17
*.style.fill: "#f3f1ea"
(** -> **)[*].style.font-size: 13
(** -> **)[*].style.stroke: "#4e4e4e"
classes: {
  good: { style.stroke: "#0b6e4f"; style.font-color: "#0b6e4f"; style.stroke-width: 2 }
  bad: { style.stroke: "#c0392b"; style.font-color: "#c0392b"; style.stroke-width: 2 }
  accent: { style.stroke: "#0b6e4f"; style.stroke-width: 2 }
  muted: { style.stroke: "#b5b1a6"; style.font-color: "#6a737d" }
}
`,
}

type D2Internal = { worker?: { terminate?: () => void } }

let instance: D2 | undefined
let idleTimer: NodeJS.Timeout | undefined

/**
 * The D2 WASM worker keeps the Node event loop alive, which would hang
 * `quartz build`. Reuse one instance across files, but only schedule the
 * worker shutdown AFTER rendering finishes — arming the timer while a
 * render is in flight can kill the worker mid-compile (slow cold WASM on
 * CI) and leave its promise pending forever.
 */
function getD2(): D2 {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = undefined
  }
  if (!instance) instance = new D2()
  return instance
}

function scheduleShutdown(): void {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    ;(instance as unknown as D2Internal | undefined)?.worker?.terminate?.()
    instance = undefined
    idleTimer = undefined
  }, 2000)
  idleTimer.unref()
}

/**
 * D2 emits a root <svg> with only a viewBox, which browsers stretch to the
 * container width. Add explicit width/height so it renders at natural size
 * (CSS still caps it at max-width: 100%).
 */
function sizeFromViewBox(svg: string, maxWidth: number, scale: number): string {
  const trimmed = svg.trim()
  const start = trimmed.indexOf("<svg")
  const end = trimmed.indexOf(">", start)
  if (start < 0 || end < 0) return trimmed
  const rootTag = trimmed.slice(start, end)
  const m = rootTag.match(/viewBox="[\d.\s-]*?([\d.]+) ([\d.]+)"\s*$/) ??
    rootTag.match(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/)
  if (!m) return trimmed
  const [vw, vh] = [Number(m[1]), Number(m[2])]
  if (!vw || !vh) return trimmed
  // Never shrink below 0.8: text stays legible and wide diagrams scroll instead.
  const factor = Math.max(Math.min(scale, maxWidth / vw), 0.8)
  const [w, h] = [Math.round(vw * factor), Math.round(vh * factor)]
  return `${trimmed.slice(0, start)}<svg width="${w}" height="${h}"${trimmed.slice(start + 4)}`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * Renders ```d2 fenced code blocks to inline SVG at build time using the
 * official D2 WASM build. No client-side JavaScript is needed.
 */
export const D2Diagrams: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts: Options = { ...defaultOptions, ...userOpts }
  return {
    name: "D2Diagrams",
    markdownPlugins() {
      return [
        () => async (tree: Root, file) => {
          const blocks: Code[] = []
          visit(tree, "code", (node: Code) => {
            if (node.lang === "d2") blocks.push(node)
          })
          if (blocks.length === 0) return

          const d2 = getD2()
          try {
            for (const node of blocks) {
            const source = `${opts.prelude}\n${node.value}`
            let html: string
            try {
              const compiled = await d2.compile(source, {
                layout: opts.layout,
                themeID: opts.themeID,
                pad: opts.pad,
                sketch: opts.sketch,
              })
              const svg = sizeFromViewBox(
                await d2.render(compiled.diagram, compiled.renderOptions),
                opts.maxWidth,
                opts.scale,
              )
              html = `<figure class="d2">${svg}</figure>`
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err)
              console.warn(`[D2Diagrams] ${file.path ?? "?"}: ${msg}`)
              html = `<pre class="d2-error">D2 render error: ${escapeHtml(msg)}\n\n${escapeHtml(node.value)}</pre>`
            }
              const out = node as unknown as Html
              out.type = "html"
              out.value = html
            }
          } finally {
            scheduleShutdown()
          }
        },
      ]
    },
  }
}
