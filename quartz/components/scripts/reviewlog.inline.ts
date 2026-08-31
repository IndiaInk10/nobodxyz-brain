// Persist task-list checkboxes (the review log) per page in localStorage.
// Quartz renders GFM task lists as disabled inputs; enable them and remember state.
document.addEventListener("nav", () => {
  const slug = document.body.dataset.slug ?? location.pathname
  const boxes = document.querySelectorAll<HTMLInputElement>(
    "article li.task-list-item > input[type=checkbox], article input.task-list-item-checkbox",
  )
  boxes.forEach((box, i) => {
    const key = `review-log:${slug}:${i}`
    box.disabled = false
    box.style.cursor = "pointer"
    try {
      box.checked = localStorage.getItem(key) === "1"
    } catch {}
    const onChange = () => {
      try {
        localStorage.setItem(key, box.checked ? "1" : "0")
      } catch {}
    }
    box.addEventListener("change", onChange)
    window.addCleanup(() => box.removeEventListener("change", onChange))
  })
})
