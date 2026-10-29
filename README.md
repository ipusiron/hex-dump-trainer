<!--
---
id: day114
slug: hex-dump-trainer

title: "Hex Dump Trainer"

subtitle_ja: "16進ダンプを自分で読む演習"
subtitle_en: "Learn to Read Hex Dumps"

description_ja: "16進ダンプの演習と自由入力で、バイト位置からパケットのフィールドを読む学習ツール"
description_en: "A hex-dump learning tool with guided exercises and local inspection of pasted bytes"

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
demo_url: "https://ipusiron.github.io/hex-dump-trainer/"

hub: true
---
-->

# Hex Dump Trainer - 16進ダンプを自分で読む演習

![GitHub stars](https://img.shields.io/github/stars/ipusiron/hex-dump-trainer?style=social)
![GitHub forks](https://img.shields.io/github/forks/ipusiron/hex-dump-trainer?style=social)
![GitHub last commit](https://img.shields.io/github/last-commit/ipusiron/hex-dump-trainer)
![GitHub license](https://img.shields.io/github/license/ipusiron/hex-dump-trainer)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue?logo=github)](https://ipusiron.github.io/hex-dump-trainer/)

[English](README.en.md)

**Day114 - 生成AIで作るセキュリティツール200**

Hex Dump Trainerは、16進ダンプの中からバイトの位置を探し、Ethernet II・IPv4・UDP・ICMPv4 Echoを自分で読み解く演習ツールです。
16進ダンプを初めて見る人は、短い導入練習から始められます。
書籍がなくても使えます。
「学習」タブでは、内蔵フレームの値を入れたパケット図、16進ダンプ、オフセットの説明を使い、Ethernet II、IPv4、UDP、ICMPv4 Echoの読み方と関連RFCを確認できます。図、解説行、元のバイトはフィールドごとに連動して強調できます。
「自由入力」タブでは、自分の16進テキストを貼り付け、読み取れたフィールドと元のバイトを端末内で照合できます。

## 🌐 デモページ

👉 **[Hex Dump Trainerを開く](https://ipusiron.github.io/hex-dump-trainer/)**

ブラウザーだけで演習できます。教材は書籍を必要としない自作フレームです。

## 📸 スクリーンショット

![入門問題、16進ダンプ、拡張後の教材一覧を表示した画面](assets/screenshot-desktop-20261015.png)

![IPv4の図、解説行、元の16進バイトとVersionの上位4ビットを示す学習タブ](assets/screenshot-learning-20261015.png)

![比較元Aと回答対象Bの16進ダンプを並べて読む演習](assets/screenshot-comparison-20261015.png)

![スマートフォンでAとBのダンプを縦に表示し、それぞれ横スクロールできる画面](assets/screenshot-comparison-mobile-20261015.png)

![自由入力のフィールドと元のバイトの対応を示す画面](assets/screenshot-free-input-1280.png)

![スマートフォンで自由入力の読み取り結果を確認する画面](assets/screenshot-free-input-390.png)

![ICMPv4 Echoの図と16進ダンプの対応を示す学習画面](assets/screenshot-icmp-learning-1280.png)

![スマートフォンでICMPv4 Echoの図とハイライトを確認する画面](assets/screenshot-icmp-learning-390.png)

## ✨ 学べること

- ゼロ始まりのオフセットとバイトの位置の対応
- パケット図でのフィールドの並びと幅（IPv4・UDP・ICMPv4 Echoは32ビット単位）
- 図、解説行、元の16進バイトの対応をホバー、タップ、キーボードで確認する方法
- フレーム先頭からの絶対オフセットと各ヘッダー内の相対オフセット、VersionとIHLの4ビットずつの分け方
- Ethernet IIの宛先MACアドレス、送信元MACアドレス、EtherType
- IPv4のVersion、IHL、Total Length、TTL、Protocol、送信元アドレス、宛先アドレス
- IHLからのIPv4ヘッダー長の計算
- EtherType・IHL・Protocolを根拠にしたヘッダー境界の選択
- UDPヘッダーの位置、ポート、Length、Checksumフィールドの読み方と演習
- ICMPv4 Echo Request／ReplyのType、Code、Checksum、Identifier、Sequence Numberとデータの対応
- Pingの往復でIPv4アドレスが逆になること、RTTはEchoヘッダーの値ではなく送信側で測ること
- 2つのフレームを比較した最初の差分、TTL、IPv4ヘッダーチェックサムの読み取り
- 自分の16進ダンプで、読み取れたフィールドと元のバイトを照合する方法

## 📖 使い方

1. 「学習」タブでヘッダーの配置図と、その直下にある教材ダンプを見比べます。図や解説行にカーソルを合わせると対応するバイトまで強調され、タップか図の項目でEnter／Spaceを押すと選択できます。選択中は絶対／相対オフセットと元の16進値を表示します。狭い画面では図とダンプをそれぞれ横にスクロールできます。「演習」タブへ戻っても入力中の答えは保持されます。
2. 入門の2問から始めるか、導入をスキップしてEthernet IIへ進みます。教材一覧からいつでも切り替えられます。
3. 位置問題では開始と終了のバイトを順に選びます。小さい画面やキーボード操作では、10進数のオフセット入力も使えます。
4. 値問題と計算問題では、問題文で指定された表記の答えを入力します。
5. 「答え合わせ」で確認します。誤答なら再挑戦でき、ヒントは対象ヘッダー→相対位置→解答表示の3段階です。「答えを見る」でも解答を表示できます。
6. 「自由入力」タブでは、入力形式を選び、1フレーム分の16進テキストを貼り付けて「読み取る」を押します。フィールドを選ぶと、対応する元のバイトが強調されます。自由入力は採点しません。

「ヘッダー境界」ではIPv4全体とUDPの開始位置を特定します。「UDP」ではポートやLengthなどを読みます。「2パケット比較」ではAとBを先頭から照合し、最初の差分の位置とBの値を答えます。比較中、正答前に差分は強調されません。
「ICMPv4 Echo」では要求の固定8バイトを読み、「Pingの往復」では要求Aと応答Bを並べ、Type、Checksum、Identifier、Sequence Number、IPv4アドレスを照合します。通信は発生しません。

日英を切り替えても、開いているタブ、表示中の問題、選択範囲、入力値、結果は保持されます。教材の切り替え時は、その教材の問題が未回答状態から始まり、完了記録は残ります。

自由入力は、空白・改行を含む生の16進数（例：`02 FE DC BA 98 76`）と、行頭に連続した16進オフセットを付けた形式（例：`0000: 02 FE DC BA 98 76`）に対応します。後者は1行1～16バイトで、最初のオフセットは`0000`です。テキストは16,384文字以内、復元後は1フレーム4,096バイト以内です。`0x`表記、ASCII欄、pcap/pcapngには対応しません。

## 🔧 起動方法

[公開ページ](https://ipusiron.github.io/hex-dump-trainer/)へアクセスするか、ローカルの`index.html`を直接開いてください。`file://`でも動作します。インストールやサーバーは不要です。

## 🔬 解答例

IPv4教材のTotal Lengthは、フレーム先頭からの絶対オフセット`16〜17`、IPv4ヘッダー先頭（`14`）からの相対オフセット`2〜3`にあります。
該当バイトは`00 30`です。ネットワークバイト順に`0x0030`と読み、10進数へ変換すると`48`バイトです。Ethernet IIヘッダーの14バイトは、このTotal Lengthに含みません。

## 🎯 ユースケース

このツールならではの使い方

- 検算の値を差額だけで直す（数学・経理の検算）：IPv4ヘッダーチェックサムは、ヘッダーを16ビットずつ足し（あふれた桁は下の桁に足し戻す）、その合計のビットを反転した値である。「2パケット比較」で最初に値が異なるのはオフセット`22`のTTLで、TTLは`96`から`95`へ1減り、チェックサムは`0xDB76`から`0xDC76`へ`0x0100`（256）増える。TTLは16ビットの語の上位バイトにあるので、1減ると語は256減り、反転した合計は同じだけ増える。「Pingの往復」でもTypeが`8`から`0`になると、ICMP Checksumは`0xA28C`から`0xAA8C`へ`0x0800`（2,048）増える。帳簿の1行を直したときに、合計を足し直さず差額だけで直すのと同じ考え方である。ルーターがTTLを減らすたびにヘッダー全体を足し直さずに済むこの方法は、[RFC 1624](https://www.rfc-editor.org/rfc/rfc1624.html)にまとめられている。本ツールはチェックサムを再計算しないので、差は表示された値から自分で求める。
- 小さなデータを送るときのヘッダーの割合を見積もる（IoT・組み込み機器の設計）：「UDP」の教材ではUDPのLengthが`29`で、UDPヘッダーの8バイトを引くとデータは21バイトである。IPv4のTotal Length `49`にEthernet IIの14バイトを足すとフレームは63バイトになり、そのうち42バイト、ちょうど3分の2がEthernet II・IPv4・UDPのヘッダーである。センサーの値のような小さなデータを1件ずつ送ると、送る量の大半がヘッダーになることを、バイトを数えて示せる。何件かを1つのフレームにまとめれば、ヘッダーの割合は下がる。教材のバイト列はFCS（4バイト）を含まないため、実際の回線ではデータ以外の部分がさらに増える。
- 読む順で値が変わることを、日付の書き方と並べて示す（情報の授業）：「03/04」が国によって3月4日にも4月3日にもなるように、2バイト以上の値も読む順で変わる。「Pingの往復」のIdentifier `12 34`は、上位バイトから読むネットワークバイト順で`0x1234`（4,660）、逆から読むと`0x3412`（13,330）になる。Sequence Number `00 01`も1と256に分かれる。この2つの欄は送り手が要求と応答を対にするための値で、応答側は受け取った値をそのまま返すため、送り手の実装によって書く順が異なることがある。Wiresharkが`Identifier (BE)`と`Identifier (LE)`のように2つの値を並べて表示するのはこのためである。本ツールは上位バイトから読んだ値だけを表示する。

一般的な使い方

- オフセット`12〜13`の`08 00`を`0x0800`と読み、後続がIPv4であると確かめる。
- `45`の上位4ビットからVersion `4`、下位4ビットからIHL `5`を取り、IPv4ヘッダー長`20`バイトを求める。
- `C6 33 64 4D`を1バイトずつ10進数に変換し、`198.51.100.77`と読む。
- 答えを先に表示せず、バイト範囲を選んでから根拠を確認する。

## ⚠️ 教材の範囲と制限

教材はオプションなしのIPv4を含むEthernet IIフレームに限定します。
教材のバイト列にフレームチェックシーケンス（FCS）は含めません。
UDPとICMPv4 Echoの自作フレームは、長さとチェックサムが整合しています。フィールド値を採点しますが、チェックサムの再計算は求めません。
自由入力はEthernet II・IPv4・UDP・ICMPv4 Echoの完全に読めるフィールドを表示します。IPv4オプションがある場合はそのバイト範囲を表示し、IHLに従って上位ヘッダーの開始位置を移動します。途中で切れた入力、長さの不整合、対象外のEtherTypeやProtocolには警告を出します。フラグメントは再構成せず、チェックサムの妥当性も検証しません。
ICMPv4はEcho（Type 0／8、Code 0）の固有フィールドのみ対応します。Time Exceededなど他のTypeではType・Code・Checksumのみ表示します。VLAN、IPv6、ARP、TCP、ICMPv6、pcap/pcapngの読込には対応しません。

## 🔒 データとプライバシー

回答、進捗、自由入力のテキストと結果はページ内のメモリーだけに保持し、再読み込みで消えます。自由入力はURLに埋め込まず、アプリ自身は入力や回答を外部へ送信しません。機密情報を含むダンプの扱いには注意してください。GitHubのリンクを押した場合は、GitHubのサイトへ移動します。

## 🧪 開発と検証

HTML/CSS/JavaScriptのみで動作し、依存パッケージはありません。Node.js 22で次を実行すると、採点、全45問、7つの教材フレームのIPv4・UDP・ICMPv4の長さとチェックサム、自由入力の解析と警告を検証できます。

```sh
node --test test/*.test.js
```

CIでも同じテストとJavaScript構文検査を実行します。画面はローカルの`file://`とHTTP、320〜1280pxで確認しています。
ローカルにChromeがある場合、`node test/browser_qa.mjs "<Chromeの実行ファイル>"`で`file://`の入力操作と320・390・768・1280pxの表示を検証できます。任意のHTTP(S) URLを第2引数に渡すこともできます。このテストは`assets/`に自由入力の画面例を保存します。

## 📁 ディレクトリー構造

```text
hex-dump-trainer/
├── .github/workflows/test.yml # テストCI
├── .gitignore               # ローカルの機密ファイルなどを除外
├── assets/screenshot-desktop-20261015.png # 画面例
├── assets/screenshot-learning-20261015.png # 学習タブの画面例
├── assets/screenshot-comparison-20261015.png # 2パケット比較の画面例
├── assets/screenshot-comparison-mobile-20261015.png # 比較画面のモバイル例
├── assets/screenshot-free-input-{390,1280}.png # 自由入力の画面例
├── assets/screenshot-icmp-learning-{390,1280}.png # ICMPv4学習画面例
├── index.html               # 演習・学習・自由入力の画面
├── style.css                # モバイル優先のスタイル
├── app.js                   # 画面、タブ、進捗
├── core.js                  # バイト読取、採点、自由入力の解析
├── data.js                  # バージョン付き自作教材
├── test/                    # 依存なしの自動テスト
├── README.md                # 日本語版
├── README.en.md             # 英語版
└── LICENSE                  # MIT License
```

## 📄 ライセンス

MIT Licenseです。全文は[LICENSE](LICENSE)を参照してください。

## 🔗 参照資料

- [RFC 894: A Standard for the Transmission of IP Datagrams over Ethernet Networks](https://www.rfc-editor.org/rfc/rfc894.html)
- [RFC 791: Internet Protocol](https://www.rfc-editor.org/rfc/rfc791.html)
- [RFC 768: User Datagram Protocol](https://www.rfc-editor.org/rfc/rfc768.html)
- [RFC 792: Internet Control Message Protocol](https://www.rfc-editor.org/rfc/rfc792.html)
- [IANA: Protocol Numbers](https://www.iana.org/assignments/protocol-numbers/)
- [RFC 5737: IPv4 Address Blocks Reserved for Documentation](https://www.rfc-editor.org/rfc/rfc5737.html)

## 🛠️ このツールについて

本ツールは、「生成AIで作るセキュリティツール200」プロジェクトの一環として開発しました。
プロジェクトの詳細は[生成AIで作るセキュリティツール200](https://akademeia.info/?page_id=44607)をご覧ください。
