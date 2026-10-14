const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');
const data = require('../data.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const bytes = core.parseHex(data.frames.ipv4.hex);

function raw(start, end) {
  return Array.from(bytes.slice(start, end + 1), value => value.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function word(start) {
  return (bytes[start] << 8) | bytes[start + 1];
}

test('learning examples in both languages match the versioned IPv4 lesson frame', () => {
  const examples = [
    raw(0, 5), raw(6, 11), raw(12, 13), raw(16, 17), raw(18, 19), raw(20, 21), raw(24, 25),
    raw(26, 29), raw(30, 33), raw(34, 35), raw(36, 37), raw(38, 39), raw(40, 41)
  ];
  assert.equal(bytes.length, 62);
  assert.equal(bytes[14], 0x45);
  assert.equal(word(16), 48);
  assert.equal(bytes[22], 128);
  assert.equal(bytes[23], 17);
  assert.equal(word(34), 55000);
  assert.equal(word(36), 53);
  assert.equal(word(38), 28);

  for (const locale of ['ja', 'en']) {
    const section = html.split(`<div id="learn-${locale}"`)[1];
    assert.ok(section, `missing ${locale} learning content`);
    for (const hex of examples) {
      assert.ok(section.includes(`<code>${hex}</code>`), `${locale} is missing ${hex}`);
    }
    for (const url of [
      'https://datatracker.ietf.org/doc/html/rfc894',
      'https://www.rfc-editor.org/rfc/rfc791.html',
      'https://www.rfc-editor.org/rfc/rfc768.html',
      'https://www.iana.org/assignments/protocol-numbers/'
    ]) {
      assert.ok(section.includes(`href="${url}" target="_blank" rel="noopener noreferrer"`));
    }
  }
});

test('exercise and learning tabs have accessible relationships', () => {
  assert.match(html, /id="practice-tab"[^>]*role="tab"[^>]*aria-controls="practice-panel"/);
  assert.match(html, /id="learn-tab"[^>]*role="tab"[^>]*aria-controls="learn-panel"/);
  assert.match(html, /id="practice-panel"[^>]*role="tabpanel"[^>]*aria-labelledby="practice-tab"/);
  assert.match(html, /id="learn-panel"[^>]*role="tabpanel"[^>]*aria-labelledby="learn-tab"/);
});

test('bilingual packet diagrams preserve the sample values and field widths', () => {
  const expectedValues = [
    ['02 FE DC BA 98 76', '02 12 34 56 78 9A', '08 00'],
    ['4', '5', '00', '00 30'],
    ['30 03', '010', '0'],
    ['80', '11', '63 E6'],
    ['C6 33 64 4D'],
    ['CB 00 71 52'],
    ['D6 D8', '00 35'],
    ['00 1C', 'FD 29']
  ];
  assert.equal((bytes[14] >> 4).toString(), expectedValues[1][0]);
  assert.equal((bytes[14] & 0x0f).toString(), expectedValues[1][1]);
  assert.equal(bytes[15].toString(16).padStart(2, '0').toUpperCase(), expectedValues[1][2]);
  assert.equal(((word(20) >> 13) & 7).toString(2).padStart(3, '0'), expectedValues[2][1]);
  assert.equal((word(20) & 0x1fff).toString(), expectedValues[2][2]);

  for (const locale of ['ja', 'en']) {
    const section = html.split(`<div id="learn-${locale}"`)[1].split(locale === 'ja' ? '<div id="learn-en"' : '</section>\n  </main>')[0];
    const rows = [...section.matchAll(/<div class="diagram-cells diagram-cells--(bytes|bits)">([\s\S]*?)<\/div>/g)];
    assert.equal(rows.length, 8, `${locale} diagram row count`);
    assert.equal((section.match(/class="diagram-scroll" role="region"/g) || []).length, 3);

    rows.forEach((row, index) => {
      const fields = [...row[2].matchAll(/<span class="diagram-field span-(\d+)" data-learn-field="[^"]+"><strong>[^<]+<\/strong><code>([^<]+)<\/code><\/span>/g)];
      const expectedWidth = index === 0 ? 14 : 32;
      assert.equal(row[1], index === 0 ? 'bytes' : 'bits');
      assert.equal(fields.reduce((sum, field) => sum + Number(field[1]), 0), expectedWidth, `${locale} row ${index} width`);
      assert.deepEqual(fields.map(field => field[2]), expectedValues[index], `${locale} row ${index} values`);
    });
  }
});

test('each diagram field has exactly one matching explanation row in both languages', () => {
  for (const locale of ['ja', 'en']) {
    const section = html.split(`<div id="learn-${locale}"`)[1].split(locale === 'ja' ? '<div id="learn-en"' : '</section>\n  </main>')[0];
    const diagramKeys = [...section.matchAll(/<span class="diagram-field span-\d+" data-learn-field="([^"]+)"/g)].map(match => match[1]);
    const rowKeys = [...section.matchAll(/<div data-learn-field="([^"]+)"><dt>/g)].map(match => match[1]);
    assert.equal(diagramKeys.length, 19, `${locale} field count`);
    assert.equal(new Set(diagramKeys).size, 19, `${locale} unique diagram fields`);
    assert.deepEqual(rowKeys, diagramKeys, `${locale} diagram-to-explanation order`);
    assert.deepEqual(new Set(diagramKeys), new Set(Object.keys(data.learningFields)), `${locale} range metadata`);
    const dumpHeaders = [...section.matchAll(/<section class="learning-dump-panel" data-learn-header="([^"]+)"><\/section>/g)]
      .map(match => match[1]);
    assert.deepEqual(dumpHeaders, ['ethernet', 'ipv4', 'udp'], `${locale} header dumps`);
  }
});

test('learning field ranges cover the sample headers and align with eight-byte dump rows', () => {
  const expected = {
    'ether-dst': ['ethernet', 0, 5], 'ether-src': ['ethernet', 6, 11], 'ether-type': ['ethernet', 12, 13],
    'ip-version': ['ipv4', 14, 14], 'ip-ihl': ['ipv4', 14, 14], 'ip-tos': ['ipv4', 15, 15],
    'ip-total': ['ipv4', 16, 17], 'ip-id': ['ipv4', 18, 19], 'ip-flags': ['ipv4', 20, 21],
    'ip-fragment': ['ipv4', 20, 21], 'ip-ttl': ['ipv4', 22, 22], 'ip-protocol': ['ipv4', 23, 23],
    'ip-checksum': ['ipv4', 24, 25], 'ip-src': ['ipv4', 26, 29], 'ip-dst': ['ipv4', 30, 33],
    'udp-src': ['udp', 34, 35], 'udp-dst': ['udp', 36, 37], 'udp-length': ['udp', 38, 39],
    'udp-checksum': ['udp', 40, 41]
  };
  assert.deepEqual(Object.fromEntries(Object.entries(data.learningFields).map(([key, field]) => [
    key, [field.header, field.start, field.end]
  ])), expected);

  const expectedRows = { ethernet: [0, 8], ipv4: [8, 16, 24, 32], udp: [32, 40] };
  const rows = core.dumpRows(bytes, 8);
  for (const [header, bounds] of Object.entries(data.learningHeaders)) {
    const fields = Object.values(data.learningFields).filter(field => field.header === header);
    const covered = new Set(fields.flatMap(field => Array.from(
      { length: field.end - field.start + 1 }, (_, index) => field.start + index
    )));
    assert.deepEqual([...covered].sort((a, b) => a - b), Array.from(
      { length: bounds.end - bounds.start + 1 }, (_, index) => bounds.start + index
    ));
    assert.deepEqual(rows.filter(row => row.bytes.some(byte =>
      byte.offset >= bounds.start && byte.offset <= bounds.end
    )).map(row => row.offset), expectedRows[header]);
  }
});
