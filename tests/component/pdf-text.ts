// Minimal PDF text extractor for the résumé PDFs (no dependency, ADR-0010, R-301). It reads what Chromium
// writes: classic objects, Flate streams, Type0 and Type3 fonts with a ToUnicode map. It is not a general PDF
// reader. The page count comes from the page tree, the text from each page's content streams in order, so the
// result is what a text-based reader (and an ATS) gets from the file.
import { inflateSync } from 'node:zlib';

type PdfObject = { dict: string; stream?: Buffer };

function parseObjects(pdf: Buffer): Map<number, PdfObject> {
  const raw = pdf.toString('latin1');
  const objects = new Map<number, PdfObject>();
  const start = /(?:^|[\r\n])(\d+) \d+ obj\b/g;
  const marks = [...raw.matchAll(start)];
  marks.forEach((m, i) => {
    const bodyStart = m.index + m[0].length;
    const end = raw.indexOf('endobj', bodyStart);
    const body = raw.slice(bodyStart, end < 0 ? raw.length : end);
    const s = /\bstream\r?\n/.exec(body);
    const num = Number(m[1]);
    if (!s) {
      objects.set(num, { dict: body });
      return;
    }
    const dict = body.slice(0, s.index);
    const dataStart = bodyStart + s.index + s[0].length;
    const dataEnd = raw.lastIndexOf('endstream', end < 0 ? raw.length : end);
    let data = pdf.subarray(dataStart, dataEnd);
    if (/\/FlateDecode/.test(dict)) data = inflateSync(data.subarray(0, data.length));
    objects.set(num, { dict, stream: data });
    void i;
  });
  return objects;
}

const refs = (s: string): number[] => [...s.matchAll(/(\d+) \d+ R/g)].map((m) => Number(m[1]));

/** Page object numbers in reading order, following /Kids from the root /Pages node. */
function pageOrder(objects: Map<number, PdfObject>): number[] {
  const isPages = (o: PdfObject): boolean => /\/Type\s*\/Pages\b/.test(o.dict);
  const isPage = (o: PdfObject): boolean => /\/Type\s*\/Page\b(?!s)/.test(o.dict);
  const walk = (n: number): number[] => {
    const o = objects.get(n);
    if (!o) return [];
    if (isPage(o)) return [n];
    const kids = /\/Kids\s*\[([^\]]*)\]/.exec(o.dict);
    return kids ? refs(kids[1] ?? '').flatMap(walk) : [];
  };
  const root = [...objects].find(([, o]) => isPages(o) && !/\/Parent\b/.test(o.dict));
  if (root) return walk(root[0]);
  return [...objects].filter(([, o]) => isPage(o)).map(([n]) => n);
}

type CMap = { width: number; map: Map<number, string> };

const utf16 = (hex: string): string => {
  let s = '';
  for (let i = 0; i + 4 <= hex.length; i += 4)
    s += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16));
  return s;
};

function parseCMap(text: string): CMap {
  const map = new Map<number, string>();
  const space = /begincodespacerange\s*<([0-9a-fA-F]+)>/.exec(text);
  const width = space ? (space[1]?.length ?? 2) / 2 : 1;
  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const m of (block[1] ?? '').matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g))
      map.set(parseInt(m[1] ?? '0', 16), utf16(m[2] ?? ''));
  }
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    const body = block[1] ?? '';
    for (const m of body.matchAll(
      /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<[0-9a-fA-F]+>|\[[^\]]*\])/g,
    )) {
      const lo = parseInt(m[1] ?? '0', 16);
      const hi = parseInt(m[2] ?? '0', 16);
      const dst = m[3] ?? '';
      if (dst.startsWith('[')) {
        [...dst.matchAll(/<([0-9a-fA-F]+)>/g)].forEach((d, i) =>
          map.set(lo + i, utf16(d[1] ?? '')),
        );
      } else {
        const base = utf16(dst.slice(1, -1));
        for (let c = lo; c <= hi; c++) {
          const last = base.charCodeAt(base.length - 1) + (c - lo);
          map.set(c, base.slice(0, -1) + String.fromCharCode(last));
        }
      }
    }
  }
  return { width, map };
}

