# Claude Code JSONL ファイル分析資料

## 概要

Claude Codeが生成するJSONLファイルは、AI開発セッションの完全な記録を保持するログファイルです。これらのファイルには会話履歴、ツール使用記録、トークン使用量などの詳細な情報が含まれています。

## ファイル構造

### 格納場所
```
/home/anestec/.claude/projects/
├── -home-anestec/                              # ホームディレクトリでの一般的な作業セッション
│   ├── [UUID].jsonl                           # 個別セッションファイル
│   └── ...
└── -home-anestec-sup-work-03-Project-sup-work/ # sup-workプロジェクト専用セッション
    └── [UUID].jsonl                           # プロジェクト固有セッションファイル
```

### ファイル命名規則
- ディレクトリ名：作業ディレクトリのパスをハイフン区切りに変換
- ファイル名：UUID形式のセッションID（例：`0cf0eb0d-4cb5-45f4-9d1f-27e45e1695ef.jsonl`）

## JSONLファイルの構造

### 基本フォーマット
各行は独立したJSONオブジェクトで、以下の基本構造を持ちます：

```json
{
  "parentUuid": "親メッセージのUUID",
  "isSidechain": false,
  "userType": "external",
  "cwd": "/home/anestec",
  "sessionId": "セッションUUID",
  "version": "Claude Codeバージョン",
  "type": "user|assistant",
  "message": {
    "role": "user|assistant",
    "content": "メッセージ内容"
  },
  "uuid": "メッセージUUID",
  "timestamp": "ISO8601形式のタイムスタンプ"
}
```

### レコードタイプ

#### 1. セッション開始（summary）
```json
{
  "type": "summary",
  "summary": "セッションタイトル",
  "leafUuid": "最後のメッセージUUID"
}
```

#### 2. ユーザーメッセージ
```json
{
  "type": "user",
  "message": {
    "role": "user", 
    "content": "ユーザーからの質問・指示"
  }
}
```

#### 3. アシスタント応答
```json
{
  "type": "assistant",
  "message": {
    "id": "メッセージID",
    "type": "message",
    "role": "assistant",
    "model": "claude-sonnet-4-20250514",
    "content": [
      {
        "type": "text",
        "text": "応答テキスト"
      },
      {
        "type": "tool_use",
        "id": "ツールID",
        "name": "ツール名",
        "input": "ツール入力パラメータ"
      }
    ],
    "usage": {
      "input_tokens": 入力トークン数,
      "cache_creation_input_tokens": キャッシュ作成時の入力トークン数,
      "cache_read_input_tokens": キャッシュ読み込み時の入力トークン数,
      "output_tokens": 出力トークン数,
      "service_tier": "standard"
    }
  }
}
```

#### 4. ツール実行結果
```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": [
      {
        "tool_use_id": "ツールID",
        "type": "tool_result", 
        "content": "ツール実行結果"
      }
    ]
  }
}
```

#### 5. コマンド実行記録
```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": "<command-name>コマンド名</command-name>\n<command-message>説明</command-message>\n<command-args>引数</command-args>"
  }
}
```

## トークン使用量の算出方法

### 1. 基本的なトークンカウント

各アシスタント応答の`usage`オブジェクトから以下を取得：

```json
"usage": {
  "input_tokens": 3,                    // 入力トークン数
  "cache_creation_input_tokens": 20303, // キャッシュ作成時の入力トークン
  "cache_read_input_tokens": 0,         // キャッシュから読み込んだトークン
  "output_tokens": 1,                   // 出力トークン数
  "service_tier": "standard"            // サービスティア
}
```

### 2. セッション全体のトークン計算

