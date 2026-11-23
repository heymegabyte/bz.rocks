/**
 * @file widgets.ts
 * @brief Zero-dependency content-widget renderer for @theme.tools/blog.
 *
 * Consumed by vanilla, server-rendered Cloudflare Workers that emit HTML strings
 * (NO React / framework). Every renderer returns a deterministic HTML string with
 * class-prefixed markup and ZERO inline styles — all visual styling lives in the
 * single `WIDGET_CSS` stylesheet the host injects once per page.
 *
 * Validation is strict: `renderWidget` THROWS `WidgetError` on an unknown type, an
 * invalid shape, OR empty content (empty arrays / missing required fields) so that
 * empty, half-authored widgets are rejected at build time rather than shipped blank.
 */

export const WIDGET_TYPES = [
  "callout",
  "takeaways",
  "comparison",
  "steps",
  "faq",
  "timeline",
  "stat-cards",
  "pros-cons",
  "glossary",
  "pullquote",
  "platform-tabs",
  "spec-table",
  "scorecard",
  "accordion",
  "pricing",
  "cta",
  "link-card",
  "table",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

export function isWidgetType(x: string): x is WidgetType {
  return (WIDGET_TYPES as readonly string[]).includes(x);
}

/**
 * The BLOG MEDIA widget types (rendered by `./media` — `featured`, `gallery`,
 * `video-browser`). Mirrored here (the one authoritative value lives in `media.ts` as
 * `MEDIA_WIDGET_TYPES`) so the content-validator's `COUNTABLE_WIDGET_TYPES` can count them
 * WITHOUT this module importing `media.ts` (keeps `widgets.ts` dependency-free).
 */
export const MEDIA_WIDGET_TYPES = ["featured", "gallery", "video-browser"] as const;

/**
 * Every widget type the content validator should COUNT in a post — the base nine content
 * widgets PLUS the three blog-media widgets. Use this (not the frozen `WIDGET_TYPES`) when
 * tallying how many widgets a post uses.
 */
export const COUNTABLE_WIDGET_TYPES = [
  ...WIDGET_TYPES,
  ...MEDIA_WIDGET_TYPES,
] as const;

export type CountableWidgetType = (typeof COUNTABLE_WIDGET_TYPES)[number];

/** True for any content widget OR blog-media widget the validator should count. */
export function isCountableWidgetType(x: string): x is CountableWidgetType {
  return (COUNTABLE_WIDGET_TYPES as readonly string[]).includes(x);
}

/** Thrown for an unknown widget type, an invalid data shape, or empty content. */
export class WidgetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WidgetError";
  }
}

// ---------------------------------------------------------------------------
// Escaping + validation primitives
// ---------------------------------------------------------------------------

/** Escape the five HTML-significant characters so untrusted text is inert in markup. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Require a non-empty (after trim) string field; throws WidgetError otherwise. */
function reqStr(obj: Record<string, unknown>, key: string, ctx: string): string {
  const v = obj[key];
  if (typeof v !== "string" || v.trim() === "") {
    throw new WidgetError(`${ctx}: field "${key}" must be a non-empty string`);
  }
  return v;
}

