# ClaudeCode ログ可視化アプリ / ClaudeCode Log Visualization

[日本語は下部に記載 / English follows below]

---

## 概要 (Overview)

ClaudeCodeのログを可視化し、以下の情報を分析・表示するWebアプリケーションです。

- モデルごとのトークン使用量・コストの可視化
- 利用履歴のグラフ表示
- モデル別・日時別の集計
- リアルタイムでのリセットスケジュール表示
- ClaudeCodeログデータのアップロード・解析

本アプリはTypeScriptベースで開発されており、どなたでも手元で起動したり、Web上で利用できます。

**デプロイ済みアプリURL:**  
https://visualize-claude-code-usage.netlify.app/

---

## 特徴 (Features)

- ClaudeCodeの各種モデル利用状況の詳細な可視化
- トークンごとのコスト計算
- 期間別・モデル別のフィルタリング
- ログデータのアップロード＆即時解析
- シンプルなUIでどなたでも直感的に操作可能

---

## 使い方 (Usage)

1. [デプロイ済みサイト](https://visualize-claude-code-usage.netlify.app/)へアクセス
2. ClaudeCode からエクスポートしたログファイル(JSON/CSV等)をアップロード
3. グラフやテーブルで利用状況・コストを確認

---

## セットアップ (Local Setup)

### 必要環境 (Requirements)

- Node.js (v18以上推奨)
- npm or yarn

### インストールと起動 (Install & Run)

```bash
git clone https://github.com/anestec-rd/visualize-claude-code-usage.git
cd visualize-claude-code-usage
npm install
npm run dev
```
ブラウザで `http://localhost:3000` へアクセスしてください。

---

## デモ (Demo)

- 本番環境: [https://visualize-claude-code-usage.netlify.app/](https://visualize-claude-code-usage.netlify.app/)

---

## ライセンス (License)

GPL-3.0

---

# English

## Overview

This web application visualizes and analyzes ClaudeCode usage logs with the following features:

- Visualization of token and cost usage per model
- Graphical display of usage history
- Aggregation per model and date
- Real-time reset schedule view
- Upload and analysis of ClaudeCode log data

TypeScript-based, available both locally and as a web app.

**Deployed App:**  
https://visualize-claude-code-usage.netlify.app/

---

## Features

- Detailed visualization of each ClaudeCode model usage
- Token-level cost calculation
- Filtering by period or model
- Log upload & instant analysis
- Intuitive UI

---

## Usage

1. Access the [deployed site](https://visualize-claude-code-usage.netlify.app/)
2. Upload your exported ClaudeCode log file (JSON/CSV, etc.)
3. Check the status and cost via graphs and tables

---

## Local Setup

### Requirements

- Node.js (v18+ recommended)
- npm or yarn

### Install & Run

```bash
git clone https://github.com/anestec-rd/visualize-claude-code-usage.git
cd visualize-claude-code-usage
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Demo

- Production: [https://visualize-claude-code-usage.netlify.app/](https://visualize-claude-code-usage.netlify.app/)

---

## License

GPL-3.0
