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
    ttl: { start: 22, end: 22, header: 'ipv4', format: 'decimal' },
    protocol: { start: 23, end: 23, header: 'ipv4', format: 'decimal' },
    sourceIp: { start: 26, end: 29, header: 'ipv4', format: 'ip' },
    destinationIp: { start: 30, end: 33, header: 'ipv4', format: 'ip' }
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

  function fieldFor(key) {
    const field = FIELDS[key];
    if (!field) throw new Error('Unknown field');
    return field;
  }

  function readNumber(bytes) {
    return bytes.reduce((value, byte) => value * 256 + byte, 0);
  }

  function readField(bytes, key) {
    const field = fieldFor(key);
    if (field.end >= bytes.length) throw new Error('Frame is too short for field');
    const raw = bytes.slice(field.start, field.end + 1);
    if (key === 'version') return raw[0] >>> 4;
    if (key === 'ihl') return raw[0] & 0x0f;
    if (key === 'headerLength') return (raw[0] & 0x0f) * 4;
    if (field.format === 'mac') return Array.from(raw, byteHex).join(':');
    if (field.format === 'ip') return Array.from(raw).join('.');
    return readNumber(raw);
  }

  function answerFor(question, frame) {
    if (!question || !frame) throw new TypeError('Question and frame are required');
    const bytes = parseHex(frame.hex);
    const field = fieldFor(question.field);
    const raw = bytes.slice(field.start, field.end + 1);
    if (raw.length !== field.end - field.start + 1) throw new Error('Frame is too short');
    const numberOrText = readField(bytes, question.field);
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
      relativeStart: field.start - (field.header === 'ipv4' ? 14 : 0),
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

  function grade(question, frame, response) {
    const answer = answerFor(question, frame);
    const bytes = parseHex(frame.hex);
    if (question.kind === 'range') {
      const start = parseOffset(response && response.start, bytes.length - 1);
      const end = parseOffset(response && response.end, bytes.length - 1);
      if (start === null || end === null || start > end) return { ok: false, valid: false };
      return { ok: start === answer.start && end === answer.end, valid: true };
    }
    if (question.kind !== 'value' && question.kind !== 'calc') throw new Error('Unknown question kind');
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

  return Object.freeze({ FIELDS, parseHex, byteHex, offsetHex, readField, answerFor, grade, dumpRows });
});
