'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../data.js');

// Independent reference values for the versioned frames were calculated
// outside the app implementation. The test parses raw bytes directly.
const expected = {
  intro: { length: 61, ipLength: 47, udpLength: 27, ttl: 64, ipChecksum: 0x3e6b, udpChecksum: 0xe550 },
  ethernet: { length: 60, ipLength: 46, udpLength: 26, ttl: 32, ipChecksum: 0x3c86, udpChecksum: 0x9e48 },
  ipv4: { length: 62, ipLength: 48, udpLength: 28, ttl: 128, ipChecksum: 0x63e6, udpChecksum: 0xfd29 },
  mixed: { length: 63, ipLength: 49, udpLength: 29, ttl: 96, ipChecksum: 0xdb76, udpChecksum: 0xc08f },
  compare: { length: 63, ipLength: 49, udpLength: 29, ttl: 95, ipChecksum: 0xdc76, udpChecksum: 0xc08f }
};

function checksum(bytes) {
  let sum = 0;
  for (let i = 0; i < bytes.length; i += 2) sum += (bytes[i] << 8) | (bytes[i + 1] || 0);
  while (sum > 0xffff) sum = (sum & 0xffff) + (sum >>> 16);
  return (~sum) & 0xffff;
}

test('original UDP frames retain valid Ethernet II, IPv4, and UDP structures', () => {
  assert.equal(data.version, '1.2.0');
  for (const [id, e] of Object.entries(expected)) {
    const frame = data.frames[id];
    const bytes = Buffer.from(frame.hex.replace(/\s+/g, ''), 'hex');
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

test('Echo Request and Reply have independent exact values and valid checksums', () => {
  const expectedEcho = {
    echoRequest: { ipId: 0x5101, ttl: 64, ipChecksum: 0xfd7b, type: 8, icmpChecksum: 0xa28c,
      source: '192.0.2.10', destination: '198.51.100.20' },
    echoReply: { ipId: 0x6202, ttl: 56, ipChecksum: 0xf47a, type: 0, icmpChecksum: 0xaa8c,
      source: '198.51.100.20', destination: '192.0.2.10' }
  };
  for (const [id, value] of Object.entries(expectedEcho)) {
    const bytes = Buffer.from(data.frames[id].hex.replace(/\s+/g, ''), 'hex');
    assert.equal(bytes.length, 60, id);
    assert.equal(bytes.readUInt16BE(12), 0x0800, id);
    assert.equal(bytes[14], 0x45, id);
    assert.equal(bytes.readUInt16BE(16), 46, id);
    assert.equal(bytes.readUInt16BE(18), value.ipId, id);
    assert.equal(bytes.readUInt16BE(20), 0x4000, id);
    assert.equal(bytes[22], value.ttl, id);
    assert.equal(bytes[23], 1, id);
    assert.equal(bytes.readUInt16BE(24), value.ipChecksum, id);
    assert.equal(checksum(bytes.subarray(14, 34)), 0, id);
    assert.equal(bytes[34], value.type, id);
    assert.equal(bytes[35], 0, id);
    assert.equal(bytes.readUInt16BE(36), value.icmpChecksum, id);
    assert.equal(checksum(bytes.subarray(34, 60)), 0, id);
    assert.equal(bytes.readUInt16BE(38), 0x1234, id);
    assert.equal(bytes.readUInt16BE(40), 1, id);
    assert.equal([...bytes.subarray(26, 30)].join('.'), value.source, id);
    assert.equal([...bytes.subarray(30, 34)].join('.'), value.destination, id);
    assert.equal(bytes.subarray(42).toString('ascii'), 'PING-LESSON-000001', id);
  }
});
