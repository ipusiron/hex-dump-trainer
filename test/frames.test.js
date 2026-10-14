'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../data.js');

// Independent reference values for the four versioned frames were calculated
// outside the app implementation. The test parses raw bytes directly.
const expected = {
  intro: { length: 61, ipLength: 47, udpLength: 27, ttl: 64, ipChecksum: 0x3e6b, udpChecksum: 0xe550 },
  ethernet: { length: 60, ipLength: 46, udpLength: 26, ttl: 32, ipChecksum: 0x3c86, udpChecksum: 0x9e48 },
  ipv4: { length: 62, ipLength: 48, udpLength: 28, ttl: 128, ipChecksum: 0x63e6, udpChecksum: 0xfd29 },
  mixed: { length: 63, ipLength: 49, udpLength: 29, ttl: 96, ipChecksum: 0xdb76, udpChecksum: 0xc08f }
};

function checksum(bytes) {
  let sum = 0;
  for (let i = 0; i < bytes.length; i += 2) sum += (bytes[i] << 8) | (bytes[i + 1] || 0);
  while (sum > 0xffff) sum = (sum & 0xffff) + (sum >>> 16);
  return (~sum) & 0xffff;
}

test('all frames have valid Ethernet II, IPv4, and UDP structures', () => {
  assert.equal(data.version, '1.0.0');
  for (const [id, frame] of Object.entries(data.frames)) {
    const bytes = Buffer.from(frame.hex.replace(/\s+/g, ''), 'hex');
    const e = expected[id];
    assert.equal(frame.version, '1.0.0', id);
    assert.equal(bytes.length, e.length, id);
    assert.ok(bytes.length >= 60, `${id}: no Ethernet padding needed`);
    assert.equal(bytes[0] & 0x02, 0x02, `${id}: locally administered destination MAC`);
    assert.equal(bytes[6] & 0x02, 0x02, `${id}: locally administered source MAC`);
    assert.equal(bytes.readUInt16BE(12), 0x0800, id);
    assert.equal(bytes[14] >>> 4, 4, id);
    assert.equal(bytes[14] & 0x0f, 5, id);
    assert.equal(bytes.readUInt16BE(16), e.ipLength, id);
    assert.equal(bytes.length, 14 + e.ipLength, `${id}: no trailing FCS or padding`);
    assert.equal(bytes.readUInt16BE(20), 0x4000, `${id}: DF, offset zero`);
    assert.equal(bytes[22], e.ttl, id);
    assert.equal(bytes[23], 17, `${id}: UDP protocol`);
    assert.equal(bytes.readUInt16BE(24), e.ipChecksum, id);
    assert.equal(checksum(bytes.subarray(14, 34)), 0, `${id}: valid IPv4 header checksum`);
    assert.equal(bytes.readUInt16BE(38), e.udpLength, id);
    assert.equal(bytes.readUInt16BE(40), e.udpChecksum, id);
    assert.equal(e.udpLength, e.ipLength - 20, id);
    const pseudo = Buffer.concat([bytes.subarray(26, 34), Buffer.from([0, 17]),
      Buffer.from([e.udpLength >>> 8, e.udpLength & 255])]);
    assert.equal(checksum(Buffer.concat([pseudo, bytes.subarray(34)])), 0,
      `${id}: valid UDP checksum`);
    const source = bytes.subarray(26, 30);
    const destination = bytes.subarray(30, 34);
    const documentationPrefixes = ['192.0.2', '198.51.100', '203.0.113'];
    assert.ok(documentationPrefixes.includes(Array.from(source.subarray(0, 3)).join('.')), id);
    assert.ok(documentationPrefixes.includes(Array.from(destination.subarray(0, 3)).join('.')), id);
  }
});
