import { sanitizeSharedText } from "../../src/utils/sanitizeSharedText";

// Special characters are written as \u escapes so the test intent is explicit
// and the source file stays pure ASCII (no invisible nbsp / curly-quote bytes).
const EM_DASH = "—";
const EN_DASH = "–";
const LDQUO = "“";
const RDQUO = "”";
const RSQUO = "’";
const HELLIP = "…";
const NBSP = " ";
const NNBSP = " ";
const LAQUO = "«";
const RAQUO = "»";

describe("sanitizeSharedText", () => {
  it("trims surrounding whitespace", () => {
    expect(sanitizeSharedText("   John 3:16   ")).toBe("John 3:16");
  });

  it("normalizes em/en dashes to hyphen", () => {
    expect(sanitizeSharedText(`John 3:16${EM_DASH}17`)).toBe("John 3:16-17");
    expect(sanitizeSharedText(`John 3:16${EN_DASH}17`)).toBe("John 3:16-17");
  });

  it("normalizes curly double quotes to straight (when not wrapping)", () => {
    expect(sanitizeSharedText(`he said ${LDQUO}peace${RDQUO} to them`)).toBe(
      'he said "peace" to them'
    );
  });

  it("normalizes curly apostrophes to straight", () => {
    expect(sanitizeSharedText(`God${RSQUO}s love`)).toBe("God's love");
  });

  it("normalizes ellipsis to three dots", () => {
    expect(sanitizeSharedText(`and so on${HELLIP}`)).toBe("and so on...");
  });

  it("normalizes non-breaking spaces to regular spaces", () => {
    expect(sanitizeSharedText(`John${NBSP}3:16`)).toBe("John 3:16");
    expect(sanitizeSharedText(`John${NNBSP}3:16`)).toBe("John 3:16");
  });

  it("strips a trailing shared URL", () => {
    expect(
      sanitizeSharedText("John 3:16 https://www.bible.com/bible/59/JHN.3.16")
    ).toBe("John 3:16");
  });

  it("strips a www. URL without scheme", () => {
    expect(sanitizeSharedText("John 3:16 www.bible.com/x")).toBe("John 3:16");
  });

  it("strips wrapping straight quotes", () => {
    expect(sanitizeSharedText('"For God so loved the world"')).toBe(
      "For God so loved the world"
    );
  });

  it("strips wrapping guillemets", () => {
    expect(
      sanitizeSharedText(`${LAQUO}For God so loved the world${RAQUO}`)
    ).toBe("For God so loved the world");
  });

  it("strips wrapping curly quotes (after normalization)", () => {
    expect(
      sanitizeSharedText(`${LDQUO}For God so loved the world${RDQUO}`)
    ).toBe("For God so loved the world");
  });

  it("does NOT strip quotes that are two separate quoted spans", () => {
    expect(sanitizeSharedText('"peace" and "love"')).toBe(
      '"peace" and "love"'
    );
  });

  it("strips dangling separators at the ends", () => {
    expect(sanitizeSharedText("John 3:16,")).toBe("John 3:16");
    expect(sanitizeSharedText(";John 3:16;")).toBe("John 3:16");
  });

  it("peels quotes and dangling punctuation together", () => {
    expect(sanitizeSharedText('"John 3:16",')).toBe("John 3:16");
  });

  it("keeps the verse-internal colon of an address intact", () => {
    expect(sanitizeSharedText("John 3:16")).toBe("John 3:16");
  });

  it("handles a realistic YouVersion English share", () => {
    const shared =
      `${LDQUO}For God so loved the world, that he gave his only Son.${RDQUO}\n\n` +
      "John 3:16 ESV\n\n" +
      "https://www.bible.com/bible/59/JHN.3.16";
    // The wrapping quotes enclose only the first line (not the whole payload),
    // so they are normalized to straight but not peeled; the URL is gone.
    expect(sanitizeSharedText(shared)).toBe(
      '"For God so loved the world, that he gave his only Son."\n\n' +
        "John 3:16 ESV"
    );
  });

  it("handles a share with nbsp and an em dash", () => {
    const shared = `Rev${NBSP}22:21${EM_DASH}end`;
    expect(sanitizeSharedText(shared)).toBe("Rev 22:21-end");
  });

  it("returns an empty string for a URL-only share", () => {
    expect(sanitizeSharedText("https://bible.com/x")).toBe("");
  });

  // --- bracketed verse numbers -----------------------------------

  it("drops a leading bracketed verse number", () => {
    expect(sanitizeSharedText("[1] In the beginning God created")).toBe(
      "In the beginning God created"
    );
  });

  it("drops bracketed verse numbers from the middle of a range", () => {
    expect(
      sanitizeSharedText("[1] In the beginning [2] The earth was without form")
    ).toBe("In the beginning The earth was without form");
  });

  it("drops a two-digit and a chapter:verse bracketed number", () => {
    expect(sanitizeSharedText("[16] For God so loved")).toBe("For God so loved");
    expect(sanitizeSharedText("[3:16] For God so loved")).toBe(
      "For God so loved"
    );
  });

  it("drops a bracketed number padded with spaces", () => {
    expect(sanitizeSharedText("[ 12 ] and he said")).toBe("and he said");
  });

  it("keeps brackets around words - they are editorial apparatus", () => {
    expect(sanitizeSharedText("and [the] LORD said")).toBe("and [the] LORD said");
    expect(sanitizeSharedText("[a] note")).toBe("[a] note");
    expect(sanitizeSharedText("the [2nd] time")).toBe("the [2nd] time");
  });

  // --- leading translation code -----------------------------------

  it("drops a leading code standing in front of a verse number", () => {
    expect(sanitizeSharedText("ESV [1] In the beginning")).toBe(
      "In the beginning"
    );
    expect(sanitizeSharedText("NIV84 [1] In the beginning")).toBe(
      "In the beginning"
    );
  });

  it("drops a leading code with a registered mark", () => {
    expect(sanitizeSharedText("ESV\u00ae [1] In the beginning")).toBe(
      "In the beginning"
    );
  });

  it("drops a leading code separated by a colon or a dash", () => {
    expect(sanitizeSharedText("ESV: In the beginning")).toBe("In the beginning");
    expect(sanitizeSharedText("ESV - In the beginning")).toBe(
      "In the beginning"
    );
    // the dash folding runs first, so an em dash reaches the same shape
    expect(sanitizeSharedText(`ESV ${EM_DASH} In the beginning`)).toBe(
      "In the beginning"
    );
  });

  it("drops a leading code sitting alone on the first line", () => {
    expect(sanitizeSharedText("ESV\nIn the beginning")).toBe(
      "In the beginning"
    );
  });

  it("keeps an all-caps word that is part of the verse", () => {
    // the whole reason the three shapes above are narrow
    expect(sanitizeSharedText("LORD is my shepherd")).toBe(
      "LORD is my shepherd"
    );
    expect(sanitizeSharedText("I AM has sent me to you")).toBe(
      "I AM has sent me to you"
    );
  });

  it("keeps a code that is not leading", () => {
    expect(sanitizeSharedText("In the beginning ESV")).toBe(
      "In the beginning ESV"
    );
  });

  it("handles the whole shape another Bible app shares", () => {
    const shared =
      `ESV [1] ${LDQUO}In the beginning, God created the heavens${RDQUO} ` +
      "[2] The earth was without form.\n" +
      "https://www.bible.com/bible/59/GEN.1.1";
    expect(sanitizeSharedText(shared)).toBe(
      '"In the beginning, God created the heavens" The earth was without form.'
    );
  });
});
