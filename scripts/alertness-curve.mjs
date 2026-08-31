// Daily alertness curve (two-process model, schematic): sleep inertia at wake,
// late-morning peak, post-lunch dip, early-evening second peak, night decline.
// Hand-drawn via rough.js, deterministic seed. Output: stdout SVG -> inline into
// content/time-management/daily-rhythm.md
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
svg.setAttribute("aria-label", "하루 각성 곡선 — 수면 관성, 오전 피크, 오후 슬럼프, 저녁 2차 피크")

const rc = rough.svg(svg)
const opts = { seed: 23, roughness: 1.4, bowing: 0.8, stroke: INK, strokeWidth: 1 }

// axes
svg.appendChild(rc.line(40, 15, 40, 185, opts))
svg.appendChild(rc.line(40, 185, 540, 185, opts))

// alertness curve (07h -> 23h)
svg.appendChild(
  rc.curve(
    [
      [40, 150],
      [71, 100],
      [134, 55],
      [180, 45],
      [227, 70],
      [258, 95],
      [290, 80],
      [384, 52],
      [446, 70],
      [540, 140],
    ],
    { ...opts, stroke: GREEN, strokeWidth: 2 },
  ),
)

// x ticks: 07, 11, 15, 19, 23
for (const x of [40, 165, 290, 415, 540]) svg.appendChild(rc.line(x, 183, x, 189, opts))

const labels = [
  [8, 24, "각성", INK, "start"],
  [498, 218, "시각 →", INK, "start"],
  [40, 202, "07", INK, "middle"],
  [165, 202, "11", INK, "middle"],
  [290, 202, "15", INK, "middle"],
  [415, 202, "19", INK, "middle"],
  [540, 202, "23", INK, "middle"],
  [58, 168, "수면 관성", GRAY, "start"],
  [178, 30, "오전 피크", GREEN, "middle"],
  [262, 118, "오후 슬럼프", GRAY, "middle"],
  [388, 36, "저녁 2차 피크", GREEN, "middle"],
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
