'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');
const data = require('../data.js');

test('the worked example in both READMEs matches the versioned IPv4 bytes', () => {
  const answer = core.answerFor({ kind: 'value', field: 'totalLength', format: 'decimal' },
    data.frames.ipv4);
  assert.deepEqual([answer.start, answer.end, answer.rawHex, answer.value],
    [16, 17, '00 30', '48']);
  const japanese = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  const english = fs.readFileSync(path.join(__dirname, '..', 'README.en.md'), 'utf8');
  for (const text of [japanese, english]) {
    assert.ok(text.includes('`00 30`'));
    assert.ok(text.includes('`0x0030`'));
    assert.ok(text.includes('`48`'));
  }
  assert.ok(japanese.includes('`16〜17`'));
  assert.ok(english.includes('`16–17`'));
});

test('both READMEs describe the expanded exercises and link to current screenshots', () => {
  const japanese = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  const english = fs.readFileSync(path.join(__dirname, '..', 'README.en.md'), 'utf8');
  for (const text of [japanese, english]) {
    assert.ok(text.includes('32'));
    assert.ok(text.includes('UDP'));
    assert.ok(!text.includes('screenshot-desktop.png'));
    assert.ok(!text.includes('not graded'));
    for (const name of ['screenshot-desktop-20261015.png', 'screenshot-learning-20261015.png',
      'screenshot-comparison-20261015.png', 'screenshot-comparison-mobile-20261015.png']) {
      assert.ok(text.includes(`assets/${name}`));
      assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', name)), name);
    }
  }
  assert.ok(!japanese.includes('採点対象外'));
});

