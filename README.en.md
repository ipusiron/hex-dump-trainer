# Hex Dump Trainer - Learn to Read Hex Dumps

![GitHub stars](https://img.shields.io/github/stars/ipusiron/hex-dump-trainer?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/hex-dump-trainer?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/hex-dump-trainer)
![GitHub license](https://img.shields.io/github/license/ipusiron/hex-dump-trainer)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/hex-dump-trainer/)

[日本語](README.md)

**Day114 - Security Tools with Generative AI 200**

Hex Dump Trainer is an interactive learning tool for finding byte positions in a hex dump and reading Ethernet II and IPv4 headers.
If you are new to hex dumps, you can start with a short introduction.
No book is required.
The Learn tab uses packet diagrams with values from a built-in frame, offset explanations, and links to the relevant RFCs to explain Ethernet II, IPv4, and UDP. Matching diagram fields and explanation rows highlight together.

## 🌐 Live app

👉 **[Open Hex Dump Trainer](https://ipusiron.github.io/hex-dump-trainer/)**

The exercises run in a browser and use original frames; no book is required.

## 📸 Screenshot

![The introduction question, hex dump, and lesson list](assets/screenshot-desktop.png)

![The Learn tab highlighting a matching IPv4 field and explanation row](assets/screenshot-learning.png)

## ✨ What you will learn

- How zero-based offsets correspond to byte positions
- How field order and widths appear in packet diagrams (32-bit rows for IPv4 and UDP)
- How to match diagram fields to explanation rows by hover, tap, or keyboard
- How to locate Ethernet II destination and source MAC addresses and EtherType
- How to read IPv4 Version, IHL, Total Length, TTL, Protocol, and source and destination addresses
- How to calculate the IPv4 header length from IHL
- How to locate and read UDP ports, Length, and Checksum in the Learn tab (UDP is not graded)

## 📖 How to use

1. Use the Learn tab to inspect header diagrams and example values, then review offsets and RFC links. Hover over a diagram field or explanation row to highlight its match; tap or press Enter/Space on a diagram field to select it. On narrow screens, scroll each diagram horizontally. Switching back to Exercises keeps the answer you were entering.
2. Complete the two introductory questions or skip to Ethernet II. You can switch lessons at any time.
3. For range questions, select the start and end bytes. Decimal offset inputs provide an alternative for small screens and keyboards.
4. For value and calculation questions, enter the notation requested in the question.
5. Check your answer. You can retry after a wrong answer. Hints progress through header, relative offset, and answer reveal; Show answer reveals it directly.

Changing languages preserves the active tab, current question, selection, input, and result. Switching lessons starts the selected lesson unanswered while keeping its completion record.

## 🔧 Getting started

Open the [published page](https://ipusiron.github.io/hex-dump-trainer/) or open the local `index.html` directly. It also works through `file://`; no installation or server is required.

## 🔬 Worked example

The Total Length in the IPv4 lesson occupies absolute frame offsets `16–17`, or offsets `2–3` relative to the IPv4 header beginning at `14`.
The bytes are `00 30`. Read in network byte order, they form `0x0030`, or `48` bytes in decimal. The 14-byte Ethernet II header is not part of this Total Length.

## 🎯 Use cases

- Read `08 00` at offsets `12–13` as `0x0800` to recognize the following IPv4 header.
- Split `45` into Version `4` and IHL `5`, then calculate an IPv4 header length of `20` bytes.
- Convert `C6 33 64 4D` byte by byte into `198.51.100.77`.
- Select a byte range before revealing the evidence, rather than reading a completed decode table.

## ⚠️ Scope and limitations

The lessons use Ethernet II frames containing IPv4 headers without options. The sample byte arrays omit the frame check sequence (FCS).
Their UDP datagrams have consistent lengths and checksums. The Learn tab explains their structure, but UDP fields are not graded.
VLAN, IPv6, ARP, fragmentation, IPv4 options, pasted hex dumps, ICMPv4, and pcap/pcapng import are not supported.

## 🔒 Data and privacy

Only original built-in exercises are used; there is no free-form input. Answers and progress stay in the page's memory and disappear on reload. The app does not submit answers externally. Following a GitHub link navigates to GitHub.

## 🧪 Development and tests

The app uses only HTML, CSS, and JavaScript, with no package dependencies. With Node.js 22, run the byte-reading, grading, all-question, and four-frame IPv4/UDP length and checksum tests:

```sh
node --test test/*.test.js
```

CI runs the same tests and JavaScript syntax checks. The interface has been checked locally with `file://` and HTTP at widths from 320 to 1280 pixels.

## 📁 Directory structure

```text
hex-dump-trainer/
├── .github/workflows/test.yml # Test CI
├── .gitignore               # Exclude local secrets and generated files
├── assets/screenshot-desktop.png # Interface screenshot
├── assets/screenshot-learning.png # Learn tab screenshot
├── index.html               # Exercise and learning interface
├── style.css                # Mobile-first styles
├── app.js                   # Interface, tabs, and progress
├── core.js                  # Byte reading and grading
├── data.js                  # Versioned original lessons
├── test/                    # Dependency-free tests
├── README.md                # Japanese
├── README.en.md             # English
└── LICENSE                  # MIT License
```

## 📄 License

This project uses the MIT License. See [LICENSE](LICENSE) for the full text.

## 🔗 References

- [RFC 894: A Standard for the Transmission of IP Datagrams over Ethernet Networks](https://www.rfc-editor.org/rfc/rfc894.html)
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791.html)
- [RFC 768: User Datagram Protocol](https://www.rfc-editor.org/rfc/rfc768.html)
- [IANA: Protocol Numbers](https://www.iana.org/assignments/protocol-numbers/)
- [RFC 5737: IPv4 Address Blocks Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc5737.html)

## 🛠️ About this tool

This project is part of [Security Tools with Generative AI 200](https://akademeia.info/?page_id=44607).
