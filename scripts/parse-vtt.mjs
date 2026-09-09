import fs from 'node:fs';

const inPath = process.argv[2];
const outPath = process.argv[3];
const raw = fs.readFileSync(inPath, 'utf8');
const lines = raw.split(/\r?\n/);
const turns = [];
let i = 0;
while (i < lines.length) {
  const line = lines[i];
  if (/^\d\d:\d\d:\d\d\.\d+ --> /.test(line)) {
    i++;
    const textLines = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i]);
      i++;
    }
    const full = textLines.join(' ');
    const m = full.match(/^<v ([^>]+)>(.*)<\/v>$/);
    if (m) {
      turns.push({ speaker: m[1].trim(), text: m[2].trim() });
    } else {
      turns.push({ speaker: null, text: full.replace(/<\/?v[^>]*>/g, '').trim() });
    }
  } else {
    i++;
  }
}

const merged = [];
for (const t of turns) {
  const last = merged[merged.length - 1];
  if (last && last.speaker === t.speaker) {
    last.text += ' ' + t.text;
  } else {
    merged.push({ speaker: t.speaker, text: t.text });
  }
}

const out = merged.map((t) => (t.speaker ? t.speaker + ': ' : '') + t.text).join('\n\n');
fs.writeFileSync(outPath, out, 'utf8');
console.log('turnos originales:', turns.length, '-> fusionados:', merged.length);
console.log('caracteres:', out.length);
