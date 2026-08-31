// @ts-ignore
import script from "./scripts/reviewlog.inline"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

/**
 * Invisible component: makes markdown task lists (the review log) interactive
 * and remembers their checked state in the reader's browser.
 */
const ReviewLog: QuartzComponent = () => null
ReviewLog.afterDOMLoaded = script

export default (() => ReviewLog) satisfies QuartzComponentConstructor
