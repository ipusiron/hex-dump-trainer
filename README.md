<!--
---
id: day114
slug: hex-dump-trainer

title: "Hex Dump Trainer"

subtitle_ja: "16進ダンプを自分で読む演習"
subtitle_en: "Learn to Read Hex Dumps"

description_ja: "16進ダンプのバイト位置を探し、Ethernet IIとIPv4のヘッダーを読み解く初学者向け演習ツール"
description_en: "Beginner-friendly exercises for locating bytes in hex dumps and reading Ethernet II and IPv4 headers"

category_ja:
  - ネットワーク
category_en:
  - Networking

difficulty: 1

tags:
  - hex-dump
  - ethernet
  - ipv4
  - networking
  - education

repo_url: "https://github.com/ipusiron/hex-dump-trainer"

hub: false
---
-->

# Hex Dump Trainer - 16進ダンプを自分で読む演習

[English](README.en.md)

**Day114 - 生成AIで作るセキュリティツール200**

Hex Dump Trainerは、16進ダンプの中からバイトの位置を探し、Ethernet IIとIPv4のヘッダーを自分で読み解く演習ツールです。
16進ダンプを初めて見る人は、短い導入練習から始められます。
書籍がなくても使えます。

> 現在は開発準備中です。演習ページと教材はまだ実装されていません。

## ✨ 学べること

- ゼロ始まりのオフセットとバイトの位置の対応
- Ethernet IIの宛先MACアドレス、送信元MACアドレス、EtherType
- IPv4のVersion、IHL、Total Length、TTL、Protocol、送信元アドレス、宛先アドレス
- IHLからのIPv4ヘッダー長の計算

## 📖 使い方

実装後は、短い導入練習から始めるか、スキップして教材を選べるようにする予定です。
問題ではバイト範囲を選ぶか値を入力し、ヒントを使いながら答え合わせします。

## 🔧 起動方法

演習ページは未実装のため、現時点では起動できません。
第1弾では、公開ページとローカルの`file://`の両方で動作する静的なWebアプリケーションを予定しています。

## 🔬 解答例

自作教材のバイト列が確定した後に、バイト範囲、16進値、読み取った値、変換手順が一致する例を記載します。

## ⚠️ 教材の範囲と制限

第1弾の教材は、オプションなしのIPv4を含むEthernet IIフレームに限定します。
教材のバイト列にフレームチェックシーケンス（FCS）は含めません。
後続データは整合したUDPデータグラムとしますが、第1弾ではUDPのフィールドを採点しません。
自分の16進ダンプの貼り付け、ICMPv4などは第1弾に含みません。

## 🔒 データとプライバシー

第1弾は自作の内蔵教材のみを扱い、自由入力はありません。
演習ページは入力を外部へ送信しない構成で実装する予定です。

## 🧪 開発と検証

第1弾は依存パッケージを必要としない構成を予定しています。
実装後に、教材の検証方法と実際に使用するテストコマンドを記載します。

## 📁 ディレクトリー構造

```text
hex-dump-trainer/
├── README.md     # 日本語版
├── README.en.md  # 英語版
└── LICENSE       # MIT License
```

## 📄 ライセンス

MIT Licenseです。全文は[LICENSE](LICENSE)を参照してください。

## 🔗 参照資料

- [RFC 894: A Standard for the Transmission of IP Datagrams over Ethernet Networks](https://www.rfc-editor.org/rfc/rfc894.html)
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791.html)

## 🛠️ このツールについて

本ツールは、「生成AIで作るセキュリティツール200」プロジェクトの一環として開発します。
プロジェクトの詳細は[生成AIで作るセキュリティツール200](https://akademeia.info/?page_id=44607)をご覧ください。
