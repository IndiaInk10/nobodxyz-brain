// Renders the forgetting-curve chart as a hand-drawn (rough.js) SVG.
// Same engine roughViz uses, but drawn directly so the review-reset jumps,
// annotations, and the dashed no-review baseline keep full control.
// Deterministic via a fixed seed. Output goes to stdout; paste/inject into
// content/learning-science.md (or run: node scripts/forgetting-curve.mjs > out.svg).
import { JSDOM } from "jsdom"
import rough from "roughjs"

const GREEN = "#0b6e4f"
const GRAY = "#8f8a7e"
const INK = "#2a2d31"

const dom = new JSDOM("<!doctype html><body></body>")
const doc = dom.window.document
const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg")
svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
svg.setAttribute("viewBox", "0 0 560 220")
svg.setAttribute("width", "640")
svg.setAttribute("height", "251")
svg.setAttribute("role", "img")
svg.setAttribute("aria-label", "망각 곡선과 간격 복습")

const rc = rough.svg(svg)
const opts = { seed: 7, roughness: 1.4, bowing: 0.8, stroke: INK, strokeWidth: 1 }

// axes
svg.appendChild(rc.line(40, 15, 40, 185, opts))
svg.appendChild(rc.line(40, 185, 540, 185, opts))

// no-review decay (dashed gray)
svg.appendChild(
  rc.curve(
    [
      [40, 25],
      [90, 90],
      [150, 140],
      [240, 165],
      [360, 175],
      [540, 182],
    ],
    { ...opts, stroke: GRAY, strokeWidth: 1.5, strokeLineDash: [6, 5] },
  ),
)

// review curve: decay segments + reset jumps
const segs = [
  [
    [40, 25],
    [70, 80],
    [95, 115],
    [120, 138],
  ],
  [
    [120, 30],
    [160, 75],
    [200, 103],
    [240, 122],
  ],
  [
    [240, 32],
    [300, 65],
    [360, 85],
    [420, 98],
  ],
  [
    [420, 36],
    [460, 52],
    [500, 61],
    [540, 66],
  ],
]
const green = { ...opts, stroke: GREEN, strokeWidth: 2 }
for (const seg of segs) svg.appendChild(rc.curve(seg, green))
svg.appendChild(rc.line(120, 138, 120, 30, green))
svg.appendChild(rc.line(240, 122, 240, 32, green))
svg.appendChild(rc.line(420, 98, 420, 36, green))
for (const [x, y] of [
  [120, 30],
  [240, 32],
  [420, 36],
]) {
  svg.appendChild(rc.circle(x, y, 8, { ...green, fill: GREEN, fillStyle: "solid" }))
}

// labels (plain text for legibility)
const labels = [
  [8, 24, "기억률", INK, "start"],
  [497, 205, "시간 →", INK, "start"],
  [120, 18, "+1일", INK, "middle"],
  [240, 20, "+3일", INK, "middle"],
  [420, 24, "+1주", INK, "middle"],
  [300, 152, "복습 없음", GRAY, "start"],
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
