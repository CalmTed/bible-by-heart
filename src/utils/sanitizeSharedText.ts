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

// A translation code the way another Bible app stamps it in front of a share:
// two to eight capitals and digits, optionally with a registered / trademark
// mark. ESV, KJV, NIV84, NASB95, UCVNTR, ESV\u00ae.
const CODE = "[A-Z][A-Z0-9]{1,7}[\u00ae\u2122]?";

// Only these three shapes are stripped, and the reason is "LORD is my shepherd".
// A bare capitalized token followed by ordinary text is not evidence of anything
// - Scripture is full of all-caps words - so the code has to stand APART from the
// verse before it can be called a code.
const LEADING_CODE_SHAPES = [
  // "ESV [1] In the beginning" - a bracketed verse number right behind it
  new RegExp(`^${CODE}[ \\t]+(?=\\[[ \\t]*\\d)`),
  // "ESV: In the beginning" / "ESV - In the beginning"
  new RegExp(`^${CODE}[ \\t]*[:-][ \\t]*`),
  // "ESV" alone on the first line
  new RegExp(`^${CODE}[ \\t]*\\r?\\n[ \\t]*`)
];

const stripLeadingTranslationCode = (input: string): string => {
  for (const shape of LEADING_CODE_SHAPES) {
    if (shape.test(input)) {
      return input.replace(shape, "");
    }
  }
  return input;
};

// A verse number as other apps mark it: "[1]", "[ 12 ]", "[3:16]". DIGITS ONLY -
// square brackets around words are real editorial apparatus in the translations
// the app bundles ("and [the] LORD said"), and stripping those would rewrite the
// text the user is going to be tested on character by character.
const BRACKETED_VERSE_NUMBER = /\[[ \t]*\d+(?:[ \t]*[:.][ \t]*\d+)?[ \t]*\]/g;

// A dash counts as a dangling separator only where it STANDS APART - "- text",
// "text -". That is what a share leaves behind once the reference is cut out of
// it: `Ps 23:1 — "the LORD is my shepherd"` becomes `- "the LORD..."`. A dash
// TOUCHING a word belongs to what was shared - a verse range ("3:16-17"), a
// hyphenated name - which is why it is not simply added to the class above.
const DANGLING_DASH = /^-+(?=\s|$)|\s-+$/g;

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
  // The code goes first and the verse numbers second: the "ESV [1] ..." shape
  // uses the bracket as its evidence, so removing the brackets first would take
  // that evidence away. Both run after the dash/space folding above, which is
  // what makes "ESV \u2014 In the beginning" reach the plain-hyphen shape.
  text = stripLeadingTranslationCode(text.trimStart());
  text = text.replace(BRACKETED_VERSE_NUMBER, "");
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
    text = text.replace(DANGLING_DASH, "");
    changed = text !== before;
  }
  return text;
};

export default sanitizeSharedText;