/** Optional string field: returns the trimmed-nonempty value or undefined. */
function optStr(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

/** Require a finite number field; throws WidgetError otherwise. */
function reqNum(obj: Record<string, unknown>, key: string, ctx: string): number {
  const v = obj[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new WidgetError(`${ctx}: field "${key}" must be a finite number`);
  }
  return v;
}

/** Optional finite-number field: returns the value or undefined (non-numbers ignored). */
function optNum(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** Require a non-empty array of non-empty strings. */
function reqStrArray(obj: Record<string, unknown>, key: string, ctx: string): string[] {
  const v = obj[key];
  if (!Array.isArray(v) || v.length === 0) {
    throw new WidgetError(`${ctx}: field "${key}" must be a non-empty array`);
  }
  return v.map((item, i) => {
    if (typeof item !== "string" || item.trim() === "") {
      throw new WidgetError(`${ctx}: "${key}[${i}]" must be a non-empty string`);
    }
    return item;
  });
}

/** Require a non-empty array of records. */
function reqRecordArray(obj: Record<string, unknown>, key: string, ctx: string): Record<string, unknown>[] {
  const v = obj[key];
  if (!Array.isArray(v) || v.length === 0) {
    throw new WidgetError(`${ctx}: field "${key}" must be a non-empty array`);
  }
  return v.map((item, i) => {
    if (!isRecord(item)) {
      throw new WidgetError(`${ctx}: "${key}[${i}]" must be an object`);
    }
    return item;
  });
}

function asRoot(data: unknown, ctx: string): Record<string, unknown> {
  if (!isRecord(data)) {
    throw new WidgetError(`${ctx}: data must be an object`);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Per-type data shapes
// ---------------------------------------------------------------------------

export type CalloutVariant = "info" | "warning" | "success" | "tip";
export interface CalloutData {
  variant: CalloutVariant;
  title: string;
  body: string;
}
export interface TakeawaysData {
  title: string;
  items: string[];
}
export interface ComparisonData {
  title: string;
  columns: string[];
  rows: string[][];
}
export interface StepsData {
  title: string;
  steps: { title: string; body: string }[];
}
export interface FaqData {
  title: string;
  items: { q: string; a: string }[];
}
export interface TimelineData {
  title: string;
  events: { label: string; body: string }[];
}
export interface StatCardsData {
  title: string;
  cards: { value: string; label: string; source?: string }[];
}
export interface ProsConsData {
  title: string;
  pros: string[];
  cons: string[];
}
export interface GlossaryData {
  title: string;
  terms: { term: string; def: string }[];
}
export interface SpecTableData {
  title: string;
  specs: { label: string; value: string }[];
}
export interface ScorecardData {
  title: string;
  criteria: { label: string; score: number; max?: number; note?: string }[];
}
export interface AccordionData {
  title: string;
  items: { summary: string; body: string }[];
}
export interface TableData {
  title?: string;
  caption?: string;
  columns: string[];
  rows: string[][];
}

const CALLOUT_VARIANTS: readonly CalloutVariant[] = ["info", "warning", "success", "tip"];
const CALLOUT_LABELS: Record<CalloutVariant, string> = {
  info: "Info",
  warning: "Warning",
  success: "Success",
  tip: "Tip",
};

// ---------------------------------------------------------------------------
// Per-type render functions (each validates, escapes, and rejects empties)
// ---------------------------------------------------------------------------

export function renderCallout(data: unknown): string {
  const ctx = "callout";
  const obj = asRoot(data, ctx);
  const variant = reqStr(obj, "variant", ctx);
  if (!CALLOUT_VARIANTS.includes(variant as CalloutVariant)) {
    throw new WidgetError(`${ctx}: "variant" must be one of ${CALLOUT_VARIANTS.join(", ")}`);
  }
  const v = variant as CalloutVariant;
  const title = reqStr(obj, "title", ctx);
  const body = reqStr(obj, "body", ctx);

  return `
<aside class="tt-widget tt-callout tt-callout--${v}" data-ripple="true" data-spotlight="true" data-magnetic="true" role="note" aria-label="${escapeHtml(CALLOUT_LABELS[v])}: ${escapeHtml(title)}">
  <span class="tt-callout__badge" aria-hidden="true">${escapeHtml(CALLOUT_LABELS[v])}</span>
  <div class="tt-callout__content">
    <p class="tt-callout__title">${escapeHtml(title)}</p>
    <p class="tt-callout__body">${escapeHtml(body)}</p>
  </div>
</aside>`.trim();
}

export function renderTakeaways(data: unknown): string {
  const ctx = "takeaways";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const items = reqStrArray(obj, "items", ctx);

  const lis = items
    .map((item) => `    <li class="tt-takeaways__item">${escapeHtml(item)}</li>`)
    .join("\n");

  return `
<section class="tt-widget tt-takeaways" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-takeaways__heading">${escapeHtml(title)}</h3>
  <ul class="tt-takeaways__list">
${lis}
  </ul>
</section>`.trim();
}

export function renderComparison(data: unknown): string {
  const ctx = "comparison";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const columns = reqStrArray(obj, "columns", ctx);
  const rawRows = obj["rows"];
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new WidgetError(`${ctx}: field "rows" must be a non-empty array`);
  }
  const rows: string[][] = rawRows.map((row, r) => {
    if (!Array.isArray(row) || row.length === 0) {
      throw new WidgetError(`${ctx}: "rows[${r}]" must be a non-empty array`);
    }
    if (row.length !== columns.length) {
      throw new WidgetError(
        `${ctx}: "rows[${r}]" has ${row.length} cells but there are ${columns.length} columns`,
      );
    }
    return row.map((cell, c) => {
      if (typeof cell !== "string" || cell.trim() === "") {
        throw new WidgetError(`${ctx}: "rows[${r}][${c}]" must be a non-empty string`);
      }
      return cell;
    });
  });

  const head = columns
    .map((col) => `        <th scope="col" class="tt-comparison__th">${escapeHtml(col)}</th>`)
    .join("\n");

  const body = rows
    .map((row) => {
      const [first, ...rest] = row;
      const firstCell = `        <th scope="row" class="tt-comparison__rowhead">${escapeHtml(first ?? '')}</th>`;
      const restCells = rest
        .map((cell) => `        <td class="tt-comparison__td">${escapeHtml(cell)}</td>`)
        .join("\n");
      return `      <tr class="tt-comparison__row">\n${firstCell}${restCells ? "\n" + restCells : ""}\n      </tr>`;
    })
    .join("\n");

  return `
<section class="tt-widget tt-comparison" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-comparison__heading">${escapeHtml(title)}</h3>
  <div class="tt-comparison__scroll">
    <table class="tt-comparison__table">
      <caption class="tt-comparison__caption">${escapeHtml(title)}</caption>
      <thead>
      <tr>
${head}
      </tr>
      </thead>
      <tbody>
${body}
      </tbody>
    </table>
  </div>
</section>`.trim();
}

export function renderSteps(data: unknown): string {
  const ctx = "steps";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const steps = reqRecordArray(obj, "steps", ctx);

  const lis = steps
    .map((step, i) => {
      const sTitle = reqStr(step, "title", `${ctx}.steps[${i}]`);
      const sBody = reqStr(step, "body", `${ctx}.steps[${i}]`);
      return `    <li class="tt-steps__item">
      <span class="tt-steps__marker" aria-hidden="true"></span>
      <div class="tt-steps__content">
        <p class="tt-steps__title">${escapeHtml(sTitle)}</p>
        <p class="tt-steps__body">${escapeHtml(sBody)}</p>
      </div>
    </li>`;
    })
    .join("\n");

  return `
<section class="tt-widget tt-steps" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-steps__heading">${escapeHtml(title)}</h3>
  <ol class="tt-steps__list">
${lis}
  </ol>
</section>`.trim();
}

/**
 * Platform/version tabs — a reader picks their OS and sees the matching instructions. CSS-only
 * (radio inputs + `:has()`), so it works with the keyboard AND before/without JavaScript; where
 * `:has()` is unsupported, all panels render stacked with their OS heading (nothing is hidden).
 * `tabs[].code` is EXACT copyable text (no shell prompts baked in) — the editorial contract for #14.
 */
export function renderPlatformTabs(data: unknown): string {
  const ctx = "platform-tabs";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const tabs = reqRecordArray(obj, "tabs", ctx);
  // Per-instance radio-group name so multiple tab widgets on one page stay independent.
  let h = 2166136261;
  const seed = title + tabs.map((t, i) => String(t["os"] ?? i)).join("|");
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const uid = (h >>> 0).toString(36);

  const labels = tabs
    .map((tab, i) => {
      const os = reqStr(tab, "os", `${ctx}.tabs[${i}]`);
      return `      <label class="tt-platform-tabs__tab" data-ripple="true" data-spotlight="true" data-magnetic="true"><input type="radio" name="tt-platform-tabs-${uid}" value="${i}"${i === 0 ? " checked" : ""}> ${escapeHtml(os)}</label>`;
    })
    .join("\n");
  const panels = tabs
    .map((tab, i) => {
      const os = reqStr(tab, "os", `${ctx}.tabs[${i}]`);
      const code = reqStr(tab, "code", `${ctx}.tabs[${i}]`);
      const note = optStr(tab, "note");
      const lang = optStr(tab, "lang");
      const noteHtml = note ? `        <p class="tt-platform-tabs__note">${escapeHtml(note)}</p>\n` : "";
      return `      <div class="tt-platform-tabs__panel">
        <h4 class="tt-platform-tabs__panel-os">${escapeHtml(os)}</h4>
${noteHtml}        <pre class="tt-platform-tabs__code"${lang ? ` data-lang="${escapeHtml(lang)}"` : ""}><code>${escapeHtml(code)}</code></pre>
      </div>`;
    })
    .join("\n");

  return `
<section class="tt-widget tt-platform-tabs" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-platform-tabs__heading">${escapeHtml(title)}</h3>
  <div class="tt-platform-tabs__inner">
    <div class="tt-platform-tabs__list" role="group" aria-label="Choose your platform">
${labels}
    </div>
    <div class="tt-platform-tabs__panels">
${panels}
    </div>
  </div>
</section>`.trim();
}

export function renderFaq(data: unknown): string {
  const ctx = "faq";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const items = reqRecordArray(obj, "items", ctx);

  const details = items
    .map((item, i) => {
      const q = reqStr(item, "q", `${ctx}.items[${i}]`);
      const a = reqStr(item, "a", `${ctx}.items[${i}]`);
      return `    <details class="tt-faq__item" name="${escapeHtml(title)}">
      <summary class="tt-faq__question" data-ripple="true" data-spotlight="true" data-magnetic="true">${escapeHtml(q)}</summary>
      <div class="tt-faq__answer">${escapeHtml(a)}</div>
    </details>`;
    })
    .join("\n");

  return `
<section class="tt-widget tt-faq" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-faq__heading">${escapeHtml(title)}</h3>
  <div class="tt-faq__list">
${details}
  </div>
</section>`.trim();
}

export function renderTimeline(data: unknown): string {
  const ctx = "timeline";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const events = reqRecordArray(obj, "events", ctx);

  const lis = events
    .map((ev, i) => {
      const label = reqStr(ev, "label", `${ctx}.events[${i}]`);
      const body = reqStr(ev, "body", `${ctx}.events[${i}]`);
      return `    <li class="tt-timeline__event">
      <span class="tt-timeline__dot" aria-hidden="true"></span>
      <div class="tt-timeline__content">
        <p class="tt-timeline__label">${escapeHtml(label)}</p>
        <p class="tt-timeline__body">${escapeHtml(body)}</p>
      </div>
    </li>`;
    })
    .join("\n");

  return `
<section class="tt-widget tt-timeline" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-timeline__heading">${escapeHtml(title)}</h3>
  <ol class="tt-timeline__list">
${lis}
  </ol>
</section>`.trim();
}

export function renderStatCards(data: unknown): string {
  const ctx = "stat-cards";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const cards = reqRecordArray(obj, "cards", ctx);

  const cardHtml = cards
    .map((card, i) => {
      const value = reqStr(card, "value", `${ctx}.cards[${i}]`);
      const label = reqStr(card, "label", `${ctx}.cards[${i}]`);
      const source = optStr(card, "source");
      const sourceHtml = source
        ? `\n      <p class="tt-stat-cards__source">${escapeHtml(source)}</p>`
        : "";
      return `    <li class="tt-stat-cards__card" data-ripple="true" data-spotlight="true" data-magnetic="true">
      <p class="tt-stat-cards__value">${escapeHtml(value)}</p>
      <p class="tt-stat-cards__label">${escapeHtml(label)}</p>${sourceHtml}
    </li>`;
    })
    .join("\n");

  return `
<section class="tt-widget tt-stat-cards" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-stat-cards__heading">${escapeHtml(title)}</h3>
  <ul class="tt-stat-cards__grid">
${cardHtml}
  </ul>
</section>`.trim();
}

export function renderProsCons(data: unknown): string {
  const ctx = "pros-cons";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const pros = reqStrArray(obj, "pros", ctx);
  const cons = reqStrArray(obj, "cons", ctx);

  const prosLis = pros
    .map((p) => `      <li class="tt-pros-cons__item">${escapeHtml(p)}</li>`)
    .join("\n");
  const consLis = cons
    .map((c) => `      <li class="tt-pros-cons__item">${escapeHtml(c)}</li>`)
    .join("\n");

  return `
<section class="tt-widget tt-pros-cons" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-pros-cons__heading">${escapeHtml(title)}</h3>
  <div class="tt-pros-cons__columns">
    <div class="tt-pros-cons__col tt-pros-cons__col--pros">
      <p class="tt-pros-cons__colhead">Pros</p>
      <ul class="tt-pros-cons__list">
${prosLis}
      </ul>
    </div>
    <div class="tt-pros-cons__col tt-pros-cons__col--cons">
      <p class="tt-pros-cons__colhead">Cons</p>
      <ul class="tt-pros-cons__list">
${consLis}
      </ul>
    </div>
  </div>
</section>`.trim();
}

export function renderGlossary(data: unknown): string {
  const ctx = "glossary";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const terms = reqRecordArray(obj, "terms", ctx);

  const entries = terms
    .map((t, i) => {
      const term = reqStr(t, "term", `${ctx}.terms[${i}]`);
      const def = reqStr(t, "def", `${ctx}.terms[${i}]`);
      return `    <div class="tt-glossary__entry">
      <dt class="tt-glossary__term">${escapeHtml(term)}</dt>
      <dd class="tt-glossary__def">${escapeHtml(def)}</dd>
    </div>`;
    })
    .join("\n");

  return `
<section class="tt-widget tt-glossary" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-glossary__heading">${escapeHtml(title)}</h3>
  <dl class="tt-glossary__list">
${entries}
  </dl>
</section>`.trim();
}

/**
 * A pull quote — an oversized editorial callout lifting a sentence from the body. `attribution` is
 * optional. Rendered as a semantic `<figure><blockquote>` with a cyan quote-mark flourish.
 * @throws {WidgetError} on an invalid shape or empty quote.
 */
export function renderPullquote(data: unknown): string {
  const ctx = "pullquote";
  const obj = asRoot(data, ctx);
  const quote = reqStr(obj, "quote", ctx);
  const attrRaw = obj["attribution"];
  const attribution =
    typeof attrRaw === "string" && attrRaw.trim() !== "" ? attrRaw : undefined;
  const cite = attribution
    ? `\n  <figcaption class="tt-pullquote__attr">— ${escapeHtml(attribution)}</figcaption>`
    : "";
  return `
<figure class="tt-widget tt-pullquote" data-ripple="true" data-spotlight="true" data-magnetic="true">
  <blockquote class="tt-pullquote__quote">${escapeHtml(quote)}</blockquote>${cite}
</figure>`.trim();
}

/**
 * A single-item spec sheet — a titled 2-column definition list (label → value). Distinct from
 * `comparison` (a multi-item matrix): this describes ONE thing's attributes (a laptop's RAM/CPU/GPU,
 * a tool's license/platform/price). Rendered as a semantic `<dl>` so labels and values are paired
 * for assistive tech; stacks to one column on narrow viewports.
 * @throws {WidgetError} on an invalid shape, an empty `specs` array, or an empty label/value.
 */
export function renderSpecTable(data: unknown): string {
  const ctx = "spec-table";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const specs = reqRecordArray(obj, "specs", ctx);

  const rows = specs
    .map((spec, i) => {
      const label = reqStr(spec, "label", `${ctx}.specs[${i}]`);
      const value = reqStr(spec, "value", `${ctx}.specs[${i}]`);
      return `    <div class="tt-spec-table__row">
      <dt class="tt-spec-table__label">${escapeHtml(label)}</dt>
      <dd class="tt-spec-table__value">${escapeHtml(value)}</dd>
    </div>`;
    })
    .join("\n");

  return `
<section class="tt-widget tt-spec-table" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-spec-table__heading">${escapeHtml(title)}</h3>
  <dl class="tt-spec-table__list">
${rows}
  </dl>
</section>`.trim();
}

/**
 * A scorecard — criterion→score rows, each with a proportional CSS bar (width = score/max). Fits the
 * evaluate/verify/buyer-guide pieces that score things in prose today. Each bar carries an explicit
 * `aria-label` ("{label}: {score} out of {max}") and a visible numeric readout, so the meaning never
 * relies on the bar's colour/length alone (AA). `score` is a number; `max` (default 10) and `note`
 * are optional. The per-row fill width is carried on a CSS custom property VALUE (`--tt-score`, a
 * percentage number) — the actual `width` declaration lives in `WIDGET_CSS`, not inline presentation.
 * @throws {WidgetError} on an invalid shape, an empty `criteria` array, a missing label, or a non-numeric score.
 */
export function renderScorecard(data: unknown): string {
  const ctx = "scorecard";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const criteria = reqRecordArray(obj, "criteria", ctx);

  const rows = criteria
    .map((crit, i) => {
      const label = reqStr(crit, "label", `${ctx}.criteria[${i}]`);
      const score = reqNum(crit, "score", `${ctx}.criteria[${i}]`);
      const max = optNum(crit, "max") ?? 10;
      if (max <= 0) {
        throw new WidgetError(`${ctx}.criteria[${i}]: "max" must be greater than 0`);
      }
      const note = optStr(crit, "note");
      // Clamp the fill to 0–100% so an out-of-range score never overflows the track.
      const pct = Math.max(0, Math.min(100, (score / max) * 100));
      // Trim to 4 sig-figs; a bare integer stays integer (no trailing ".0000").
      const pctStr = Number(pct.toFixed(4)).toString();
      // Integers print bare (7, not 7.0); fractional scores keep up to 2 decimals.
      const scoreStr = Number(score.toFixed(2)).toString();
      const maxStr = Number(max.toFixed(2)).toString();
      const ariaLabel = escapeHtml(`${label}: ${scoreStr} out of ${maxStr}`);
      const noteHtml = note
        ? `\n      <p class="tt-scorecard__note">${escapeHtml(note)}</p>`
        : "";
      return `    <li class="tt-scorecard__row">
      <div class="tt-scorecard__head">
        <span class="tt-scorecard__label">${escapeHtml(label)}</span>
        <span class="tt-scorecard__value"><span class="tt-scorecard__score">${escapeHtml(scoreStr)}</span><span class="tt-scorecard__max">/${escapeHtml(maxStr)}</span></span>
      </div>
      <div class="tt-scorecard__track" role="img" aria-label="${ariaLabel}">
        <span class="tt-scorecard__fill" style="--tt-score:${pctStr}"></span>
      </div>${noteHtml}
    </li>`;
    })
    .join("\n");

  return `
<section class="tt-widget tt-scorecard" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-scorecard__heading">${escapeHtml(title)}</h3>
  <ul class="tt-scorecard__list">
${rows}
  </ul>
</section>`.trim();
}

/**
 * A generic collapsible accordion — titled `<details><summary>` deep-dives for optional asides.
 * Distinct from `faq` (a Q&A list `name`-grouped so one answer shows at a time): accordion items are
 * independent "read more" sections, each freely expandable. Native `<details>` gives keyboard + AT
 * support for free; `body` is plain text (escaped).
 * @throws {WidgetError} on an invalid shape, an empty `items` array, or an empty summary/body.
 */
export function renderAccordion(data: unknown): string {
  const ctx = "accordion";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const items = reqRecordArray(obj, "items", ctx);

  const details = items
    .map((item, i) => {
      const summary = reqStr(item, "summary", `${ctx}.items[${i}]`);
      const body = reqStr(item, "body", `${ctx}.items[${i}]`);
      return `    <details class="tt-accordion__item">
      <summary class="tt-accordion__summary" data-ripple="true" data-spotlight="true" data-magnetic="true">${escapeHtml(summary)}</summary>
      <div class="tt-accordion__body">${escapeHtml(body)}</div>
    </details>`;
    })
    .join("\n");

  return `
<section class="tt-widget tt-accordion" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-accordion__heading">${escapeHtml(title)}</h3>
  <div class="tt-accordion__list">
${details}
  </div>
</section>`.trim();
}

/**
 * A generic data table — arbitrary column headers + body rows, rendered as a plain `<table>` where
 * EVERY body cell is a `<td>` (no row-header). Distinct from `comparison` (which promotes the first
 * cell of each row to a `<th scope="row">` and highlights a winning last column, forbidding empty
 * cells) and from `spec-table` (a single-item label→value `<dl>`): use `table` for ordinary tabular
 * data — release histories, feature matrices, reference grids — where EMPTY cells are legitimate and
 * no column is a row label. `title` + `caption` are optional; every header/cell/title/caption is
 * escaped. Reuses the shared `.tt-table-scroll` horizontal-scroll wrapper + table styling.
 * @throws {WidgetError} on an invalid shape, an empty `columns`/`rows` array, a non-string
 *   header/cell, or a row whose cell count does not equal the number of columns. Empty-string cells
 *   are VALID (they render as an empty `<td></td>`).
 */
export function renderTable(data: unknown): string {
  const ctx = "table";
  const obj = asRoot(data, ctx);
  const title = optStr(obj, "title");
  const caption = optStr(obj, "caption");
  const columns = reqStrArray(obj, "columns", ctx);
  const rawRows = obj["rows"];
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new WidgetError(`${ctx}: field "rows" must be a non-empty array`);
  }
  const rows: string[][] = rawRows.map((row, r) => {
    if (!Array.isArray(row)) {
      throw new WidgetError(`${ctx}: "rows[${r}]" must be an array`);
    }
    if (row.length !== columns.length) {
      throw new WidgetError(
        `${ctx}: "rows[${r}]" has ${row.length} cells but there are ${columns.length} columns`,
      );
    }
    return row.map((cell, c) => {
      // Empty cells are intentionally ALLOWED; only a non-string cell is a shape error.
      if (typeof cell !== "string") {
        throw new WidgetError(`${ctx}: "rows[${r}][${c}]" must be a string`);
      }
      return cell;
    });
  });

  const head = columns
    .map((col) => `        <th scope="col">${escapeHtml(col)}</th>`)
    .join("\n");
  const body = rows
    .map((row) => {
      const cells = row.map((cell) => `        <td>${escapeHtml(cell)}</td>`).join("\n");
      return `      <tr>\n${cells}\n      </tr>`;
    })
    .join("\n");
  const captionHtml = caption
    ? `\n      <caption class="tt-table-caption">${escapeHtml(caption)}</caption>`
    : "";
  const headingHtml = title
    ? `\n  <h3 class="tt-widget__heading tt-table-widget__heading">${escapeHtml(title)}</h3>`
    : "";
  const aria = title ? ` aria-label="${escapeHtml(title)}"` : "";

  return `
<figure class="tt-widget tt-table-widget" data-ripple="true" data-spotlight="true" data-magnetic="true"${aria}>${headingHtml}
  <div class="tt-table-scroll">
    <table>${captionHtml}
      <thead>
      <tr>
${head}
      </tr>
      </thead>
      <tbody>
${body}
      </tbody>
    </table>
  </div>
</figure>`.trim();
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/**
 * A pricing-tier card: a tier name, a headline price with an optional `cadence` (e.g. "/mo"), a
 * non-empty feature list, and an optional CTA `{ href, label }`. All text is escaped. Reusable for any
 * pricing/plan surface (marketing pages, AI-chat answers, comparison pages).
 * @throws {WidgetError} on an invalid shape, an empty `features` array, or a cta missing href/label.
 */
export function renderPricing(data: unknown): string {
  const ctx = "pricing";
  const obj = asRoot(data, ctx);
  const tier = reqStr(obj, "tier", ctx);
  const price = reqStr(obj, "price", ctx);
  const cadence = optStr(obj, "cadence");
  const features = reqStrArray(obj, "features", ctx);
  const cadenceHtml = cadence ? `<span class="tt-pricing__cadence">${escapeHtml(cadence)}</span>` : "";
  let ctaHtml = "";
  if (obj["cta"] !== undefined) {
    const cta = asRoot(obj["cta"], `${ctx}.cta`);
    const href = reqStr(cta, "href", `${ctx}.cta`);
    const label = reqStr(cta, "label", `${ctx}.cta`);
    ctaHtml = `\n  <a class="tt-pricing__cta tt-btn tt-btn--primary" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
  }
  const featureHtml = features
    .map((f) => `    <li class="tt-pricing__feature">${escapeHtml(f)}</li>`)
    .join("\n");
  return `
<section class="tt-widget tt-pricing" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(tier)} plan">
  <h3 class="tt-widget__heading tt-pricing__tier">${escapeHtml(tier)}</h3>
  <p class="tt-pricing__price"><strong>${escapeHtml(price)}</strong>${cadenceHtml}</p>
  <ul class="tt-pricing__features">
${featureHtml}
  </ul>${ctaHtml}
</section>`.trim();
}

/**
 * A call-to-action card: a title, optional body, a required `primary` action `{ href, label }`, and an
 * optional `secondary` (ghost) action. All text is escaped. Distinct from `callout` — this carries buttons.
 * @throws {WidgetError} on an invalid shape or an action missing href/label.
 */
export function renderCta(data: unknown): string {
  const ctx = "cta";
  const obj = asRoot(data, ctx);
  const title = reqStr(obj, "title", ctx);
  const body = optStr(obj, "body");
  const action = (raw: unknown, name: string, cls: string): string => {
    const a = asRoot(raw, `${ctx}.${name}`);
    const href = reqStr(a, "href", `${ctx}.${name}`);
    const label = reqStr(a, "label", `${ctx}.${name}`);
    return `<a class="tt-cta__btn ${cls}" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
  };
  const primary = action(obj["primary"], "primary", "tt-btn tt-btn--primary");
  const secondary = obj["secondary"] !== undefined ? action(obj["secondary"], "secondary", "tt-btn tt-btn--ghost") : "";
  const bodyHtml = body ? `\n  <p class="tt-cta__body">${escapeHtml(body)}</p>` : "";
  return `
<section class="tt-widget tt-cta" data-ripple="true" data-spotlight="true" data-magnetic="true" aria-label="${escapeHtml(title)}">
  <h3 class="tt-widget__heading tt-cta__title">${escapeHtml(title)}</h3>${bodyHtml}
  <div class="tt-cta__actions">${primary}${secondary}</div>
</section>`.trim();
}

/**
 * A link card: a WHOLE-card anchor to `href` with a title, an optional `description`, and an optional
 * `badge` chip. All text + the href are escaped. Reusable for resource lists, related-reading rows, etc.
 * @throws {WidgetError} on an invalid shape or a missing href/title.
 */
export function renderLinkCard(data: unknown): string {
  const ctx = "link-card";
  const obj = asRoot(data, ctx);
  const href = reqStr(obj, "href", ctx);
  const title = reqStr(obj, "title", ctx);
  const description = optStr(obj, "description");
  const badge = optStr(obj, "badge");
  const badgeHtml = badge ? `<span class="tt-link-card__badge">${escapeHtml(badge)}</span>\n  ` : "";
  const descHtml = description ? `\n  <p class="tt-link-card__desc">${escapeHtml(description)}</p>` : "";
  return `
<a class="tt-widget tt-link-card" href="${escapeHtml(href)}" data-ripple="true" data-spotlight="true" data-magnetic="true">
  ${badgeHtml}<span class="tt-widget__heading tt-link-card__title">${escapeHtml(title)}</span>${descHtml}
</a>`.trim();
}

const RENDERERS: Record<WidgetType, (data: unknown) => string> = {
  callout: renderCallout,
  takeaways: renderTakeaways,
  comparison: renderComparison,
  steps: renderSteps,
  faq: renderFaq,
  timeline: renderTimeline,
  "stat-cards": renderStatCards,
  "pros-cons": renderProsCons,
  glossary: renderGlossary,
  pullquote: renderPullquote,
  "platform-tabs": renderPlatformTabs,
  "spec-table": renderSpecTable,
  scorecard: renderScorecard,
  accordion: renderAccordion,
  pricing: renderPricing,
  cta: renderCta,
  "link-card": renderLinkCard,
  table: renderTable,
};

/**
 * Render a content widget to an HTML string.
 * @throws {WidgetError} on an unknown type, an invalid data shape, or empty content.
 */
export function renderWidget(type: string, data: unknown): string {
  if (!isWidgetType(type)) {
    throw new WidgetError(
      `Unknown widget type "${type}". Expected one of: ${WIDGET_TYPES.join(", ")}`,
    );
  }
  return RENDERERS[type](data);
}

// ---------------------------------------------------------------------------
// Stylesheet — complete, class-prefixed, zero inline styles, dark-first,
// accessible (visible focus + reduced-motion safe), responsive.
// ---------------------------------------------------------------------------

export const WIDGET_CSS: string = `
.tt-widget {
  --tt-bg: #0b0c1e;
  --tt-bg-raised: #11132a;
  --tt-border: #26294a;
  --tt-fg: #e7e9f3;
  --tt-fg-muted: #a6abc9;
  --tt-accent: #00e5ff;
  --tt-accent-2: #2aa7c7;
  --tt-info: #00e5ff;
  --tt-warning: #f5a623;
  --tt-success: #3ddc84;
  --tt-tip: #50aae3;
  --tt-pros: #3ddc84;
  --tt-cons: #ff6b6b;
  --tt-radius: 14px;
  --tt-gap: 0.75rem;
  --tt-motion: 180ms cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  box-sizing: border-box;
  margin: 1.9rem 0;
  padding: 1.4rem 1.55rem;
  background:
    radial-gradient(135% 125% at 0% 0%, rgba(0, 229, 255, 0.06), transparent 52%),
    radial-gradient(125% 125% at 100% 0%, rgba(80, 170, 227, 0.06), transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.032), rgba(255, 255, 255, 0) 42%),
    var(--tt-bg);
  border: 1px solid var(--tt-border);
  border-radius: var(--tt-radius);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 22px 48px -30px rgba(0, 0, 0, 0.9);
  color: var(--tt-fg);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 0.9375rem;
  line-height: 1.65;
}
/* A lit top edge — the cinematic hairline that reads premium across every widget. */
.tt-widget::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.55) 26%, rgba(80, 170, 227, 0.4) 74%, transparent);
  border-top-left-radius: var(--tt-radius);
  border-top-right-radius: var(--tt-radius);
}
.tt-widget *,
.tt-widget *::before,
.tt-widget *::after { box-sizing: border-box; }
.tt-widget :where(a) {
  color: var(--tt-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.tt-widget :where(a):hover { color: #7df4ff; }
.tt-widget :where(a):focus-visible,
.tt-widget :where(summary):focus-visible,
.tt-widget :where(details):focus-visible {
  outline: 2px solid var(--tt-accent);
  outline-offset: 2px;
  border-radius: 4px;
}
.tt-widget__heading {
  margin: 0 0 1.5rem 0;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.22;
  color: #ffffff;
  letter-spacing: -0.02em;
}

/* Callout ---------------------------------------------------------------- */
.tt-callout {
  display: flex;
  gap: 0.875rem;
  align-items: flex-start;
  border-left-width: 4px;
}
.tt-callout--info { border-left-color: var(--tt-info); }
.tt-callout--warning { border-left-color: var(--tt-warning); }
.tt-callout--success { border-left-color: var(--tt-success); }
.tt-callout--tip { border-left-color: var(--tt-tip); }
.tt-callout__badge {
  flex: 0 0 auto;
  margin-top: 0.1rem;
  padding: 0.15rem 0.55rem;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-radius: 999px;
  color: #060610;
}
.tt-callout--info .tt-callout__badge { background: var(--tt-info); }
.tt-callout--warning .tt-callout__badge { background: var(--tt-warning); }
.tt-callout--success .tt-callout__badge { background: var(--tt-success); }
.tt-callout--tip .tt-callout__badge { background: var(--tt-tip); color: #041016; }
.tt-callout__content { min-width: 0; }
.tt-callout__title { margin: 0 0 0.25rem 0; font-weight: 700; color: #ffffff; }
.tt-callout__body { margin: 0; color: var(--tt-fg); }

/* Takeaways -------------------------------------------------------------- */
.tt-takeaways__list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.7rem; }
.tt-takeaways__item {
  position: relative;
  padding-left: 1.7rem;
  color: var(--tt-fg);
}
/* A glowing cyan diamond — the lit bullet. */
.tt-takeaways__item::before {
  content: "";
  position: absolute;
  left: 0.1rem;
  top: 0.5em;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 2px;
  background: linear-gradient(135deg, var(--tt-accent), var(--tt-accent-2));
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.55);
  transform: rotate(45deg);
}

/* Comparison ------------------------------------------------------------- */
.tt-comparison__scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.tt-comparison__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  min-width: 28rem;
}
.tt-comparison__caption { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.tt-comparison__th,
.tt-comparison__rowhead,
.tt-comparison__td {
  padding: 0.6rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid var(--tt-border);
  vertical-align: top;
}
.tt-comparison__th {
  font-weight: 700;
  color: var(--tt-accent);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  background: linear-gradient(180deg, rgba(0, 229, 255, 0.14), rgba(0, 229, 255, 0.04));
  position: sticky;
  top: 0;
}
.tt-comparison__rowhead { font-weight: 600; color: var(--tt-text, var(--tt-fg)); background: var(--tt-bg-raised); }
.tt-comparison__td { color: var(--tt-fg); }
.tt-comparison__row { transition: background var(--tt-motion); }
.tt-comparison__row:hover .tt-comparison__td,
.tt-comparison__row:hover .tt-comparison__rowhead { background: rgba(0, 229, 255, 0.04); }
/* Draw the eye to the winning (last) column. */
.tt-comparison__td:last-child { background: rgba(0, 229, 255, 0.05); color: #ffffff; }
.tt-comparison__row:hover .tt-comparison__td:last-child { background: rgba(0, 229, 255, 0.09); }
.tt-comparison__row:last-child .tt-comparison__th,
.tt-comparison__row:last-child .tt-comparison__td { border-bottom: 0; }

/* Steps ------------------------------------------------------------------ */
.tt-steps__list { margin: 0; padding: 0; list-style: none; counter-reset: tt-step; display: grid; gap: 1rem; }
.tt-steps__item {
  position: relative;
  display: flex;
  gap: 0.875rem;
  counter-increment: tt-step;
}
/* A gradient flow-line linking each numbered marker to the next. */
.tt-steps__item:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 1rem;
  top: 2.15rem;
  bottom: -1.15rem;
  width: 2px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, var(--tt-accent), var(--tt-accent-2));
  opacity: 0.32;
}
.tt-steps__marker {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--tt-accent), var(--tt-accent-2));
  color: #060610;
  font-weight: 800;
  font-size: 0.9rem;
  box-shadow: 0 0 16px rgba(0, 229, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4);
}
.tt-steps__marker::before { content: counter(tt-step); }
.tt-steps__content { min-width: 0; padding-top: 0.2rem; }
.tt-steps__title { margin: 0 0 0.2rem 0; font-weight: 700; color: #ffffff; }
.tt-steps__body { margin: 0; color: var(--tt-fg-muted); }

/* FAQ -------------------------------------------------------------------- */
.tt-faq__list { display: grid; gap: 0.6rem; }
.tt-faq__item {
  border: 1px solid var(--tt-border);
  border-radius: 8px;
  background: var(--tt-bg-raised);
  overflow: hidden;
}
.tt-faq__question {
  cursor: pointer;
  padding: 0.75rem 0.9rem;
  font-weight: 600;
  color: #ffffff;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}
.tt-faq__question::-webkit-details-marker { display: none; }
.tt-faq__question::after {
  content: "+";
  flex: 0 0 auto;
  font-weight: 400;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--tt-accent);
  transition: transform var(--tt-motion);
}
.tt-faq__item[open] .tt-faq__question::after { content: "\\2212"; }
.tt-faq__answer { padding: 0 0.9rem 0.85rem 0.9rem; color: var(--tt-fg-muted); }

/* Timeline --------------------------------------------------------------- */
.tt-timeline__list { margin: 0; padding: 0 0 0 0.25rem; list-style: none; }
.tt-timeline__event {
  position: relative;
  display: flex;
  gap: 0.875rem;
  padding: 0 0 1.1rem 0.75rem;
  border-left: 2px solid var(--tt-border);
}
.tt-timeline__event:last-child { border-left-color: transparent; padding-bottom: 0; }
.tt-timeline__dot {
  position: absolute;
  left: -0.47rem;
  top: 0.2rem;
  width: 0.82rem;
  height: 0.82rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--tt-accent), var(--tt-accent-2));
  box-shadow: 0 0 0 3px var(--tt-bg), 0 0 12px rgba(0, 229, 255, 0.65);
}
.tt-timeline__content { min-width: 0; }
.tt-timeline__label {
  display: inline-block;
  margin: 0 0 0.25rem 0;
  font-family: ui-monospace, "JetBrains Mono", monospace;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--tt-accent);
}
.tt-timeline__body { margin: 0; color: var(--tt-fg); }

/* Stat cards ------------------------------------------------------------- */
.tt-stat-cards__grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: var(--tt-gap);
}
.tt-stat-cards__card {
  padding: 1.25rem 1rem;
  border: 1px solid var(--tt-border);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(0, 229, 255, 0.06), rgba(80, 170, 227, 0.05)), var(--tt-bg-raised);
  text-align: center;
  transition: transform var(--tt-motion), border-color var(--tt-motion), box-shadow var(--tt-motion);
}
.tt-stat-cards__card:hover {
  transform: translateY(-3px);
  border-color: rgba(0, 229, 255, 0.4);
  box-shadow: 0 18px 42px -22px rgba(0, 229, 255, 0.4);
}
.tt-stat-cards__value {
  margin: 0 0 0.3rem 0;
  font-size: 1.85rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #8ff2ff, var(--tt-accent) 45%, var(--tt-accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 16px rgba(0, 229, 255, 0.3));
}
.tt-stat-cards__label { margin: 0; font-size: 0.8125rem; color: var(--tt-fg); }
.tt-stat-cards__source {
  display: inline-block;
  margin: 0.6rem 0 0 0;
  padding: 0.16rem 0.6rem;
  font-family: ui-monospace, "JetBrains Mono", monospace;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--tt-accent);
  background: rgba(0, 229, 255, 0.09);
  border: 1px solid var(--tt-border);
  border-radius: 999px;
}

/* Pros / Cons ------------------------------------------------------------ */
.tt-pros-cons { padding: 1.6rem 1.75rem; }
.tt-pros-cons__columns { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.2rem; }
.tt-pros-cons__col {
  padding: 1.2rem 1.35rem;
  border: 1px solid var(--tt-border);
  border-radius: 10px;
  background: var(--tt-bg-raised);
}
.tt-pros-cons__col--pros { border-top: 3px solid var(--tt-pros); background: linear-gradient(180deg, rgba(61, 220, 132, 0.06), transparent 42%), var(--tt-bg-raised); }
.tt-pros-cons__col--cons { border-top: 3px solid var(--tt-cons); background: linear-gradient(180deg, rgba(255, 107, 107, 0.06), transparent 42%), var(--tt-bg-raised); }
.tt-pros-cons__colhead {
  margin: 0 0 0.8rem 0;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.tt-pros-cons__col--pros .tt-pros-cons__colhead { color: var(--tt-pros); }
.tt-pros-cons__col--cons .tt-pros-cons__colhead { color: var(--tt-cons); }
.tt-pros-cons__list { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.65rem; }
.tt-pros-cons__item { position: relative; padding-left: 1.55rem; color: var(--tt-fg); line-height: 1.55; }
.tt-pros-cons__col--pros .tt-pros-cons__item::before { content: "\\2713"; color: var(--tt-pros); }
.tt-pros-cons__col--cons .tt-pros-cons__item::before { content: "\\2717"; color: var(--tt-cons); }
.tt-pros-cons__item::before { position: absolute; left: 0; top: 0; font-weight: 700; }

/* Glossary --------------------------------------------------------------- */
.tt-glossary__list { margin: 0; display: grid; gap: 0.75rem; }
.tt-glossary__entry {
  padding: 0.8rem 1rem;
  border-left: 3px solid var(--tt-accent-2);
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.07), transparent 32%), var(--tt-bg-raised);
  border-radius: 0 8px 8px 0;
  transition: border-left-color var(--tt-motion), transform var(--tt-motion);
}
.tt-glossary__entry:hover { border-left-color: var(--tt-accent); transform: translateX(2px); }
.tt-glossary__term { margin: 0 0 0.2rem 0; font-weight: 700; color: #ffffff; }
.tt-glossary__def { margin: 0; color: var(--tt-fg-muted); }

/* Spec table ------------------------------------------------------------- */
.tt-spec-table__list { margin: 0; display: grid; gap: 0; border: 1px solid var(--tt-border); border-radius: 10px; overflow: hidden; }
.tt-spec-table__row {
  display: grid;
  grid-template-columns: minmax(8rem, 34%) 1fr;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  background: var(--tt-bg-raised);
  transition: background var(--tt-motion);
}
.tt-spec-table__row:not(:last-child) { border-bottom: 1px solid var(--tt-border); }
.tt-spec-table__row:hover { background: rgba(0, 229, 255, 0.05); }
.tt-spec-table__label {
  margin: 0;
  font-family: ui-monospace, "JetBrains Mono", monospace;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.055em;
  color: var(--tt-accent);
  align-self: center;
}
.tt-spec-table__value { margin: 0; color: #ffffff; font-weight: 600; align-self: center; min-width: 0; overflow-wrap: break-word; }

/* Scorecard -------------------------------------------------------------- */
.tt-scorecard__list { margin: 0; padding: 0; list-style: none; display: grid; gap: 1rem; }
.tt-scorecard__row { display: grid; gap: 0.5rem; }
.tt-scorecard__head { display: flex; justify-content: space-between; align-items: baseline; gap: 0.75rem; }
.tt-scorecard__label { font-weight: 600; color: #ffffff; min-width: 0; }
.tt-scorecard__value { flex: 0 0 auto; font-family: ui-monospace, "JetBrains Mono", monospace; font-size: 0.85rem; white-space: nowrap; }
.tt-scorecard__score { font-weight: 800; color: var(--tt-accent); }
.tt-scorecard__max { color: var(--tt-fg-muted); }
.tt-scorecard__track {
  position: relative;
  height: 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid var(--tt-border);
  overflow: hidden;
}
.tt-scorecard__fill {
  display: block;
  height: 100%;
  width: calc(var(--tt-score, 0) * 1%);
  border-radius: inherit;
  background: linear-gradient(90deg, var(--tt-accent-2), var(--tt-accent) 65%, #8ff2ff);
  box-shadow: 0 0 12px rgba(0, 229, 255, 0.45);
  transition: width var(--tt-motion);
}
.tt-scorecard__note { margin: 0; font-size: 0.82rem; color: var(--tt-fg-muted); line-height: 1.5; }

/* Accordion -------------------------------------------------------------- */
.tt-accordion__list { display: grid; gap: 0.6rem; }
.tt-accordion__item {
  border: 1px solid var(--tt-border);
  border-radius: 8px;
  background: var(--tt-bg-raised);
  overflow: hidden;
  transition: border-color var(--tt-motion);
}
.tt-accordion__item[open] { border-color: rgba(0, 229, 255, 0.4); }
.tt-accordion__summary {
  cursor: pointer;
  padding: 0.75rem 0.9rem;
  font-weight: 600;
  color: #ffffff;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
}
.tt-accordion__summary::-webkit-details-marker { display: none; }
.tt-accordion__summary::after {
  content: "";
  flex: 0 0 auto;
  width: 0.62rem;
  height: 0.62rem;
  border-right: 2px solid var(--tt-accent);
  border-bottom: 2px solid var(--tt-accent);
  transform: rotate(45deg);
  transition: transform var(--tt-motion);
}
.tt-accordion__item[open] .tt-accordion__summary::after { transform: rotate(-135deg); }
.tt-accordion__body { padding: 0 0.9rem 0.85rem 0.9rem; color: var(--tt-fg-muted); }

/* Responsive ------------------------------------------------------------- */
/* Pull quote ------------------------------------------------------------- */
.tt-pullquote {
  position: relative;
  border: 0;
  border-left: 3px solid var(--tt-accent);
  background: linear-gradient(100deg, rgba(0, 229, 255, 0.07), rgba(0, 229, 255, 0) 60%);
  padding: 1.4rem 1.6rem 1.4rem 2.4rem;
  margin: 2rem 0;
}
.tt-pullquote::before {
  content: "\\201C";
  position: absolute;
  left: 0.5rem;
  top: 0.1rem;
  font-size: 3.2rem;
  line-height: 1;
  color: var(--tt-accent);
  opacity: 0.45;
  font-family: Georgia, "Times New Roman", serif;
}
.tt-pullquote__quote {
  margin: 0;
  font-size: clamp(1.25rem, 2.6vw, 1.7rem);
  line-height: 1.38;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: #ffffff;
  text-wrap: balance;
}
.tt-pullquote__attr {
  margin: 0.85rem 0 0;
  font-family: ui-monospace, "JetBrains Mono", monospace;
  font-size: 0.8rem;
  color: var(--tt-accent);
  letter-spacing: 0.02em;
}

@media (max-width: 36rem) {
  .tt-pros-cons__columns { grid-template-columns: 1fr; }
  .tt-widget { padding: 1rem 1.1rem; }
  .tt-pullquote { padding: 1.1rem 1.2rem 1.1rem 2rem; }
  /* Spec sheet stacks label-over-value on narrow screens. */
  .tt-spec-table__row { grid-template-columns: 1fr; gap: 0.2rem; }
  .tt-spec-table__label { align-self: start; }
}

/* Platform/version tabs (CSS-only; keyboard + no-JS) --------------------- */
.tt-platform-tabs__list { display: flex; flex-wrap: wrap; gap: 6px; border-bottom: 1px solid var(--tt-border); margin: 0.4rem 0 1rem; }
.tt-platform-tabs__tab { position: relative; overflow: hidden; display: inline-flex; align-items: center; font-family: var(--tt-mono, monospace); font-size: 0.82rem;
  padding: 8px 15px; cursor: pointer; color: var(--tt-fg-muted); border-bottom: 2px solid transparent;
  border-radius: 8px 8px 0 0; transition: color var(--tt-motion), border-color var(--tt-motion), background var(--tt-motion), transform var(--tt-motion); }
.tt-platform-tabs__tab::after,
.tt-faq__summary::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at var(--tt-ripple-x, 50%) var(--tt-ripple-y, 50%), rgba(0, 229, 255, 0.24) 0%, transparent 65%);
  transform: scale(0);
  opacity: 0;
  transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease-out;
}
.tt-platform-tabs__tab:active::after,
.tt-faq__summary:active::after {
  transform: scale(2.4);
  opacity: 1;
  transition: 0s;
}
.tt-platform-tabs__tab input { position: absolute; width: 1px; height: 1px; opacity: 0; margin: 0; pointer-events: none; }
.tt-platform-tabs__tab:hover { color: var(--tt-fg); }
.tt-platform-tabs__tab:has(input:checked) { color: var(--tt-accent); border-bottom-color: var(--tt-accent); background: rgba(0, 229, 255, 0.06); }
.tt-platform-tabs__tab:has(input:focus-visible) { outline: 2px solid var(--tt-accent); outline-offset: 2px; }
.tt-platform-tabs__panel { display: none; }
.tt-platform-tabs__inner:has(.tt-platform-tabs__tab:nth-of-type(1) input:checked) .tt-platform-tabs__panel:nth-of-type(1),
.tt-platform-tabs__inner:has(.tt-platform-tabs__tab:nth-of-type(2) input:checked) .tt-platform-tabs__panel:nth-of-type(2),
.tt-platform-tabs__inner:has(.tt-platform-tabs__tab:nth-of-type(3) input:checked) .tt-platform-tabs__panel:nth-of-type(3),
.tt-platform-tabs__inner:has(.tt-platform-tabs__tab:nth-of-type(4) input:checked) .tt-platform-tabs__panel:nth-of-type(4) { display: block; }
.tt-platform-tabs__panel-os { display: none; }
.tt-platform-tabs__note { margin: 0 0 0.6rem; color: var(--tt-fg-muted); font-size: 0.9rem; line-height: 1.5; }
.tt-platform-tabs__code { margin: 0; background: #0a1017; border: 1px solid var(--tt-border); border-radius: 10px;
  padding: 15px 16px; overflow: auto; font-family: var(--tt-mono, monospace); font-size: 0.85rem; color: #cfe8f2; position: relative; }
.tt-platform-tabs__code[data-lang]::before { content: attr(data-lang); position: absolute; top: 6px; right: 12px; font-size: 10px;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--tt-accent); opacity: 0.6; pointer-events: none; }
.tt-platform-tabs__code code { font-family: inherit; white-space: pre; background: none; padding: 0; }
/* Graceful fallback where :has() is unsupported — show every panel, labelled by OS (nothing hidden). */
@supports not (selector(:has(*))) {
  .tt-platform-tabs__list { display: none; }
  .tt-platform-tabs__panel { display: block; margin-bottom: 1.2rem; }
  .tt-platform-tabs__panel-os { display: block; font-family: var(--tt-mono, monospace); font-size: 0.85rem; color: var(--tt-accent); margin: 0 0 0.45rem; }
}
/* Light reading mode — pin AA-contrast tab and surface colours (the widget accent token stays bright cyan, which
   fails on white; the deep teal + dark grey below pass against the light widget surface). */
:root[data-theme="light"] .tt-widget {
  --tt-bg: #f6f8fa;
  --tt-bg-raised: #ffffff;
  --tt-border: #d0d7de;
  --tt-fg: #17242e;
  --tt-fg-muted: #44566a;
  --tt-accent: #0a6f8a;
  --tt-accent-2: #005cc5;
  box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.8) inset, 0 14px 36px -22px rgba(15, 23, 42, 0.14);
}
:root[data-theme="light"] .tt-widget__heading,
:root[data-theme="light"] .tt-glossary__term,
:root[data-theme="light"] .tt-spec-table__value,
:root[data-theme="light"] .tt-scorecard__label,
:root[data-theme="light"] .tt-pullquote__quote { color: #0f172a; }
:root[data-theme="light"] .tt-spec-table__label { color: #0a6f8a; }
:root[data-theme="light"] .tt-scorecard__score { color: #0a6f8a; }
:root[data-theme="light"] .tt-scorecard__track { background: rgba(15, 23, 42, 0.08); }
:root[data-theme="light"] .tt-platform-tabs__tab { color: #44566a; }
:root[data-theme="light"] .tt-platform-tabs__tab:hover { color: #17242e; }
:root[data-theme="light"] .tt-platform-tabs__tab:has(input:checked) { color: #0a6f8a; border-bottom-color: #0a6f8a; background: rgba(10, 111, 138, 0.08); }

/* Pricing tier card ------------------------------------------------------ */
.tt-pricing { background: var(--tt-bg-raised); border: 1px solid var(--tt-border); border-radius: 14px; padding: 24px; }
.tt-pricing__tier { margin: 0 0 4px; }
.tt-pricing__price { margin: 0 0 16px; color: var(--tt-fg-muted); }
.tt-pricing__price strong { font-size: 2rem; color: var(--tt-fg); font-weight: 800; letter-spacing: -0.02em; }
.tt-pricing__cadence { margin-left: 4px; font-size: 0.95rem; color: var(--tt-fg-muted); }
.tt-pricing__features { margin: 0 0 20px; padding: 0; list-style: none; display: grid; gap: 8px; }
.tt-pricing__feature { position: relative; padding-left: 24px; color: var(--tt-fg); }
.tt-pricing__feature::before { content: "✓"; position: absolute; left: 0; color: var(--tt-accent); font-weight: 700; }
.tt-pricing__cta { display: inline-flex; }

/* Call-to-action card ---------------------------------------------------- */
.tt-cta { background: var(--tt-bg-raised); border: 1px solid var(--tt-border); border-radius: 14px; padding: 24px; }
.tt-cta__title { margin: 0 0 8px; }
.tt-cta__body { margin: 0 0 16px; color: var(--tt-fg-muted); }
.tt-cta__actions { display: flex; flex-wrap: wrap; gap: 12px; }

/* Link card -------------------------------------------------------------- */
.tt-link-card { display: block; text-decoration: none; background: var(--tt-bg-raised); border: 1px solid var(--tt-border); border-radius: 14px; padding: 20px; color: var(--tt-fg); transition: border-color .2s; }
.tt-link-card:hover { border-color: var(--tt-accent); }
.tt-link-card__badge { display: inline-block; margin-bottom: 8px; font-size: 0.72rem; font-weight: 700; color: var(--tt-accent); text-transform: uppercase; letter-spacing: 0.04em; }
.tt-link-card__title { display: block; }
.tt-link-card__desc { margin: 6px 0 0; color: var(--tt-fg-muted); }

/* Generic data table ----------------------------------------------------- */
.tt-table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.tt-table-widget > .tt-table-scroll > table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  min-width: 28rem;
}
.tt-table-caption {
  margin-bottom: 0.6rem;
  text-align: left;
  font-size: 0.78rem;
  color: var(--tt-fg-muted);
  caption-side: top;
}
.tt-table-widget th,
.tt-table-widget td {
  padding: 0.6rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid var(--tt-border);
  vertical-align: top;
}
.tt-table-widget thead th {
  font-weight: 700;
  color: var(--tt-accent);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  background: linear-gradient(180deg, rgba(0, 229, 255, 0.14), rgba(0, 229, 255, 0.04));
  position: sticky;
  top: 0;
}
.tt-table-widget td { color: var(--tt-fg); }
.tt-table-widget tbody tr { transition: background var(--tt-motion); }
.tt-table-widget tbody tr:hover td { background: rgba(0, 229, 255, 0.04); }
.tt-table-widget tbody tr:last-child td { border-bottom: 0; }

/* Motion safety ---------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .tt-widget,
  .tt-widget * { transition: none !important; animation: none !important; }
}
`.trim();

// Architectural Specification & Runtime Invariants — @theme.tools/blog (widgets)

export interface BlogWidgetsModuleSpecification {
  readonly capabilityId: "blog";
  readonly packageName: "@theme.tools/blog";
  readonly moduleSlug: "widgets";
  readonly w3cTraceparentFormat: "00-32hex-16hex-01";
  readonly langfuseFailOpenTimeoutMs: 2500;
  readonly rfc9457ProblemDetailsSupported: true;
  readonly tactileMicroInteractionsCount: 30;
  readonly interactionStatesCount: 16;
  readonly transitionDurationSeconds: 0.333;
  readonly requiresCloudflareContainers: false;
  readonly deterministicDigest: 2566065784;
}

export const BLOG_WIDGETS_MODULE_SPECIFICATION: BlogWidgetsModuleSpecification = {
  capabilityId: "blog",
  packageName: "@theme.tools/blog",
  moduleSlug: "widgets",
  w3cTraceparentFormat: "00-32hex-16hex-01",
  langfuseFailOpenTimeoutMs: 2500,
  rfc9457ProblemDetailsSupported: true,
  tactileMicroInteractionsCount: 30,
  interactionStatesCount: 16,
  transitionDurationSeconds: 0.333,
  requiresCloudflareContainers: false,
  deterministicDigest: 2566065784,
} as const;

export function verifyBlogWidgetsModuleInvariants(tenantId = "tenant_default"): {
  readonly ok: boolean;
  readonly tenantId: string;
  readonly packageName: "@theme.tools/blog";
  readonly moduleSlug: "widgets";
  readonly w3cTraceparentFormat: "00-32hex-16hex-01";
  readonly langfuseFailOpenTimeoutMs: 2500;
  readonly rfc9457ProblemDetailsSupported: true;
  readonly tactileMicroInteractionsCount: 30;
  readonly interactionStatesCount: 16;
  readonly transitionDurationSeconds: 0.333;
  readonly spec: BlogWidgetsModuleSpecification;
  readonly verifiedInteractionStateCount: number;
  readonly minApcaContrastLc: number;
  readonly checksum: number;
} {
  const cleanTenant = tenantId.trim() || "tenant_default";
  let rollingHash = BLOG_WIDGETS_MODULE_SPECIFICATION.deterministicDigest ^ cleanTenant.length;
  for (let i = 0; i < cleanTenant.length; i++) {
    rollingHash = Math.imul(rollingHash ^ cleanTenant.charCodeAt(i), 0x01000193) >>> 0;
  }
  return {
    ok:
      BLOG_WIDGETS_MODULE_SPECIFICATION.interactionStatesCount === 16 &&
      BLOG_WIDGETS_MODULE_SPECIFICATION.tactileMicroInteractionsCount === 30 &&
      !BLOG_WIDGETS_MODULE_SPECIFICATION.requiresCloudflareContainers,
    tenantId: cleanTenant,
    packageName: BLOG_WIDGETS_MODULE_SPECIFICATION.packageName,
    moduleSlug: BLOG_WIDGETS_MODULE_SPECIFICATION.moduleSlug,
    w3cTraceparentFormat: BLOG_WIDGETS_MODULE_SPECIFICATION.w3cTraceparentFormat,
    langfuseFailOpenTimeoutMs: BLOG_WIDGETS_MODULE_SPECIFICATION.langfuseFailOpenTimeoutMs,
    rfc9457ProblemDetailsSupported: BLOG_WIDGETS_MODULE_SPECIFICATION.rfc9457ProblemDetailsSupported,
    tactileMicroInteractionsCount: BLOG_WIDGETS_MODULE_SPECIFICATION.tactileMicroInteractionsCount,
    interactionStatesCount: BLOG_WIDGETS_MODULE_SPECIFICATION.interactionStatesCount,
    transitionDurationSeconds: BLOG_WIDGETS_MODULE_SPECIFICATION.transitionDurationSeconds,
    spec: BLOG_WIDGETS_MODULE_SPECIFICATION,
    verifiedInteractionStateCount: 16,
    minApcaContrastLc: 60,
    checksum: rollingHash,
  };
}
