'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');
const data = require('../data.js');

test('hex bytes and zero-based dump offsets are rendered consistently', () => {
  const bytes = core.parseHex('00 1f 20 41 7f');
  assert.deepEqual(Array.from(bytes), [0, 31, 32, 65, 127]);
  assert.deepEqual(core.dumpRows(bytes, 4).map(row => [row.offsetHex, row.ascii]),
    [['0000', '.. A'], ['0004', '.']]);
  assert.throws(() => core.parseHex('0'), /Invalid/);
  assert.throws(() => core.parseHex('00 GG'), /Invalid/);
});

test('answer values are read from the frame bytes, not exercise prose', () => {
  const frame = data.frames.ipv4;
  const cases = [
    ['version', '4', 14, 14, '45'],
    ['ihl', '5', 14, 14, '45'],
    ['headerLength', '20', 14, 14, '45'],
    ['totalLength', '48', 16, 17, '00 30'],
    ['ttl', '128', 22, 22, '80'],
    ['protocol', '17', 23, 23, '11'],
    ['sourceIp', '198.51.100.77', 26, 29, 'C6 33 64 4D'],
    ['destinationIp', '203.0.113.82', 30, 33, 'CB 00 71 52']
  ];
  for (const [field, value, start, end, rawHex] of cases) {
    const actual = core.answerFor({ kind: 'value', field }, frame);
    assert.deepEqual([actual.value, actual.start, actual.end, actual.rawHex],
      [value, start, end, rawHex], field);
  }
  assert.equal(core.answerFor({ field: 'etherType' }, frame).value, '0x0800');
  assert.equal(core.answerFor({ field: 'destinationMac' }, frame).value,
    '02:FE:DC:BA:98:76');
});

test('range grading requires the exact inclusive start and end', () => {
  const question = { kind: 'range', field: 'sourceIp' };
  const frame = data.frames.ipv4;
  assert.deepEqual(core.grade(question, frame, { start: '26', end: '29' }),
    { ok: true, valid: true });
  assert.equal(core.grade(question, frame, { start: '26', end: '28' }).ok, false);
  assert.equal(core.grade(question, frame, { start: '29', end: '26' }).valid, false);
  assert.equal(core.grade(question, frame, { start: '-1', end: '29' }).valid, false);
  assert.equal(core.grade(question, frame, { start: '26x', end: '29' }).valid, false);
  assert.equal(core.grade(question, frame, { start: '26', end: '999' }).valid, false);
});

test('value grading checks the complete requested notation', () => {
  const frame = data.frames.ethernet;
  const mac = { kind: 'value', field: 'sourceMac', format: 'mac' };
  const type = { kind: 'value', field: 'etherType', format: 'hex' };
  assert.equal(core.grade(mac, frame, { value: '02:42:ac:11:00:02' }).ok, true);
  assert.equal(core.grade(mac, frame, { value: '02:42:AC:11:00:02x' }).valid, false);
  assert.equal(core.grade(type, frame, { value: '0x0800' }).ok, true);
  assert.equal(core.grade(type, frame, { value: '800' }).valid, false);
  assert.equal(core.grade(type, frame, { value: '0x800' }).ok, false);
  assert.equal(core.grade(type, frame, { value: ' 0x0800' }).valid, false);
  assert.equal(core.grade({ kind: 'calc', field: 'headerLength' }, data.frames.ipv4,
    { value: '20' }).ok, true);
  assert.equal(core.grade({ kind: 'calc', field: 'headerLength' }, data.frames.ipv4,
    { value: '20 bytes' }).valid, false);
});

test('all 45 questions have unique IDs and valid byte-derived answers', () => {
  const ids = new Set();
  let count = 0;
  for (const lesson of data.lessons) {
    assert.ok(data.frames[lesson.frameId]);
    for (const question of lesson.questions) {
      assert.equal(ids.has(question.id), false);
      ids.add(question.id);
      const comparison = lesson.compareFrameId ? data.frames[lesson.compareFrameId] : null;
      const answer = core.answerFor(question, data.frames[lesson.frameId], comparison);
      assert.ok(answer.end < core.parseHex(data.frames[lesson.frameId].hex).length);
      const response = question.kind === 'range'
        ? { start: String(answer.start), end: String(answer.end) }
        : { value: answer.value };
      assert.equal(core.grade(question, data.frames[lesson.frameId], response, comparison).ok, true);
      count += 1;
    }
  }
  assert.equal(count, 45);
});

