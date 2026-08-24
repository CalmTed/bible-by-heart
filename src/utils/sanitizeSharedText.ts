// Clean text shared into the app from other apps (the Android share sheet),
// so it becomes typeable and parseable. The typing test demands the EXACT
// character, so untypable variants (em/en dash, curly quotes, nbsp, ellipsis)
// are folded to their plain ASCII equivalents. Share payloads also usually
// append a source URL and wrap the verse in quotes / trailing punctuation —
// those are stripped too. Pure function, no side effects.
//
// Special characters are written as \u escapes so this file stays pure ASCII
// (no invisible nbsp / curly-quote bytes hiding in a regex character class).

// Wrapping quote pairs to peel off the whole string. Straight quotes and
// guillemets (« »); curly quotes are normalized to straight first.
const WRAP_PAIRS: [open: string, close: string][] = [
  ['"', '"'],
  ["'", "'"],
  ["«", "»"]
];

const stripWrappingQuotes = (input: string): string => {
  let text = input.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const [open, close] of WRAP_PAIRS) {
      if (
        text.length >= open.length + close.length &&
        text.startsWith(open) &&
        text.endsWith(close)
      ) {
        const inner = text.slice(open.length, text.length - close.length);
        // Only peel if the quote does not also appear inside — otherwise the
        // ends belong to two separate quoted spans, not one wrapping pair.
        const encloses =
          open === close
            ? !inner.includes(open)
            : !inner.includes(open) && !inner.includes(close);
        if (encloses) {
          text = inner.trim();
          changed = true;
          break;
        }
      }
    }
  }
  return text;
};

export const sanitizeSharedText = (input: string): string => {
  let text = input
    // en/em dash → hyphen
    .replace(/[–—]/g, "-")
    // curly / low double quotes → straight double quote
    .replace(/[“”„‟]/g, '"')
    // curly / low single quotes + apostrophes → straight apostrophe
    .replace(/[‘’‚‛]/g, "'")
    // ellipsis → three dots
    .replace(/…/g, "...")
    // nbsp / narrow-nbsp / thin space → regular space
    .replace(/[   ]/g, " ");
  // strip URLs (share payloads usually append a source link)
  text = text.replace(/(?:https?:\/\/|www\.)\S+/gi, "");
  // collapse runs of spaces left behind, keep newlines
  text = text.replace(/ {2,}/g, " ").trim();
  // peel wrapping quotes, then trailing/leading dangling separators — alternate
  // until stable, because a separator can hide a quote and vice-versa
  // (e.g. `"John 3:16",` → strip comma → strip quotes).
  let changed = true;
  while (changed) {
    const before = text;
    text = stripWrappingQuotes(text);
    text = text.replace(/^[\s:;,]+|[\s:;,]+$/g, "");
    changed = text !== before;
  }
  return text;
};

export default sanitizeSharedText;