#### Python実装例：
```python
import json
import re

def calculate_session_tokens(jsonl_file_path):
    total_input_tokens = 0
    total_output_tokens = 0
    total_cache_creation_tokens = 0
    total_cache_read_tokens = 0
    request_count = 0
    
    with open(jsonl_file_path, 'r', encoding='utf-8') as file:
        for line in file:
            try:
                record = json.loads(line.strip())
                
                # アシスタント応答のみを対象
                if (record.get('type') == 'assistant' and 
                    'message' in record and 
                    'usage' in record['message']):
                    
                    usage = record['message']['usage']
                    total_input_tokens += usage.get('input_tokens', 0)
                    total_output_tokens += usage.get('output_tokens', 0)
                    total_cache_creation_tokens += usage.get('cache_creation_input_tokens', 0)
                    total_cache_read_tokens += usage.get('cache_read_input_tokens', 0)
                    request_count += 1
                    
            except json.JSONDecodeError:
                continue
    
    return {
        'total_input_tokens': total_input_tokens,
        'total_output_tokens': total_output_tokens,
        'total_cache_creation_tokens': total_cache_creation_tokens,
        'total_cache_read_tokens': total_cache_read_tokens,
        'total_requests': request_count,
        'total_tokens': total_input_tokens + total_output_tokens
    }
```

### 3. コスト計算（Claude Sonnet 4の場合）

```python
def calculate_cost(token_stats):
    # Claude Sonnet 4の料金（例：実際の料金は公式サイトで確認）
    INPUT_TOKEN_COST = 0.000015   # $15 per 1M tokens
    OUTPUT_TOKEN_COST = 0.000075  # $75 per 1M tokens
    CACHE_CREATION_COST = 0.0000075  # $7.5 per 1M tokens
    CACHE_READ_COST = 0.0000015   # $1.5 per 1M tokens
    
    input_cost = token_stats['total_input_tokens'] * INPUT_TOKEN_COST
    output_cost = token_stats['total_output_tokens'] * OUTPUT_TOKEN_COST
    cache_creation_cost = token_stats['total_cache_creation_tokens'] * CACHE_CREATION_COST
    cache_read_cost = token_stats['total_cache_read_tokens'] * CACHE_READ_COST
    
    total_cost = input_cost + output_cost + cache_creation_cost + cache_read_cost
    
    return {
        'input_cost': input_cost,
        'output_cost': output_cost,
        'cache_creation_cost': cache_creation_cost,
        'cache_read_cost': cache_read_cost,
        'total_cost': total_cost
    }
```

## リクエスト回数のカウント方法

### 1. 基本的なリクエストカウント

```python
def count_requests(jsonl_file_path):
    api_requests = 0
    tool_uses = 0
    commands = 0
    
    with open(jsonl_file_path, 'r', encoding='utf-8') as file:
        for line in file:
            try:
                record = json.loads(line.strip())
                
                # APIリクエスト（アシスタント応答）
                if record.get('type') == 'assistant' and 'requestId' in record:
                    api_requests += 1
                
                # ツール使用
                if (record.get('type') == 'assistant' and 
                    'message' in record and 
                    'content' in record['message']):
                    content = record['message']['content']
                    if isinstance(content, list):
                        for item in content:
                            if item.get('type') == 'tool_use':
                                tool_uses += 1
                
                # コマンド実行
                if (record.get('type') == 'user' and 
                    'message' in record and 
                    '<command-name>' in str(record['message'].get('content', ''))):
                    commands += 1
                    
            except json.JSONDecodeError:
                continue
    
    return {
        'api_requests': api_requests,
        'tool_uses': tool_uses,
        'commands': commands
    }
```

### 2. 時系列分析

```python
from datetime import datetime

def analyze_session_timeline(jsonl_file_path):
    timeline = []
    
    with open(jsonl_file_path, 'r', encoding='utf-8') as file:
        for line in file:
            try:
                record = json.loads(line.strip())
                
                if 'timestamp' in record:
                    timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
                    timeline.append({
                        'timestamp': timestamp,
                        'type': record.get('type'),
                        'message_type': record.get('message', {}).get('role'),
                        'tokens': record.get('message', {}).get('usage', {}).get('output_tokens', 0)
                    })
                    
            except (json.JSONDecodeError, ValueError):
                continue
    
    # 時系列順にソート
    timeline.sort(key=lambda x: x['timestamp'])
    
    return timeline
```

## 分析ツールの実装

### 完全な分析スクリプト

