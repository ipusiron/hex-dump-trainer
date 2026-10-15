(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.HexDumpData = api;
})(globalThis, function () {
  'use strict';

  // Versioned, original teaching frames. Each is Ethernet II + IPv4 + UDP.
  const frames = Object.freeze({
    intro: {
      id: 'intro', version: '1.0.0',
      hex: '02 11 22 33 44 55 02 aa bb cc dd 01 08 00 45 00 00 2f 10 01 40 00 40 11 3e 6b c0 00 02 0a c6 33 64 14 9c 40 1f 90 00 1b e5 50 44 41 59 31 31 34 2d 49 4e 54 52 4f 2d 30 30 31 2d 4f 4b'
    },
    ethernet: {
      id: 'ethernet', version: '1.0.0',
      hex: '02 00 5e 10 20 30 02 42 ac 11 00 02 08 00 45 00 00 2e 20 02 40 00 20 11 3c 86 cb 00 71 09 c0 00 02 2d 14 e9 2e e0 00 1a 9e 48 45 54 48 45 52 4e 45 54 2d 4c 41 42 2d 31 31 34 2d 41'
    },
    ipv4: {
      id: 'ipv4', version: '1.0.0',
      hex: '02 fe dc ba 98 76 02 12 34 56 78 9a 08 00 45 00 00 30 30 03 40 00 80 11 63 e6 c6 33 64 4d cb 00 71 52 d6 d8 00 35 00 1c fd 29 49 50 56 34 2d 48 45 41 44 45 52 2d 4c 45 53 53 4f 4e 2d 43'
    },
    mixed: {
      id: 'mixed', version: '1.0.0',
      hex: '02 de ad be ef 14 02 01 23 45 67 89 08 00 45 00 00 31 40 04 40 00 60 11 db 76 c0 00 02 78 cb 00 71 c8 30 39 fd e8 00 1d c0 8f 4d 49 58 45 44 2d 46 49 45 4c 44 53 2d 4c 45 53 53 4f 4e 2d 44'
    },
    compare: {
      id: 'compare', version: '1.0.0',
      // The mixed frame after one IPv4 hop: TTL -1, IPv4 checksum updated.
      hex: '02 de ad be ef 14 02 01 23 45 67 89 08 00 45 00 00 31 40 04 40 00 5f 11 dc 76 c0 00 02 78 cb 00 71 c8 30 39 fd e8 00 1d c0 8f 4d 49 58 45 44 2d 46 49 45 4c 44 53 2d 4c 45 53 53 4f 4e 2d 44'
    }
  });

  const lessons = Object.freeze([
    {
      id: 'intro', frameId: 'intro', title: { ja: '入門', en: 'Introduction' },
      questions: [
        { id: 'intro-byte', kind: 'value', field: 'firstByte', format: 'hex',
          prompt: { ja: '先頭の1バイトを、0x付きの16進数で入力してください。', en: 'Enter the first byte as a hexadecimal value beginning with 0x.' } },
        { id: 'intro-offset', kind: 'range', field: 'introOffset16',
          prompt: { ja: '行頭「0010」の先頭の1バイトを選んでください。', en: 'Select the first byte on the row labeled 0010.' } }
      ]
    },
    {
      id: 'ethernet', frameId: 'ethernet', title: { ja: 'Ethernet II', en: 'Ethernet II' },
      questions: [
        { id: 'eth-dst-range', kind: 'range', field: 'destinationMac',
          prompt: { ja: '宛先MACアドレスのバイト範囲を選んでください。', en: 'Select the byte range of the destination MAC address.' } },
        { id: 'eth-src-value', kind: 'value', field: 'sourceMac', format: 'mac',
          prompt: { ja: '送信元MACアドレスを、コロン区切りで入力してください。', en: 'Enter the source MAC address with colon separators.' } },
        { id: 'eth-type-value', kind: 'value', field: 'etherType', format: 'hex',
          prompt: { ja: 'EtherTypeを、0x付き4桁の16進数で入力してください。', en: 'Enter EtherType as a four-digit hexadecimal value beginning with 0x.' } }
      ]
    },
    {
      id: 'ipv4', frameId: 'ipv4', title: { ja: 'IPv4', en: 'IPv4' },
      questions: [
        { id: 'ip-version', kind: 'value', field: 'version', format: 'decimal',
          prompt: { ja: 'IPv4のVersionを10進数で入力してください。', en: 'Enter the IPv4 Version in decimal.' } },
        { id: 'ip-ihl', kind: 'value', field: 'ihl', format: 'decimal',
          prompt: { ja: 'IHLを10進数で入力してください。', en: 'Enter the IHL in decimal.' } },
        { id: 'ip-header-length', kind: 'calc', field: 'headerLength', format: 'decimal',
          prompt: { ja: 'IHLからIPv4ヘッダー長をバイト単位で計算してください。', en: 'Calculate the IPv4 header length in bytes from the IHL.' } },
        { id: 'ip-total-length', kind: 'value', field: 'totalLength', format: 'decimal',
          prompt: { ja: 'IPv4のTotal Lengthを10進数で入力してください。', en: 'Enter the IPv4 Total Length in decimal.' } },
        { id: 'ip-ttl', kind: 'value', field: 'ttl', format: 'decimal',
          prompt: { ja: 'TTLを10進数で入力してください。', en: 'Enter the TTL in decimal.' } },
        { id: 'ip-protocol', kind: 'value', field: 'protocol', format: 'decimal',
          prompt: { ja: 'Protocolの値を10進数で入力してください。', en: 'Enter the Protocol value in decimal.' } },
        { id: 'ip-src-range', kind: 'range', field: 'sourceIp',
          prompt: { ja: '送信元IPv4アドレスのバイト範囲を選んでください。', en: 'Select the byte range of the source IPv4 address.' } },
        { id: 'ip-src-value', kind: 'value', field: 'sourceIp', format: 'ip',
          prompt: { ja: '送信元IPv4アドレスをドット区切りで入力してください。', en: 'Enter the source IPv4 address in dotted decimal notation.' } },
        { id: 'ip-dst-value', kind: 'value', field: 'destinationIp', format: 'ip',
          prompt: { ja: '宛先IPv4アドレスをドット区切りで入力してください。', en: 'Enter the destination IPv4 address in dotted decimal notation.' } }
      ]
    },
    {
      id: 'boundaries', frameId: 'mixed', title: { ja: 'ヘッダー境界', en: 'Header boundaries' },
      questions: [
        { id: 'boundary-ip-start', kind: 'range', field: 'ipv4Start',
          prompt: { ja: 'EtherTypeが示すIPv4ヘッダーの開始バイトを選んでください。', en: 'Select the first byte of the IPv4 header indicated by EtherType.' } },
        { id: 'boundary-ip-header', kind: 'range', field: 'ipv4Header',
          prompt: { ja: 'IHLから長さを求め、IPv4ヘッダー全体の範囲を選んでください。', en: 'Use IHL to select the entire IPv4 header range.' } },
        { id: 'boundary-udp-start', kind: 'range', field: 'udpStart',
          prompt: { ja: 'ProtocolがUDPを示すことを確認し、UDPヘッダーの開始バイトを選んでください。', en: 'Confirm that Protocol indicates UDP, then select the first UDP header byte.' } }
      ]
    },
    {
      id: 'udp', frameId: 'mixed', title: { ja: 'UDP', en: 'UDP' },
      questions: [
        { id: 'udp-header-range', kind: 'range', field: 'udpHeader',
          prompt: { ja: 'UDPヘッダー8バイトの範囲を選んでください。', en: 'Select the eight-byte UDP header range.' } },
        { id: 'udp-source-port', kind: 'value', field: 'udpSourcePort', format: 'decimal',
          prompt: { ja: 'UDPの送信元ポート番号を10進数で入力してください。', en: 'Enter the UDP source port in decimal.' } },
        { id: 'udp-destination-port', kind: 'value', field: 'udpDestinationPort', format: 'decimal',
          prompt: { ja: 'UDPの宛先ポート番号を10進数で入力してください。', en: 'Enter the UDP destination port in decimal.' } },
        { id: 'udp-length', kind: 'value', field: 'udpLength', format: 'decimal',
          prompt: { ja: 'UDPのLengthを、ヘッダーを含むバイト数として10進数で入力してください。', en: 'Enter UDP Length in decimal, including the UDP header.' } },
        { id: 'udp-checksum', kind: 'value', field: 'udpChecksum', format: 'hex',
          prompt: { ja: 'UDPのChecksumフィールドを0x付き4桁の16進数で入力してください（再計算は不要）。', en: 'Enter the UDP Checksum field as four hex digits with 0x (no recalculation).' } }
      ]
    },
    {
      id: 'mixed', frameId: 'mixed', title: { ja: '混合問題', en: 'Mixed practice' },
      questions: [
        { id: 'mix-src-mac-range', kind: 'range', field: 'sourceMac',
          prompt: { ja: '送信元MACアドレスの範囲を選んでください。', en: 'Select the range of the source MAC address.' } },
        { id: 'mix-dst-mac-value', kind: 'value', field: 'destinationMac', format: 'mac',
          prompt: { ja: '宛先MACアドレスを入力してください。', en: 'Enter the destination MAC address.' } },
        { id: 'mix-type-range', kind: 'range', field: 'etherType',
          prompt: { ja: 'EtherTypeのバイト範囲を選んでください。', en: 'Select the byte range of EtherType.' } },
        { id: 'mix-length-range', kind: 'range', field: 'totalLength',
          prompt: { ja: 'IPv4 Total Lengthのバイト範囲を選んでください。', en: 'Select the byte range of the IPv4 Total Length.' } },
        { id: 'mix-ttl', kind: 'value', field: 'ttl', format: 'decimal',
          prompt: { ja: 'TTLを10進数で入力してください。', en: 'Enter the TTL in decimal.' } },
        { id: 'mix-dst-ip-range', kind: 'range', field: 'destinationIp',
          prompt: { ja: '宛先IPv4アドレスの範囲を選んでください。', en: 'Select the range of the destination IPv4 address.' } },
        { id: 'mix-dst-ip-value', kind: 'value', field: 'destinationIp', format: 'ip',
          prompt: { ja: '宛先IPv4アドレスを入力してください。', en: 'Enter the destination IPv4 address.' } }
      ]
    },
    {
      id: 'comparison', frameId: 'compare', compareFrameId: 'mixed', title: { ja: '2パケット比較', en: 'Compare two packets' },
      questions: [
        { id: 'compare-first-offset', kind: 'compare', field: 'firstChangedByte', format: 'decimal',
          prompt: { ja: 'AとBを先頭から比べ、最初に値が異なるバイトのオフセットを10進数で入力してください。', en: 'Compare A and B from the start. Enter the offset of the first different byte in decimal.' } },
        { id: 'compare-ttl', kind: 'compare', field: 'ttl', format: 'decimal',
          prompt: { ja: 'AとBを比べ、BのTTLを10進数で入力してください。', en: 'Compare A and B, then enter B\'s TTL in decimal.' } },
        { id: 'compare-checksum', kind: 'compare', field: 'ipChecksum', format: 'hex',
          prompt: { ja: 'AとBを比べ、BのIPv4ヘッダーチェックサムを0x付き4桁の16進数で入力してください。', en: 'Compare A and B, then enter B\'s IPv4 header checksum as four hex digits with 0x.' } }
      ]
    }
  ]);

  const learningHeaders = Object.freeze({
    ethernet: Object.freeze({ start: 0, end: 13 }),
    ipv4: Object.freeze({ start: 14, end: 33 }),
    udp: Object.freeze({ start: 34, end: 41 })
  });
  function learningField(header, start, end) {
    return Object.freeze({ header, start, end });
  }
  const learningFields = Object.freeze({
    'ether-dst': learningField('ethernet', 0, 5),
    'ether-src': learningField('ethernet', 6, 11),
    'ether-type': learningField('ethernet', 12, 13),
    'ip-version': learningField('ipv4', 14, 14),
    'ip-ihl': learningField('ipv4', 14, 14),
    'ip-tos': learningField('ipv4', 15, 15),
    'ip-total': learningField('ipv4', 16, 17),
    'ip-id': learningField('ipv4', 18, 19),
    'ip-flags': learningField('ipv4', 20, 21),
    'ip-fragment': learningField('ipv4', 20, 21),
    'ip-ttl': learningField('ipv4', 22, 22),
    'ip-protocol': learningField('ipv4', 23, 23),
    'ip-checksum': learningField('ipv4', 24, 25),
    'ip-src': learningField('ipv4', 26, 29),
    'ip-dst': learningField('ipv4', 30, 33),
    'udp-src': learningField('udp', 34, 35),
    'udp-dst': learningField('udp', 36, 37),
    'udp-length': learningField('udp', 38, 39),
    'udp-checksum': learningField('udp', 40, 41)
  });

  return Object.freeze({ version: '1.1.0', frames, lessons, learningHeaders, learningFields });
});
