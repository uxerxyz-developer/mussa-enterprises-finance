/**
 * Shows Hindi (Devanagari) and Urdu (Arabic script) text in Roman Urdu. The speech-to-text of the voice assistant
 * often writes Urdu speech in Devanagari; this turns it into readable Roman letters. Latin text is left untouched.
 * It is an approximation meant for reading, not an exact spelling.
 */
const DEV_VOWELS: Record<string, string> = { "अ": "a", "आ": "a", "इ": "i", "ई": "i", "उ": "u", "ऊ": "u", "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "ऑ": "o" };
const DEV_MATRAS: Record<string, string> = { "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u", "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॉ": "o", "ॅ": "e" };
const DEV_CONS: Record<string, string> = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n", "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n", "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "f", "ब": "b", "भ": "bh", "म": "m", "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh", "ष": "sh", "स": "s", "ह": "h",
  "क़": "q", "ख़": "kh", "ग़": "gh", "ज़": "z", "ड़": "r", "ढ़": "rh", "फ़": "f",
};
const NUKTA = "़", VIRAMA = "्";
const DEV_RE = /[\u0900-\u097F]+/g;
const ARB_RE = /[\u0600-\u06FF\u0750-\u077F]+/g;

function devWord(w: string): string {
  const cs = [...w.normalize("NFC")];
  const out: { t: string; vowel: boolean; inherent?: boolean }[] = [];
  for (let i = 0; i < cs.length; i++) {
    let c = cs[i] ?? "";
    if (cs[i + 1] === NUKTA) { c = c + NUKTA; i++; }
    if (DEV_VOWELS[c]) {
      // A second vowel right after a vowel sound is spoken with a "y" in between (दिए = diye).
      const prev = out[out.length - 1];
      const glide = prev && /[aeiou]$/.test(prev.t) ? "y" : "";
      out.push({ t: glide + (DEV_VOWELS[c] ?? ""), vowel: true });
      continue;
    }
    if (DEV_MATRAS[c]) { out.push({ t: DEV_MATRAS[c] ?? "", vowel: true }); continue; }
    if (c === "ं" || c === "ँ") { out.push({ t: "n", vowel: false }); continue; }
    if (c === "ः") { out.push({ t: "h", vowel: false }); continue; }
    if (c === VIRAMA) { const last = out[out.length - 1]; if (last?.inherent) { last.t = last.t.replace(/a$/, ""); last.inherent = false; } continue; }
    const cons = DEV_CONS[c] ?? DEV_CONS[c.replace(NUKTA, "")];
    if (cons) {
      // A consonant carries an "a" unless a vowel sign or a virama follows.
      const nxt = cs[i + 1] ?? "";
      const hasSign = !!DEV_MATRAS[nxt] || nxt === VIRAMA;
      out.push({ t: hasSign ? cons : cons + "a", vowel: false, inherent: !hasSign });
      continue;
    }
    out.push({ t: c, vowel: false });
  }
  // Drop the inherent "a" at the end of a word and in the pattern vowel-consonant-[a]-consonant-vowel.
  for (let i = out.length - 1; i >= 0; i--) {
    const u = out[i];
    if (!u?.inherent) continue;
    const next = out[i + 1];
    const prev = out[i - 1];
    if (!next) { u.t = u.t.replace(/a$/, ""); continue; }
    if (next && /[aeiou]/.test(next.t) && next.vowel === false && !next.inherent && prev && /[aeiou]$/.test(prev.t) ) { u.t = u.t.replace(/a$/, ""); }
  }
  return out.map((u) => u.t).join("");
}

const ARB: Record<string, string> = {
  "ا": "a", "آ": "a", "ب": "b", "پ": "p", "ت": "t", "ٹ": "t", "ث": "s", "ج": "j", "چ": "ch", "ح": "h", "خ": "kh", "د": "d", "ڈ": "d",
  "ذ": "z", "ر": "r", "ڑ": "r", "ز": "z", "ژ": "zh", "س": "s", "ش": "sh", "ص": "s", "ض": "z", "ط": "t", "ظ": "z", "ع": "a", "غ": "gh",
  "ف": "f", "ق": "q", "ک": "k", "گ": "g", "ل": "l", "م": "m", "ن": "n", "ں": "n", "و": "o", "ہ": "h", "ھ": "h", "ء": "", "ی": "i", "ے": "e",
  "ئ": "i", "ؤ": "o", "ك": "k", "ي": "i", "ه": "h", "ۃ": "h", "ۓ": "e", "ٔ": "", "ً": "", "َ": "a", "ِ": "i", "ُ": "u", "ّ": "", "ْ": "",
};
function arbWord(w: string): string {
  let out = "";
  let prevCons = false;
  for (const c of w) {
    const r = ARB[c] ?? c;
    const isVowel = /^[aeiou]/.test(r);
    // Urdu text omits short vowels: put an "a" between two consonants so the word can be read.
    if (!isVowel && r && prevCons) out += "a";
    out += r;
    prevCons = !isVowel && !!r;
  }
  return out;
}

export function romanize(text: string): string {
  if (!text || !/[\u0600-\u06FF\u0750-\u077F\u0900-\u097F]/.test(text)) return text;
  return text.replace(DEV_RE, (m) => devWord(m)).replace(ARB_RE, (m) => arbWord(m)).replace(/[।॥]/g, ".").replace(/؟/g, "?").replace(/،/g, ",");
}
