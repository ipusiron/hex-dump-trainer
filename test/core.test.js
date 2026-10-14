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

test('all 21 questions have unique IDs and valid byte-derived answers', () => {
  const ids = new Set();
  let count = 0;
  for (const lesson of data.lessons) {
    assert.ok(data.frames[lesson.frameId]);
    for (const question of lesson.questions) {
      assert.equal(ids.has(question.id), false);
      ids.add(question.id);
      const answer = core.answerFor(question, data.frames[lesson.frameId]);
      assert.ok(answer.end < core.parseHex(data.frames[lesson.frameId].hex).length);
      const response = question.kind === 'range'
        ? { start: String(answer.start), end: String(answer.end) }
        : { value: answer.value };
      assert.equal(core.grade(question, data.frames[lesson.frameId], response).ok, true);
      count += 1;
    }
  }
  assert.equal(count, 21);
});
