# Hex Dump Trainer - Learn to Read Hex Dumps

[日本語](README.md)

**Day114 - Security Tools with Generative AI 200**

Hex Dump Trainer is an interactive learning tool for finding byte positions in a hex dump and reading Ethernet II and IPv4 headers.
If you are new to hex dumps, you can start with a short introduction.
No book is required.

> This project is in preparation. The exercise page and sample frames have not been implemented yet.

## 🌐 Coming-soon page

The [GitHub Pages coming-soon page](https://ipusiron.github.io/hex-dump-trainer/) is available.
Exercises are not available there yet.

## ✨ What you will learn

- How zero-based offsets correspond to byte positions
- How to locate Ethernet II destination and source MAC addresses and EtherType
- How to read IPv4 Version, IHL, Total Length, TTL, Protocol, and source and destination addresses
- How to calculate the IPv4 header length from IHL

## 📖 How to use

The planned app will let you complete a short introduction or skip it and choose an exercise.
You will select byte ranges or enter values, use hints, and then check your answers.

## 🔧 Getting started

There is no exercise page to run yet.
You can open the local `index.html` to view the coming-soon page.
The first release is planned as a static web app that works both on its published page and locally through `file://`.

## 🔬 Worked example

After the original sample frames are finalized, this section will show an answer with its byte range, hexadecimal value, interpreted value, and conversion steps.

## ⚠️ Scope and limitations

The first release will use Ethernet II frames containing IPv4 headers without options.
The sample byte arrays will omit the frame check sequence (FCS).
They will include consistent UDP datagrams, but the first release will not grade UDP fields.
Pasting your own hex dump and reading ICMPv4 are outside the first release.

## 🔒 Data and privacy

The first release will use only original built-in exercises, without free-form input.
The exercise page is planned to work without sending user input to an external service.

## 🧪 Development and tests

The first release is planned without package dependencies.
The sample-data checks and actual test commands will be documented after implementation.

## 📁 Directory structure

```text
hex-dump-trainer/
├── .gitignore    # Exclude local secrets and generated files
├── index.html    # Coming-soon page
├── style.css     # Coming-soon page styles
├── README.md     # Japanese
├── README.en.md  # English
└── LICENSE       # MIT License
```

## 📄 License

This project uses the MIT License. See [LICENSE](LICENSE) for the full text.

## 🔗 References

- [RFC 894: A Standard for the Transmission of IP Datagrams over Ethernet Networks](https://www.rfc-editor.org/rfc/rfc894.html)
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791.html)

## 🛠️ About this tool

This project is part of [Security Tools with Generative AI 200](https://akademeia.info/?page_id=44607).