function grouped(number) {
  return String(number).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function hex4(number) {
  return '0x' + number.toString(16).toUpperCase().padStart(4, '0');
}

function usecaseBlock(text, label, nextLabel) {
  const start = text.indexOf(`\n${label}\n`);
  const end = text.indexOf(`\n${nextLabel}\n`, start + 1);
  assert.ok(start >= 0 && end > start, `${label} block`);
  return text.slice(start, end);
}

test('both READMEs open Use cases with the same three tool-specific uses recomputed from the frames', () => {
  const japanese = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
  const english = fs.readFileSync(path.join(__dirname, '..', 'README.en.md'), 'utf8');
  assert.ok(japanese.includes('## 🎯 ユースケース\n\nこのツールならではの使い方\n\n- '));
  assert.ok(english.includes('## 🎯 Use cases\n\nWays of using this tool in particular\n\n- '));
  assert.ok(japanese.includes('\n一般的な使い方\n\n- オフセット`12〜13`の`08 00`'));
  assert.ok(english.includes('\nGeneral uses\n\n- Read `08 00` at offsets `12–13`'));
  const ja = usecaseBlock(japanese, 'このツールならではの使い方', '一般的な使い方');
  const en = usecaseBlock(english, 'Ways of using this tool in particular', 'General uses');
  for (const block of [ja, en]) {
    assert.equal(block.split('\n').filter(line => line.startsWith('- ')).length, 3);
    assert.ok(!/\n#/.test(block), 'the labels stay plain lines, not headings');
  }

  const frames = data.frames;
  const answer = (field, frame, comparison) => core.answerFor({ field }, frame, comparison);
  // Read every frame through the lesson the README names, so that a change of a lesson's frames
  // or of its A/B assignment fails here. A is the reference frame; B is the frame the questions ask about.
  const lessonOf = id => {
    const lesson = data.lessons.find(l => l.id === id);
    assert.ok(lesson, `lesson ${id}`);
    return lesson;
  };
  const cmp = lessonOf('comparison');
  const ping = lessonOf('pingPair');
  const udp = lessonOf('udp');
  const cmpA = frames[cmp.compareFrameId];
  const cmpB = frames[cmp.frameId];
  const pingA = frames[ping.compareFrameId];
  const pingB = frames[ping.frameId];
  const udpFrame = frames[udp.frameId];

  // 1. A checksum is the inverted sum, so it rises by exactly what the 16-bit word lost.
  const firstChanged = answer('firstChangedByte', cmpB, cmpA);
  const ttlA = answer('ttl', cmpA);
  const ttlB = answer('ttl', cmpB);
  const ipA = answer('ipChecksum', cmpA).value;
  const ipB = answer('ipChecksum', cmpB).value;
  const before = core.parseHex(cmpA.hex);
  const after = core.parseHex(cmpB.hex);
  assert.deepEqual(Array.from(after.keys()).filter(i => after[i] !== before[i]), [22, 24]);
  assert.equal(firstChanged.value, String(ttlA.start));
  assert.equal(ttlA.relativeStart % 2, 0, 'TTL is the upper byte of its 16-bit word');
  const ttlDrop = ttlA.numericValue - ttlB.numericValue;
  const ipRise = Number(ipB) - Number(ipA);
  assert.equal(ttlDrop, 1);
  assert.equal(ipRise, ttlDrop * 256);

  const typeA = answer('icmpType', pingA);
  const typeB = answer('icmpType', pingB);
  const icmpChecksum = answer('icmpChecksum', pingA);
  const icmpA = icmpChecksum.value;
  const icmpB = answer('icmpChecksum', pingB).value;
  const request = core.parseHex(pingA.hex);
  const reply = core.parseHex(pingB.hex);
  const icmpChanged = Array.from(reply.keys()).filter(i => i >= typeA.start && reply[i] !== request[i]);
  assert.ok(icmpChanged.includes(typeA.start));
  assert.ok(icmpChanged.every(i => i === typeA.start ||
    (i >= icmpChecksum.start && i <= icmpChecksum.end)), 'only Type and the ICMP Checksum change');
  assert.equal(typeA.relativeStart % 2, 0, 'Type is the upper byte of its 16-bit word');
  const typeDrop = typeA.numericValue - typeB.numericValue;
  const icmpRise = Number(icmpB) - Number(icmpA);
  assert.equal(icmpRise, typeDrop * 256);

  // 2. The UDP lesson frame: data bytes against header bytes.
  const ethernetLength = answer('ipv4Start', udpFrame).numericValue;
  const udpLength = answer('udpLength', udpFrame).numericValue;
  const udpHeader = answer('udpHeader', udpFrame).numericValue;
  const totalLength = answer('totalLength', udpFrame).numericValue;
  const frameLength = core.parseHex(udpFrame.hex).length;
  const dataLength = udpLength - udpHeader;
  const headerBytes = frameLength - dataLength;
  assert.equal(ethernetLength + totalLength, frameLength);
  assert.equal(headerBytes, ethernetLength + answer('headerLength', udpFrame).numericValue + udpHeader);
  assert.equal(headerBytes * 3, frameLength * 2, 'exactly two thirds');

  // 3. The same two bytes read from the other end.
  const swapped = pingA.hex.split(' ');
  const id = answer('icmpIdentifier', pingA);
  const seq = answer('icmpSequence', pingA);
  for (const start of [id.start, seq.start]) {
    [swapped[start], swapped[start + 1]] = [swapped[start + 1], swapped[start]];
  }
  const reversed = { hex: swapped.join(' ') };
  const idOther = answer('icmpIdentifier', reversed).value;
  const seqOther = answer('icmpSequence', reversed).value;
  assert.equal(answer('icmpIdentifier', pingB).value, id.value);
  assert.equal(answer('icmpSequence', pingB).value, seq.value);
  const idNumber = core.answerFor({ field: 'icmpIdentifier', format: 'decimal' }, pingA).value;
  const idOtherNumber = core.answerFor({ field: 'icmpIdentifier', format: 'decimal' }, reversed).value;

  const expected = {
    ja: [
      `「${cmp.title.ja}」で最初に`,
      `オフセット\`${firstChanged.value}\`のTTL`,
      `TTLは\`${ttlA.value}\`から\`${ttlB.value}\`へ${ttlDrop}減り`,
      `\`${ipA}\`から\`${ipB}\`へ\`${hex4(ipRise)}\`（${grouped(ipRise)}）増える`,
      `${ttlDrop}減るとその16ビットの値は${grouped(ttlDrop * 256)}減り`,
      `「${ping.title.ja}」でもType`,
      `Typeが\`${typeA.value}\`から\`${typeB.value}\`になる`,
      `\`${icmpA}\`から\`${icmpB}\`へ\`${hex4(icmpRise)}\`（${grouped(icmpRise)}）増える`,
      `${typeDrop}減るとその16ビットの値は${grouped(typeDrop * 256)}減る`,
      `「${udp.title.ja}」の教材`,
      `UDPのLengthが\`${udpLength}\``,
      `UDPヘッダーの${udpHeader}バイトを引くとデータは${dataLength}バイト`,
      `Total Length \`${totalLength}\``,
      `Ethernet IIの${ethernetLength}バイトを足すと`,
      `フレームは${frameLength}バイト`,
      `そのうち${headerBytes}バイト、ちょうど3分の2`,
      `「${ping.title.ja}」のIdentifier`,
      `Identifier \`${id.rawHex}\``,
      `\`${id.value}\`（${grouped(idNumber)}）`,
      `\`${idOther}\`（${grouped(idOtherNumber)}）`,
      `Sequence Number \`${seq.rawHex}\`も${seq.value}と${seqOther}に分かれる`
    ],
    en: [
      `In ${cmp.title.en}, the first byte`,
      `the TTL at offset \`${firstChanged.value}\``,
      `drops by ${ttlDrop} from \`${ttlA.value}\` to \`${ttlB.value}\``,
      `rises by \`${hex4(ipRise)}\` (${grouped(ipRise)}) from \`${ipA}\` to \`${ipB}\``,
      `a drop of ${ttlDrop} lowers the word by ${grouped(ttlDrop * 256)}`,
      `Likewise, in ${ping.title.en}, Type`,
      `Type changes from \`${typeA.value}\` to \`${typeB.value}\``,
      `rises by \`${hex4(icmpRise)}\` (${grouped(icmpRise)}) from \`${icmpA}\` to \`${icmpB}\``,
      `a drop of ${typeDrop} lowers the word by ${grouped(typeDrop * 256)}`,
      `in the ${udp.title.en} lesson`,
      `the UDP Length is \`${udpLength}\``,
      `the ${udpHeader}-byte UDP header leaves ${dataLength} bytes of data`,
      `Adding the ${ethernetLength}-byte Ethernet II header`,
      `Total Length of \`${totalLength}\``,
      `a ${frameLength}-byte frame`,
      `of which ${headerBytes} bytes, exactly two thirds`,
      `in ${ping.title.en} is`,
      `The Identifier \`${id.rawHex}\``,
      `\`${id.value}\` (${grouped(idNumber)})`,
      `\`${idOther}\` (${grouped(idOtherNumber)})`,
      `The Sequence Number \`${seq.rawHex}\` likewise splits into ${seq.value} and ${seqOther}`
    ]
  };
  for (const [locale, block] of [['ja', ja], ['en', en]]) {
    for (const phrase of expected[locale]) {
      assert.ok(block.includes(phrase), `${locale} is missing: ${phrase}`);
    }
  }
  assert.deepEqual([ipRise, typeDrop, icmpRise, ethernetLength, dataLength, headerBytes, frameLength,
    Number(idNumber), Number(idOtherNumber), Number(seq.value), Number(seqOther)],
  [256, 8, 2048, 14, 21, 42, 63, 4660, 13330, 1, 256]);
});
