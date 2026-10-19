// R-305: the phone number never appears in JSON-LD or meta tags. This check is stricter than the rule: it looks
// for the number anywhere in the <head> of a built page, in any formatting, with or without the country code.
// The visible tel: link in the body is allowed, so only the head is scanned.
import { decodeEntities } from './headers-checks';

/** The last ten digits of a phone number. Any formatting and any country code collapse to the same value. */
export function lastTenDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10)
    throw new Error(`phone number has ${digits.length} digits, need at least 10`);
  return digits.slice(-10);
}

/** Returns the raw HTML between `<head` and `</head>`, or undefined when the page has no head. */
export function headHtml(html: string): string | undefined {
  const lower = html.toLowerCase();
  const open = lower.indexOf('<head');
  if (open < 0) return undefined;
  const start = lower.indexOf('>', open);
  const end = lower.indexOf('</head', start);
  if (start < 0 || end < 0) return undefined;
  return html.slice(start + 1, end);
}

/** Replaces JSON `\uXXXX` escapes with the character, as JSON.parse would. */
function decodeJsonEscapes(text: string): string {
  return text.replace(/\\u([0-9a-f]{4})/gi, (_m, h: string) =>
    String.fromCharCode(parseInt(h, 16)),
  );
}

/**
 * One message per place where the head holds the number. The head is cut into chunks at tags, quotes and line
 * breaks, so each attribute value, text node and JSON string is checked alone. A chunk leaks when its digits,
 * with everything else removed, contain the last ten digits of the number. Entities and JSON escapes are
 * decoded first, so `&#40;240&#41; 495-9682` and `240...` are caught.
 */
export function phoneLeaks(head: string, phone: string): string[] {
  const want = lastTenDigits(phone);
  const out: string[] = [];
  for (const raw of head.split(/[<>"'\r\n]/)) {
    const chunk = decodeJsonEscapes(decodeEntities(raw));
    if (chunk.replace(/\D/g, '').includes(want)) {
      out.push(chunk.length > 80 ? `${chunk.slice(0, 80)}...` : chunk);
    }
  }
  return out;
}