type Token = { t: 'op' | 'name' | 'num' | 'hex' | 'str' | 'arr'; v: string | number | Token[] };

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  const stack: Token[][] = [out];
  const push = (tok: Token): void => void stack[stack.length - 1]?.push(tok);
  let i = 0;
  const ws = /[\s\0]/;
  while (i < src.length) {
    const c = src[i] ?? '';
    if (ws.test(c)) i++;
    else if (c === '%') i = src.indexOf('\n', i) < 0 ? src.length : src.indexOf('\n', i) + 1;
    else if (c === '[') {
      const arr: Token = { t: 'arr', v: [] };
      push(arr);
      stack.push(arr.v as Token[]);
      i++;
    } else if (c === ']') {
      if (stack.length > 1) stack.pop();
      i++;
    } else if (c === '<' && src[i + 1] === '<') {
      push({ t: 'op', v: '<<' });
      i += 2;
    } else if (c === '>' && src[i + 1] === '>') {
      push({ t: 'op', v: '>>' });
      i += 2;
    } else if (c === '<') {
      const end = src.indexOf('>', i);
      push({ t: 'hex', v: src.slice(i + 1, end).replace(/\s+/g, '') });
      i = end + 1;
    } else if (c === '(') {
      let depth = 1;
      let s = '';
      i++;
      while (i < src.length && depth > 0) {
        const ch = src[i] ?? '';
        if (ch === '\\') {
          s += src[i + 1] ?? '';
          i += 2;
          continue;
        }
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (depth > 0) s += ch;
        i++;
      }
      push({ t: 'str', v: s });
    } else if (c === '/') {
      const m = /^\/[^\s/<>[\]()%]*/.exec(src.slice(i, i + 200));
      push({ t: 'name', v: (m?.[0] ?? '/').slice(1) });
      i += m?.[0].length ?? 1;
    } else {
      const m = /^[^\s/<>[\]()%]+/.exec(src.slice(i, i + 200));
      const word = m?.[0] ?? c;
      i += word.length || 1;
      const n = Number(word);
      push(Number.isNaN(n) ? { t: 'op', v: word } : { t: 'num', v: n });
    }
  }
  return out;
}

function decode(font: CMap | undefined, tok: Token): string {
  if (!font) return '';
  let bytes: number[];
  if (tok.t === 'hex') {
    const hex = String(tok.v);
    bytes = (hex.match(/../g) ?? []).map((h) => parseInt(h, 16));
  } else {
    bytes = [...String(tok.v)].map((ch) => ch.charCodeAt(0) & 255);
  }
  let s = '';
  for (let i = 0; i + font.width <= bytes.length; i += font.width) {
    let code = 0;
    for (let k = 0; k < font.width; k++) code = code * 256 + (bytes[i + k] ?? 0);
    s += font.map.get(code) ?? '';
  }
  return s;
}

function pageText(content: string, fonts: Map<string, CMap>): string {
  const toks = tokenize(content);
  let font: CMap | undefined;
  let out = '';
  let operands: Token[] = [];
  let y = Number.NaN;
  const newLine = (ny: number): void => {
    if (Number.isNaN(y) || Math.abs(ny - y) > 1) out += '\n';
    y = ny;
  };
  for (const tok of toks) {
    if (tok.t !== 'op') {
      operands.push(tok);
      continue;
    }
    const nums = operands.filter((o) => o.t === 'num').map((o) => Number(o.v));
    switch (tok.v) {
      case 'Tf':
        font = fonts.get(String(operands[0]?.v ?? ''));
        break;
      case 'Tm':
        newLine(nums[5] ?? y);
        break;
      case 'Td':
      case 'TD':
        newLine((Number.isNaN(y) ? 0 : y) + (nums[1] ?? 0));
        break;
      case 'T*':
        out += '\n';
        break;
      case 'Tj': {
        const s = operands[0];
        if (s) out += decode(font, s);
        break;
      }
      case 'TJ': {
        for (const part of (operands[0]?.v as Token[] | undefined) ?? []) {
          if (part.t === 'num') {
            if (Number(part.v) < -250) out += ' ';
          } else out += decode(font, part);
        }
        break;
      }
      default:
        break;
    }
    operands = [];
  }
  return out;
}

export function extractPdfText(pdf: Uint8Array): { pages: number; text: string } {
  const buf = Buffer.from(pdf);
  const objects = parseObjects(buf);
  const order = pageOrder(objects);
  const cmaps = new Map<number, CMap>();
  const cmapOf = (fontObj: number): CMap | undefined => {
    const cached = cmaps.get(fontObj);
    if (cached) return cached;
    const f = objects.get(fontObj);
    const tu = f ? /\/ToUnicode (\d+) \d+ R/.exec(f.dict) : null;
    const stream = tu ? objects.get(Number(tu[1]))?.stream : undefined;
    if (!stream) return undefined;
    const parsed = parseCMap(stream.toString('latin1'));
    cmaps.set(fontObj, parsed);
    return parsed;
  };
  const texts: string[] = [];
  for (const n of order) {
    const page = objects.get(n);
    if (!page) continue;
    const resDict = /\/Resources (\d+) \d+ R/.exec(page.dict);
    const resources = resDict ? (objects.get(Number(resDict[1]))?.dict ?? '') : page.dict;
    const fontRef = /\/Font (\d+) \d+ R/.exec(resources);
    const fontDict = fontRef
      ? (objects.get(Number(fontRef[1]))?.dict ?? '')
      : (/\/Font\s*<<([\s\S]*?)>>/.exec(resources)?.[1] ?? '');
    const fonts = new Map<string, CMap>();
    for (const m of fontDict.matchAll(/\/([^\s/<>[\]]+)\s+(\d+) \d+ R/g)) {
      const cm = cmapOf(Number(m[2]));
      if (cm) fonts.set(m[1] ?? '', cm);
    }
    const contents = /\/Contents\s*(\[[^\]]*\]|\d+ \d+ R)/.exec(page.dict)?.[1] ?? '';
    const stream = refs(contents)
      .map((r) => objects.get(r)?.stream?.toString('latin1') ?? '')
      .join('\n');
    texts.push(pageText(stream, fonts));
  }
  return { pages: order.length, text: texts.join('\n').replace(/^\n/, '') };
}
