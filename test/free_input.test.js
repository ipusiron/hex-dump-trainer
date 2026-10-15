'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');
const data = require('../data.js');

const mixed = core.parseHex(data.frames.mixed.hex);

test('raw and contiguous offset rows produce the same bounded frame', () => {
  assert.deepEqual(core.parseDumpText('02 de AD 00', 'raw'), Uint8Array.from([2, 222, 173, 0]));
  assert.deepEqual(core.parseDumpText('02de\nAD00', 'raw'), Uint8Array.from([2, 222, 173, 0]));
  assert.deepEqual(core.parseDumpText('0000: 02 DE AD\n0003: 00', 'offset'),
    Uint8Array.from([2, 222, 173, 0]));
  for (const [input, mode, code] of [
    ['', 'raw', 'empty'], ['02 0', 'raw', 'invalidRaw'],
    ['02 <script>', 'raw', 'invalidRaw'], ['0000: 02 GG', 'offset', 'invalidOffsetRow'],
    ['0000: 02\n0002: 03', 'offset', 'offsetGap'],
    ['0000: 02 |x|', 'offset', 'invalidOffsetRow'],
    ['02', 'unknown', 'unknownMode']
  ]) {
    assert.throws(() => core.parseDumpText(input, mode), error => error.code === code);
  }
  assert.throws(() => core.parseDumpText(' '.repeat(core.MAX_INPUT_CHARS + 1), 'raw'),
    error => error.code === 'textTooLong');
  assert.throws(() => core.parseDumpText('00 '.repeat(core.MAX_FRAME_BYTES + 1), 'raw'),
    error => error.code === 'tooManyBytes');
});

test('complete Ethernet II, IPv4, and UDP fields map to exact bytes', () => {
  const report = core.inspectPacket(mixed);
  assert.deepEqual(report.warnings, []);
  const byKey = Object.fromEntries(report.fields.map(field => [field.key, field]));
  assert.deepEqual([byKey.destinationMac.start, byKey.destinationMac.end, byKey.destinationMac.value],
    [0, 5, '02:DE:AD:BE:EF:14']);
  assert.deepEqual([byKey.etherType.start, byKey.etherType.end, byKey.etherType.value],
    [12, 13, '0x0800']);
  assert.deepEqual([byKey.ihl.value, byKey.headerLength.value, byKey.totalLength.value], ['5', '20', '49']);
  assert.deepEqual([byKey.sourceIp.start, byKey.sourceIp.value], [26, '192.0.2.120']);
  assert.deepEqual([byKey.udpSourcePort.start, byKey.udpSourcePort.value], [34, '12345']);
  assert.deepEqual([byKey.udpDestinationPort.start, byKey.udpDestinationPort.value], [36, '65000']);
  assert.deepEqual([byKey.udpLength.start, byKey.udpLength.value], [38, '29']);
});

test('truncated and unsupported packets show only available fields and warnings', () => {
  const short = core.inspectPacket(mixed.slice(0, 18));
  assert.ok(short.warnings.some(item => item.code === 'ipv4Truncated'));
  assert.ok(short.fields.some(item => item.key === 'totalLength'));
  assert.ok(!short.fields.some(item => item.key === 'sourceIp'));

  const ipv6 = mixed.slice();
  ipv6[12] = 0x86;
  ipv6[13] = 0xdd;
  const other = core.inspectPacket(ipv6);
  assert.equal(other.fields.length, 3);
  assert.deepEqual(other.warnings[0], { code: 'nonIpv4', value: '0x86DD' });

  const tcp = mixed.slice();
  tcp[23] = 6;
  assert.ok(core.inspectPacket(tcp).warnings.some(item => item.code === 'nonUdp'));
  assert.ok(!core.inspectPacket(tcp).fields.some(item => item.header === 'udp'));

  const fragment = mixed.slice();
  fragment[20] = 0x20;
  assert.ok(core.inspectPacket(fragment).warnings.some(item => item.code === 'fragmented'));
  assert.ok(!core.inspectPacket(fragment).fields.some(item => item.header === 'udp'));
});

