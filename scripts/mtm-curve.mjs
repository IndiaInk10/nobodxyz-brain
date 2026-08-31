// Inverted-U curve for multiple team membership vs productivity (O'Leary et al. 2011, theoretical).
// Hand-drawn via rough.js, deterministic seed. Output: stdout SVG -> inline into
// content/time-management/multi-project.md
import { JSDOM } from "jsdom"
import rough from "roughjs"

const GREEN = "#0b6e4f"
const GRAY = "#8f8a7e"
const INK = "#2a2d31"

const dom = new JSDOM("<!doctype html><body></body>")
const doc = dom.window.document
const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg")
svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
svg.setAttribute("viewBox", "0 0 560 230")
svg.setAttribute("width", "640")
svg.setAttribute("height", "263")
svg.setAttribute("role", "img")
svg.setAttribute("aria-label", "동시 프로젝트 수와 생산성의 역U 관계")

const rc = rough.svg(svg)
const opts = { seed: 11, roughness: 1.4, bowing: 0.8, stroke: INK, strokeWidth: 1 }

// axes
svg.appendChild(rc.line(40, 15, 40, 185, opts))
svg.appendChild(rc.line(40, 185, 540, 185, opts))

// inverted-U curve
svg.appendChild(
  rc.curve(
    [
      [55, 150],
      [130, 85],
      [220, 45],
      [290, 38],
      [360, 55],
      [450, 105],
      [530, 165],
    ],
    { ...opts, stroke: GREEN, strokeWidth: 2 },
  ),
)

// optimal zone markers (dashed)
const dash = { ...opts, stroke: GRAY, strokeWidth: 1.2, strokeLineDash: [6, 5] }
svg.appendChild(rc.line(220, 40, 220, 185, dash))
svg.appendChild(rc.line(360, 52, 360, 185, dash))

// x ticks
for (const x of [55, 150, 245, 340, 435, 530]) svg.appendChild(rc.line(x, 183, x, 189, opts))

const labels = [
  [8, 24, "생산성", INK, "start"],
  [420, 218, "동시 프로젝트 수 →", INK, "start"],
  [55, 202, "1", INK, "middle"],
  [150, 202, "2", INK, "middle"],
  [245, 202, "3", INK, "middle"],
  [340, 202, "4", INK, "middle"],
  [435, 202, "5", INK, "middle"],
  [530, 202, "6+", INK, "middle"],
  [290, 22, "적정 구간", GREEN, "middle"],
  [452, 90, "전환 비용 > 이득", GRAY, "start"],
]
for (const [x, y, text, fill, anchor] of labels) {
  const t = doc.createElementNS("http://www.w3.org/2000/svg", "text")
  t.setAttribute("x", String(x))
  t.setAttribute("y", String(y))
  t.setAttribute("font-size", "12")
  t.setAttribute("fill", fill)
  t.setAttribute("text-anchor", anchor)
  t.textContent = text
  svg.appendChild(t)
}

console.log(svg.outerHTML)
