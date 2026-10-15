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
