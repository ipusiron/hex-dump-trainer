(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.HexDumpCore = api;
})(globalThis, function () {
  'use strict';

  const FIELDS = Object.freeze({
    firstByte: { start: 0, end: 0, header: 'frame', format: 'hex' },
    introOffset16: { start: 16, end: 16, header: 'frame', format: 'hex' },
    destinationMac: { start: 0, end: 5, header: 'ethernet', format: 'mac' },
    sourceMac: { start: 6, end: 11, header: 'ethernet', format: 'mac' },
    etherType: { start: 12, end: 13, header: 'ethernet', format: 'hex' },
    version: { start: 14, end: 14, header: 'ipv4', format: 'decimal' },
    ihl: { start: 14, end: 14, header: 'ipv4', format: 'decimal' },
    headerLength: { start: 14, end: 14, header: 'ipv4', format: 'decimal' },
    totalLength: { start: 16, end: 17, header: 'ipv4', format: 'decimal' },
    ipChecksum: { start: 24, end: 25, header: 'ipv4', format: 'hex' },
    ttl: { start: 22, end: 22, header: 'ipv4', format: 'decimal' },
    protocol: { start: 23, end: 23, header: 'ipv4', format: 'decimal' },
    sourceIp: { start: 26, end: 29, header: 'ipv4', format: 'ip' },
    destinationIp: { start: 30, end: 33, header: 'ipv4', format: 'ip' },
    ipv4Start: { header: 'ipv4', format: 'decimal', dynamic: true },
    ipv4Header: { header: 'ipv4', format: 'decimal', dynamic: true },
    udpStart: { header: 'udp', format: 'decimal', dynamic: true },
    udpHeader: { header: 'udp', format: 'decimal', dynamic: true },
    udpSourcePort: { header: 'udp', format: 'decimal', dynamic: true },
    udpDestinationPort: { header: 'udp', format: 'decimal', dynamic: true },
    udpLength: { header: 'udp', format: 'decimal', dynamic: true },
    udpChecksum: { header: 'udp', format: 'hex', dynamic: true },
    firstChangedByte: { header: 'ipv4', format: 'decimal', dynamic: true }
  });

  function parseHex(hex) {
    if (typeof hex !== 'string') throw new TypeError('Hex data must be a string');
    const compact = hex.replace(/\s+/g, '');
    if (!compact || compact.length % 2 || !/^[0-9a-fA-F]+$/.test(compact)) {
      throw new Error('Invalid hexadecimal byte sequence');
    }
    return Uint8Array.from(compact.match(/../g), pair => Number.parseInt(pair, 16));
  }

  function byteHex(byte) {
    return byte.toString(16).padStart(2, '0').toUpperCase();
  }

  function offsetHex(offset) {
    return offset.toString(16).padStart(4, '0').toUpperCase();
  }

  function packetLayout(bytes) {
    if (bytes.length < 42 || readNumber(bytes.slice(12, 14)) !== 0x0800) {
      throw new Error('Frame must contain Ethernet II and IPv4');
    }
    const ipv4Start = 14;
    const version = bytes[ipv4Start] >>> 4;
    const ihl = bytes[ipv4Start] & 0x0f;
    const ipv4Length = ihl * 4;
    const udpStart = ipv4Start + ipv4Length;
    const ipTotalLength = readNumber(bytes.slice(16, 18));
    if (version !== 4 || ihl < 5 || udpStart + 8 > bytes.length ||
        ipTotalLength < ipv4Length + 8 || ipv4Start + ipTotalLength > bytes.length ||
        bytes[23] !== 17) {
      throw new Error('Frame must contain a complete IPv4 and UDP header');
    }
    return { ipv4Start, ipv4Length, udpStart };
  }

  function fieldFor(key, bytes, comparisonBytes) {
    const field = FIELDS[key];
    if (!field) throw new Error('Unknown field');
    if (!field.dynamic) return field;
    if (key === 'firstChangedByte') {
      if (!comparisonBytes || comparisonBytes.length !== bytes.length) throw new Error('Comparable frame is required');
      const start = bytes.findIndex((byte, index) => byte !== comparisonBytes[index]);
      if (start < 0) throw new Error('Frames do not differ');
      return { ...field, start, end: start };
    }
    const { ipv4Start, ipv4Length, udpStart } = packetLayout(bytes);
    const ranges = {
      ipv4Start: [ipv4Start, ipv4Start],
      ipv4Header: [ipv4Start, udpStart - 1],
      udpStart: [udpStart, udpStart],
      udpHeader: [udpStart, udpStart + 7],
      udpSourcePort: [udpStart, udpStart + 1],
      udpDestinationPort: [udpStart + 2, udpStart + 3],
      udpLength: [udpStart + 4, udpStart + 5],
      udpChecksum: [udpStart + 6, udpStart + 7]
    };
    const [start, end] = ranges[key];
    return { ...field, start, end, ipv4Length };
  }

  function readNumber(bytes) {
    return bytes.reduce((value, byte) => value * 256 + byte, 0);
  }

  function readField(bytes, key, comparisonBytes) {
    const field = fieldFor(key, bytes, comparisonBytes);
    if (field.end >= bytes.length) throw new Error('Frame is too short for field');
    const raw = bytes.slice(field.start, field.end + 1);
    if (key === 'version') return raw[0] >>> 4;
    if (key === 'ihl') return raw[0] & 0x0f;
    if (key === 'headerLength') return (raw[0] & 0x0f) * 4;
    if (key === 'ipv4Header') return field.ipv4Length;
    if (key === 'udpHeader') return 8;
    if (key === 'ipv4Start' || key === 'udpStart' || key === 'firstChangedByte') return field.start;
    if (field.format === 'mac') return Array.from(raw, byteHex).join(':');
    if (field.format === 'ip') return Array.from(raw).join('.');
    return readNumber(raw);
  }

  function answerFor(question, frame, comparisonFrame) {
    if (!question || !frame) throw new TypeError('Question and frame are required');
    const bytes = parseHex(frame.hex);
    const comparisonBytes = comparisonFrame ? parseHex(comparisonFrame.hex) : null;
    const field = fieldFor(question.field, bytes, comparisonBytes);
    const raw = bytes.slice(field.start, field.end + 1);
    if (raw.length !== field.end - field.start + 1) throw new Error('Frame is too short');
    const numberOrText = readField(bytes, question.field, comparisonBytes);
    const format = question.format || field.format;
    let value;
    if (format === 'hex') {
      value = '0x' + readNumber(raw).toString(16).padStart(raw.length * 2, '0').toUpperCase();
    } else {
      value = String(numberOrText);
    }
    return {
      start: field.start,
      end: field.end,
      relativeStart: field.start - (field.header === 'ipv4' ? 14 : field.header === 'udp' ? packetLayout(bytes).udpStart : 0),
      header: field.header,
      rawHex: Array.from(raw, byteHex).join(' '),
      value,
      format,
      numericValue: typeof numberOrText === 'number' ? numberOrText : null,
      byteValue: raw[0]
    };
  }

  function parseOffset(value, maximum) {
    if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : null;
  }

  function grade(question, frame, response, comparisonFrame) {
    const answer = answerFor(question, frame, comparisonFrame);
    const bytes = parseHex(frame.hex);
    if (question.kind === 'range') {
      const start = parseOffset(response && response.start, bytes.length - 1);
      const end = parseOffset(response && response.end, bytes.length - 1);
      if (start === null || end === null || start > end) return { ok: false, valid: false };
      return { ok: start === answer.start && end === answer.end, valid: true };
    }
    if (question.kind !== 'value' && question.kind !== 'calc' && question.kind !== 'compare') throw new Error('Unknown question kind');
    const value = response && response.value;
    if (typeof value !== 'string') return { ok: false, valid: false };
    const patterns = {
      decimal: /^(0|[1-9][0-9]*)$/,
      hex: /^0x[0-9a-fA-F]+$/,
      mac: /^(?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$/,
      ip: /^(?:0|[1-9][0-9]{0,2})(?:\.(?:0|[1-9][0-9]{0,2})){3}$/
    };
    if (!patterns[answer.format].test(value)) return { ok: false, valid: false };
    return { ok: value.toLowerCase() === answer.value.toLowerCase(), valid: true };
  }

  function dumpRows(bytes, width) {
    if (!Number.isInteger(width) || width < 1) throw new RangeError('Invalid row width');
    const rows = [];
    for (let start = 0; start < bytes.length; start += width) {
      const chunk = bytes.slice(start, start + width);
      rows.push({
        offset: start,
        offsetHex: offsetHex(start),
        bytes: Array.from(chunk, (value, index) => ({ offset: start + index, hex: byteHex(value) })),
        ascii: Array.from(chunk, value => value >= 32 && value <= 126 ? String.fromCharCode(value) : '.').join('')
      });
    }
    return rows;
  }

  return Object.freeze({ FIELDS, parseHex, byteHex, offsetHex, packetLayout, readField, answerFor, grade, dumpRows });
});