test('IPv4 options move UDP fields and inconsistent lengths are flagged', () => {
  const longer = Array.from(mixed);
  longer[14] = 0x46;
  longer[17] = 0x35;
  longer.splice(34, 0, 1, 2, 3, 4);
  const report = core.inspectPacket(Uint8Array.from(longer));
  const options = report.fields.find(item => item.key === 'ipOptions');
  const sourcePort = report.fields.find(item => item.key === 'udpSourcePort');
  assert.deepEqual([options.start, options.end, options.rawHex], [34, 37, '01 02 03 04']);
  assert.deepEqual([sourcePort.start, sourcePort.end], [38, 39]);
  assert.deepEqual(report.warnings, []);

  const invalid = mixed.slice();
  invalid[39] = 7;
  assert.ok(core.inspectPacket(invalid).warnings.some(item => item.code === 'invalidUdpLength'));
  assert.throws(() => core.inspectPacket(new Uint8Array()), /Invalid frame bytes/);
});

test('free input identifies ICMPv4 Echo fields and stops safely for other types', () => {
  for (const [id, type, checksum] of [['echoRequest', '8', '0xA28C'], ['echoReply', '0', '0xAA8C']]) {
    const report = core.inspectPacket(core.parseDumpText(data.frames[id].hex, 'raw'));
    assert.deepEqual(report.warnings, []);
    const fields = Object.fromEntries(report.fields.map(field => [field.key, field]));
    assert.deepEqual([fields.protocol.value, fields.icmpType.value, fields.icmpCode.value], ['1', type, '0']);
    assert.deepEqual([fields.icmpChecksum.start, fields.icmpChecksum.end, fields.icmpChecksum.value], [36, 37, checksum]);
    assert.deepEqual([fields.icmpIdentifier.value, fields.icmpSequence.value], ['0x1234', '1']);
    assert.deepEqual([fields.icmpData.start, fields.icmpData.end], [42, 59]);
  }
  const unsupported = core.parseHex(data.frames.echoRequest.hex);
  unsupported[34] = 11;
  const other = core.inspectPacket(unsupported);
  assert.ok(other.warnings.some(warning => warning.code === 'unsupportedIcmpEcho'));
  assert.ok(!other.fields.some(field => field.key === 'icmpIdentifier'));
  const truncated = core.inspectPacket(core.parseHex(data.frames.echoRequest.hex).slice(0, 39));
  assert.ok(truncated.warnings.some(warning => warning.code === 'icmpTruncated'));
  assert.ok(!truncated.fields.some(field => field.key === 'icmpIdentifier'));
  const fragment = core.parseHex(data.frames.echoRequest.hex);
  fragment[20] = 0x20;
  assert.ok(!core.inspectPacket(fragment).fields.some(field => field.header === 'icmp'));
});

test('both READMEs document local input and link to real current screenshots', () => {
  const root = path.join(__dirname, '..');
  for (const file of ['README.md', 'README.en.md']) {
    const readme = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(readme, /4,096/);
    assert.match(readme, /16,384/);
    assert.match(readme, /pcap\/pcapng/);
    for (const width of [390, 1280]) {
      const name = `screenshot-free-input-${width}.png`;
      assert.ok(readme.includes(`assets/${name}`));
      assert.ok(fs.existsSync(path.join(root, 'assets', name)));
      const icmpName = `screenshot-icmp-learning-${width}.png`;
      assert.ok(readme.includes(`assets/${icmpName}`));
      assert.ok(fs.existsSync(path.join(root, 'assets', icmpName)));
    }
    assert.match(readme, /RFC 792/);
    assert.match(readme, /45/);
  }
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const id of ['custom-tab', 'custom-panel', 'custom-form', 'custom-input', 'custom-results', 'custom-fields']) {
    assert.ok(html.includes(`id="${id}"`), id);
  }
});