test('ICMPv4 Echo answers use request and reply bytes, including moved IHL', () => {
  const request = data.frames.echoRequest;
  const reply = data.frames.echoReply;
  for (const [field, start, end, value] of [
    ['icmpStart', 34, 34, '34'], ['icmpHeader', 34, 41, '8'],
    ['icmpType', 34, 34, '8'], ['icmpCode', 35, 35, '0'],
    ['icmpChecksum', 36, 37, '0xA28C'], ['icmpIdentifier', 38, 39, '0x1234'],
    ['icmpSequence', 40, 41, '1']
  ]) {
    const answer = core.answerFor({ field }, request);
    assert.deepEqual([answer.start, answer.end, answer.value], [start, end, value], field);
  }
  assert.equal(core.answerFor({ field: 'icmpType' }, reply).value, '0');
  assert.equal(core.answerFor({ field: 'icmpChecksum' }, reply).value, '0xAA8C');
  assert.equal(core.answerFor({ field: 'sourceIp' }, reply).value, '198.51.100.20');
  const longer = request.hex.split(' ');
  longer[14] = '46';
  longer[17] = '32';
  longer.splice(34, 0, '01', '02', '03', '04');
  assert.equal(core.answerFor({ field: 'icmpType' }, { hex: longer.join(' ') }).start, 38);
});

test('header boundaries and UDP answers come from bytes, including a longer IHL', () => {
  const frame = data.frames.mixed;
  const cases = [
    ['ipv4Start', 14, 14, '14'],
    ['ipv4Header', 14, 33, '20'],
    ['udpStart', 34, 34, '34'],
    ['udpHeader', 34, 41, '8'],
    ['udpSourcePort', 34, 35, '12345'],
    ['udpDestinationPort', 36, 37, '65000'],
    ['udpLength', 38, 39, '29'],
    ['udpChecksum', 40, 41, '0xC08F']
  ];
  for (const [field, start, end, value] of cases) {
    const answer = core.answerFor({ field }, frame);
    assert.deepEqual([answer.start, answer.end, answer.value], [start, end, value], field);
  }
  const longer = frame.hex.split(' ');
  longer[14] = '46';
  longer[17] = '35';
  longer.splice(34, 0, '01', '02', '03', '04');
  const changed = { hex: longer.join(' ') };
  assert.deepEqual(core.packetLayout(core.parseHex(changed.hex)),
    { ipv4Start: 14, ipv4Length: 24, udpStart: 38 });
  assert.deepEqual([core.answerFor({ field: 'ipv4Header' }, changed).end,
    core.answerFor({ field: 'udpStart' }, changed).start,
    core.answerFor({ field: 'udpSourcePort' }, changed).start], [37, 38, 38]);
  longer[12] = '86';
  assert.throws(() => core.answerFor({ field: 'udpStart' }, { hex: longer.join(' ') }), /Ethernet II/);
});

test('comparison frame changes TTL and IPv4 checksum but not UDP', () => {
  const before = core.parseHex(data.frames.mixed.hex);
  const after = core.parseHex(data.frames.compare.hex);
  assert.deepEqual(Array.from(after.keys()).filter(i => after[i] !== before[i]), [22, 24]);
  assert.equal(core.answerFor({ field: 'firstChangedByte' }, data.frames.compare, data.frames.mixed).value, '22');
  assert.equal(core.grade({ kind: 'compare', field: 'firstChangedByte' }, data.frames.compare,
    { value: '22' }, data.frames.mixed).ok, true);
  assert.equal(core.grade({ kind: 'compare', field: 'ttl' }, data.frames.compare, { value: '95' }).ok, true);
  assert.equal(core.grade({ kind: 'compare', field: 'ipChecksum' }, data.frames.compare, { value: '0xDC76' }).ok, true);
  assert.equal(core.grade({ kind: 'compare', field: 'ttl' }, data.frames.compare, { value: '96' }).ok, false);
});
