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
    icmpStart: { header: 'icmp', format: 'decimal', dynamic: true },
    icmpHeader: { header: 'icmp', format: 'decimal', dynamic: true },
    icmpType: { header: 'icmp', format: 'decimal', dynamic: true },
    icmpCode: { header: 'icmp', format: 'decimal', dynamic: true },
    icmpChecksum: { header: 'icmp', format: 'hex', dynamic: true },
    icmpIdentifier: { header: 'icmp', format: 'hex', dynamic: true },
    icmpSequence: { header: 'icmp', format: 'decimal', dynamic: true },
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

  function icmpLayout(bytes) {
    if (bytes.length < 42 || readNumber(bytes.slice(12, 14)) !== 0x0800 ||
        bytes[14] >>> 4 !== 4 || (bytes[14] & 15) < 5 || bytes[23] !== 1) {
      throw new Error('Frame must contain Ethernet II, IPv4, and ICMPv4 Echo');
    }
    const start = 14 + (bytes[14] & 15) * 4;
    const ipEnd = 14 + readNumber(bytes.slice(16, 18));
    if (start + 8 > Math.min(ipEnd, bytes.length) || ![0, 8].includes(bytes[start]) || bytes[start + 1] !== 0) {
      throw new Error('Frame must contain a complete ICMPv4 Echo header');
    }
    return { start };
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
    if (field.header === 'icmp') {
      const { start } = icmpLayout(bytes);
      const icmpRanges = {
        icmpStart: [start, start], icmpHeader: [start, start + 7],
        icmpType: [start, start], icmpCode: [start + 1, start + 1],
        icmpChecksum: [start + 2, start + 3],
        icmpIdentifier: [start + 4, start + 5], icmpSequence: [start + 6, start + 7]
      };
      const [icmpStart, icmpEnd] = icmpRanges[key];
      return { ...field, start: icmpStart, end: icmpEnd, icmpStart: start };
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
    if (key === 'icmpHeader') return 8;
    if (key === 'ipv4Start' || key === 'udpStart' || key === 'icmpStart' || key === 'firstChangedByte') return field.start;
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
      relativeStart: field.start - (field.header === 'ipv4' ? 14 : field.header === 'udp' ? packetLayout(bytes).udpStart : field.header === 'icmp' ? field.icmpStart : 0),
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

  const MAX_INPUT_CHARS = 16384;
  const MAX_FRAME_BYTES = 4096;

  function inputError(code) {
    const error = new Error(code);
    error.code = code;
    return error;
  }

  function parseDumpText(input, mode) {
    if (typeof input !== 'string') throw inputError('empty');
    if (input.length > MAX_INPUT_CHARS) throw inputError('textTooLong');
    if (!input.trim()) throw inputError('empty');
    if (mode !== 'raw' && mode !== 'offset') throw inputError('unknownMode');
    let bytes;
    if (mode === 'raw') {
      try { bytes = parseHex(input); } catch { throw inputError('invalidRaw'); }
    } else {
      const values = [];
      for (const line of input.trim().split(/\r\n|\n|\r/)) {
        const match = /^([0-9a-fA-F]{4,8}):[ \t]+(.+)$/.exec(line.trim());
        if (!match) throw inputError('invalidOffsetRow');
        const octets = match[2].trim().split(/[ \t]+/);
        if (octets.length < 1 || octets.length > 16 || octets.some(octet => !/^[0-9a-fA-F]{2}$/.test(octet))) {
          throw inputError('invalidOffsetRow');
        }
        if (Number.parseInt(match[1], 16) !== values.length) throw inputError('offsetGap');
        for (const octet of octets) values.push(Number.parseInt(octet, 16));
        if (values.length > MAX_FRAME_BYTES) throw inputError('tooManyBytes');
      }
      bytes = Uint8Array.from(values);
    }
    if (bytes.length > MAX_FRAME_BYTES) throw inputError('tooManyBytes');
    return bytes;
  }

  function inspectPacket(bytes) {
    if (!(bytes instanceof Uint8Array) || bytes.length < 1 || bytes.length > MAX_FRAME_BYTES) {
      throw new RangeError('Invalid frame bytes');
    }
    const fields = [];
    const warnings = [];
    const add = (key, header, start, end, format, value) => {
      if (end >= bytes.length) return false;
      const raw = bytes.slice(start, end + 1);
      let readValue = value;
      if (readValue === undefined) {
        readValue = format === 'mac' ? Array.from(raw, byteHex).join(':')
          : format === 'ip' ? Array.from(raw).join('.')
            : format === 'hex' ? '0x' + Array.from(raw, byteHex).join('')
              : String(readNumber(raw));
      }
      fields.push({ key, header, start, end, rawHex: Array.from(raw, byteHex).join(' '), value: String(readValue) });
      return true;
    };
    const warn = (code, value) => warnings.push({ code, value });
    add('destinationMac', 'ethernet', 0, 5, 'mac');
    add('sourceMac', 'ethernet', 6, 11, 'mac');
    if (!add('etherType', 'ethernet', 12, 13, 'hex')) {
      warn('ethernetTruncated');
      return { fields, warnings };
    }
    const etherType = readNumber(bytes.slice(12, 14));
    if (etherType !== 0x0800) {
      warn('nonIpv4', '0x' + etherType.toString(16).padStart(4, '0').toUpperCase());
      return { fields, warnings };
    }
    if (bytes.length < 15) {
      warn('ipv4Truncated');
      return { fields, warnings };
    }
    const version = bytes[14] >>> 4;
    const ihl = bytes[14] & 0x0f;
    add('version', 'ipv4', 14, 14, 'decimal', version);
    add('ihl', 'ipv4', 14, 14, 'decimal', ihl);
    if (version !== 4) {
      warn('unsupportedIpVersion', version);
      return { fields, warnings };
    }
    if (ihl < 5) {
      warn('invalidIhl', ihl);
      return { fields, warnings };
    }
    const ipHeaderLength = ihl * 4;
    add('headerLength', 'ipv4', 14, 14, 'decimal', ipHeaderLength);
    add('totalLength', 'ipv4', 16, 17, 'decimal');
    add('ttl', 'ipv4', 22, 22, 'decimal');
    add('protocol', 'ipv4', 23, 23, 'decimal');
    add('ipChecksum', 'ipv4', 24, 25, 'hex');
    add('sourceIp', 'ipv4', 26, 29, 'ip');
    add('destinationIp', 'ipv4', 30, 33, 'ip');
    if (bytes.length < 14 + ipHeaderLength) {
      warn('ipv4Truncated');
      return { fields, warnings };
    }
    if (ihl > 5) add('ipOptions', 'ipv4', 34, 14 + ipHeaderLength - 1, 'hex');
    const ipTotalLength = readNumber(bytes.slice(16, 18));
    if (ipTotalLength < ipHeaderLength) {
      warn('invalidIpLength', ipTotalLength);
      return { fields, warnings };
    }
    const ipEnd = 14 + ipTotalLength;
    if (ipEnd > bytes.length) warn('ipv4DeclaredTruncated', ipEnd - bytes.length);
    if (ipEnd < bytes.length) warn('trailingBytes', bytes.length - ipEnd);
    const flagsFragment = readNumber(bytes.slice(20, 22));
    if ((flagsFragment & 0x3fff) !== 0) {
      warn('fragmented');
      return { fields, warnings };
    }
    const protocol = bytes[23];
    if (protocol === 1) {
      const start = 14 + ipHeaderLength;
      const availableEnd = Math.min(bytes.length, ipEnd);
      if (start + 4 > availableEnd) {
        warn('icmpTruncated');
        return { fields, warnings };
      }
      add('icmpType', 'icmp', start, start, 'decimal');
      add('icmpCode', 'icmp', start + 1, start + 1, 'decimal');
      add('icmpChecksum', 'icmp', start + 2, start + 3, 'hex');
      const type = bytes[start];
      const code = bytes[start + 1];
      if ((type !== 0 && type !== 8) || code !== 0) {
        warn('unsupportedIcmpEcho', `${type}/${code}`);
        return { fields, warnings };
      }
      if (start + 8 > availableEnd) {
        warn('icmpTruncated');
        return { fields, warnings };
      }
      add('icmpIdentifier', 'icmp', start + 4, start + 5, 'hex');
      add('icmpSequence', 'icmp', start + 6, start + 7, 'decimal');
      if (ipEnd <= bytes.length && ipEnd > start + 8) {
        add('icmpData', 'icmp', start + 8, ipEnd - 1, 'hex');
      }
      return { fields, warnings };
    }
    if (protocol !== 17) {
      warn('nonUdp', protocol);
      return { fields, warnings };
    }
    const udpStart = 14 + ipHeaderLength;
    if (udpStart + 8 > Math.min(bytes.length, ipEnd)) {
      warn('udpTruncated');
      return { fields, warnings };
    }
    add('udpSourcePort', 'udp', udpStart, udpStart + 1, 'decimal');
    add('udpDestinationPort', 'udp', udpStart + 2, udpStart + 3, 'decimal');
    add('udpLength', 'udp', udpStart + 4, udpStart + 5, 'decimal');
    add('udpChecksum', 'udp', udpStart + 6, udpStart + 7, 'hex');
    const udpLength = readNumber(bytes.slice(udpStart + 4, udpStart + 6));
    if (udpLength < 8) warn('invalidUdpLength', udpLength);
    else if (udpLength !== ipTotalLength - ipHeaderLength) warn('udpLengthMismatch', udpLength);
    else if (udpStart + udpLength > bytes.length) warn('udpDataTruncated', udpStart + udpLength - bytes.length);
    return { fields, warnings };
  }

  return Object.freeze({ FIELDS, MAX_INPUT_CHARS, MAX_FRAME_BYTES, parseHex, parseDumpText, inspectPacket,
    byteHex, offsetHex, packetLayout, readField, answerFor, grade, dumpRows });
});