```python
#!/usr/bin/env python3
"""
Claude Code JSONL 分析ツール
"""

import json
import os
import argparse
from datetime import datetime
from pathlib import Path

class ClaudeCodeAnalyzer:
    def __init__(self, claude_projects_dir="/home/anestec/.claude/projects"):
        self.projects_dir = Path(claude_projects_dir)
    
    def find_all_sessions(self):
        """全セッションファイルを検索"""
        sessions = []
        for project_dir in self.projects_dir.iterdir():
            if project_dir.is_dir():
                for jsonl_file in project_dir.glob("*.jsonl"):
                    sessions.append({
                        'project': project_dir.name,
                        'session_id': jsonl_file.stem,
                        'file_path': jsonl_file
                    })
        return sessions
    
    def analyze_session(self, jsonl_file_path):
        """個別セッションの分析"""
        with open(jsonl_file_path, 'r', encoding='utf-8') as file:
            records = [json.loads(line.strip()) for line in file if line.strip()]
        
        # 基本統計
        total_records = len(records)
        user_messages = sum(1 for r in records if r.get('type') == 'user')
        assistant_messages = sum(1 for r in records if r.get('type') == 'assistant')
        
        # トークン統計
        token_stats = self._calculate_tokens(records)
        
        # リクエスト統計
        request_stats = self._count_requests(records)
        
        # 時間統計
        time_stats = self._analyze_timing(records)
        
        return {
            'basic_stats': {
                'total_records': total_records,
                'user_messages': user_messages,
                'assistant_messages': assistant_messages
            },
            'token_stats': token_stats,
            'request_stats': request_stats,
            'time_stats': time_stats
        }
    
    def _calculate_tokens(self, records):
        """トークン統計計算"""
        # 前述のcalculate_session_tokensと同様の実装
        pass
    
    def _count_requests(self, records):
        """リクエスト統計計算"""
        # 前述のcount_requestsと同様の実装
        pass
    
    def _analyze_timing(self, records):
        """時間統計分析"""
        # 前述のanalyze_session_timelineと同様の実装
        pass

def main():
    parser = argparse.ArgumentParser(description='Claude Code JSONL分析ツール')
    parser.add_argument('--session', help='特定のセッションファイルを分析')
    parser.add_argument('--project', help='特定のプロジェクトのセッションを分析')
    parser.add_argument('--summary', action='store_true', help='全セッションの要約を表示')
    
    args = parser.parse_args()
    
    analyzer = ClaudeCodeAnalyzer()
    
    if args.session:
        # 個別セッション分析
        result = analyzer.analyze_session(args.session)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    elif args.summary:
        # 全セッション要約
        sessions = analyzer.find_all_sessions()
        print(f"総セッション数: {len(sessions)}")
        for session in sessions:
            print(f"プロジェクト: {session['project']}, セッション: {session['session_id']}")
    else:
        print("使用方法: python claude_analyzer.py --summary")

if __name__ == "__main__":
    main()
```

## 活用方法

### 1. コスト管理
- セッション毎のトークン使用量監視
- プロジェクト別のコスト分析
- 月次/週次レポート生成

### 2. パフォーマンス分析
- 応答時間の測定
- ツール使用パターンの分析
- エラー率の追跡

### 3. 作業効率分析
- タスク完了時間の測定
- 成功/失敗パターンの識別
- 最適な作業フローの特定

### 4. セキュリティ監査
- APIキー等の機密情報漏洩チェック
- 不審なアクセスパターンの検出
- コンプライアンス要件の確認

## 注意事項

1. **プライバシー**: JSONLファイルには会話内容が平文で保存されます
2. **容量管理**: 長時間のセッションでは大容量になる可能性があります
3. **バックアップ**: 重要なセッション記録は定期的にバックアップしてください
4. **アクセス制御**: 機密情報を含む場合は適切なアクセス制御を実施してください

## 関連リソース

- [Claude Code公式ドキュメント](https://docs.anthropic.com/en/docs/claude-code)
- [Claude API料金表](https://www.anthropic.com/pricing)
- [JSONLフォーマット仕様](http://jsonlines.org/)

---

*最終更新: 2025-06-28*
*作成者: Claude Code + Human Review*