# ClaudeCode リセットスケジュール & 使用量分析 - プロジェクトストーリー

## Inspiration（インスピレーション・動機）

このプロジェクトは、日常的にClaudeCodeを使用する中で感じた3つの根本的な不便さから生まれました：

1. **リアルタイムの利用状況が見たい**: 「現在どのくらいリソースを消費しているのか分からない...」
2. **上限まであとどのくらいでリセットされるのか確認したい**: 「いつリセットされるのか分からないのがめんどい...」
3. **何時間かけて今のリソースを消費する計画にすればいいんだ**: 「効率的なリソース消費計画を立てたい！」

ClaudeCodeの5時間リセットサイクルは理論的には理解していても、実際の使用パターンに基づいた動的なリセット時刻の計算や、現在の使用状況の把握、そして戦略的なリソース消費計画の立案が困難でした。特に、使用開始から5時間後にリセットされるという仕組みと、5時間以上間隔が空いた場合の新サイクル開始という複雑なルールを正確に追跡し、それに基づいて効率的な作業計画を立てるのは至難の業でした。

### 発見と学習

プロジェクト開発中に、ccusage（Claude Code Usage）の話題が出てきたのも、まさにこの使用量可視化の需要からの自然な派生でした。調査を進める中で、Claudeセッションのログファイル（JSONL形式）が存在することを発見し、「これを視覚化してリアルタイム分析ツールを作ろう」というアイデアが生まれました。

## What it does（何ができるか）

### 現在の主要機能

#### 1. リアルタイムリセットスケジュール
- ローカルタイムゾーン時刻表示
- 動的5時間サイクル計算
- 次回リセットまでのカウントダウン
- 00分スナップ機能
- **目的達成**: リセット時刻の正確な把握

#### 2. 詳細使用量分析
- トークン使用量の詳細内訳（入力・出力・キャッシュ）
- モデル別使用統計
- 時間別使用分布
- コスト計算（入力・出力・キャッシュ書込・読込別）
- **目的達成**: リアルタイムの利用状況確認

#### 3. プラン別コストシミュレーション
- 従量課金制での推定コスト
- 200ドルプランでの節約効果計算
- 4倍トークン使用時のシミュレーション
- 月間使用量推定
- **目的達成**: 効率的なリソース消費計画の立案

#### 4. 期間別履歴表示（高度な管理機能）
- 5時間期間ごとの使用履歴
- 現在期間の詳細表示
- コスト重み付けでの視覚化
- モデル別詳細分析
- フィルタリング機能（日付範囲、最小リクエスト数、最小コスト）
- ソート機能（日時、リクエスト数、コスト、トークン数）
- ページネーション機能（10/20/50/100件表示切り替え）

#### 5. ファイル管理システム
- 複数JSONLファイルの管理
- ファイル選択機能（新規ファイル自動選択）
- IndexedDBでの永続保存
- サンプルデータダウンロード機能（3種類）
- 選択ファイルの削除機能
- 全ファイルクリア機能

#### 6. 多言語対応
- 英語・日本語の完全対応
- 動的言語切り替え
- ローカライゼーション対応

#### 7. プライバシー保護機能
- 完全ブラウザ内処理
- 外部データ送信なし
- ローカルタイムゾーン対応
- セキュアなローカルストレージ

### プロジェクトの価値と成果

#### 1. 透明性の向上
リセット時刻の可視化により、ユーザーは使用計画を立てやすくなり、効率的なClaudeCode利用が可能になりました。**当初の目的「上限まであとどのくらいでリセットされるのか確認したい」を完全に達成。**

#### 2. 使用量の把握
詳細な統計により、現在の使用状況を正確に把握でき、コスト管理が容易になりました。**当初の目的「リアルタイムの利用状況が見たい」を完全に達成。**

#### 3. コスト最適化
プラン別シミュレーションにより、最適な料金プランを選択できるようになり、コスト効率が向上しました。**当初の目的「何時間かけて今のリソースを消費する計画にすればいいんだ」を完全に達成。**

#### 4. 使用パターンの分析
時間別分布やモデル別使用状況の分析により、使用習慣の最適化が可能になりました。

#### 5. プライバシー保護
全ての処理がブラウザ内で完結し、データが外部に送信されないため、プライバシーが保護されます。

#### 6. アクセシビリティの向上
サンプルデータ機能（現在期間サンプル含む）により、新規ユーザーでも簡単に機能を試すことができ、導入障壁が大幅に低下しました。

#### 7. 大量データの効率的な管理
フィルタリング、ソート、ページネーション機能により、長期間の使用履歴も効率的に管理・分析できるようになりました。

## How we built it（開発方法）

### 技術的な学習ポイント

- **動的リセットサイクルの実装**: 単純な5時間間隔ではなく、実際の使用パターンに基づいた動的なサイクル計算
- **00分スナップ機能**: 実際のClaudeCodeの挙動に合わせて、リセット時刻を00分に調整する仕組み
- **ClaudeCodeのログ形式への対応**: ClaudeCodeのJSONLログ形式の解析と統計計算
- **リアルタイム更新**: 1秒ごとの時刻更新とカウントダウン表示
- **ブラウザ内データ永続化**: IndexedDBを使用した安全なローカルストレージ
- **期間履歴の高度な管理**: フィルタリング、ソート、ページネーション機能による大量データの効率的な表示
- **現在期間サンプルデータ生成**: 実データがない場合でも機能をテストできるダミーデータ生成機能
- **ローカルタイムゾーン対応**: ユーザーの地域に合わせた時刻表示

### プロジェクトの構築過程

#### 1. 基本機能の実装（リアルタイム状況把握）
- リアルタイム時刻表示（ローカルタイムゾーン対応）
- 5時間リセットサイクルのカウントダウン
- 基本的なUI/UXデザイン
- **目的達成**: リアルタイムの利用状況確認の基盤構築

#### 2. データ解析機能の追加（使用量可視化）
- JSONLファイルのパース機能
- 使用量統計の計算
- モデル別コスト分析
- **目的達成**: 現在の使用状況の詳細な把握

#### 3. 高度な機能の実装（リソース消費計画支援）
- 動的リセットサイクルの計算
- 期間別使用履歴
- プラン別コストシミュレーション
- モデル別詳細分析
- **目的達成**: 効率的なリソース消費計画の立案支援

#### 4. UX改善とアクセシビリティ向上
- ファイル管理機能の強化
- 複数ファイル対応と自動選択機能
- エラーハンドリング
- レスポンシブデザイン

#### 5. デザインの洗練と使いやすさの向上
- **落ち着いた色合いへの調整**: 初期のカラフルなデザインから、より落ち着いたスレート・グレー系の配色に変更
- **ヘッダーの改善**: プライバシー保護、ブラウザ内処理、リアルタイム分析の特徴を示すバッジを追加
- **サンプルデータ機能の追加**: ユーザーが自分のログファイルなしでも機能を試せるサンプルJSONLファイルのダウンロード機能
- **多言語対応の強化**: 英語・日本語の完全対応とローカライゼーション

#### 6. ユーザビリティの向上と高度な機能追加
- **サンプルデータの提供**: 3つの異なるセッションパターンを含むサンプルファイル
  - Todo リスト開発セッション（Claude 4 Sonnet中心）
  - データ分析プロジェクトセッション（Claude 4 Opus中心）
  - 現在期間サンプル（実データまたはダミーデータ）
- **期間履歴の高度な管理**: フィルタリング、ソート、ページネーション機能
- **ファイル管理の強化**: 選択ファイルの削除、全ファイルのクリア、新規ファイル自動選択機能
- **現在期間の詳細表示**: 現在進行中の期間の使用状況をリアルタイムで表示

#### 7. プライバシー保護とローカル処理の強化
- **完全ブラウザ内処理**: 全ての計算とデータ処理をブラウザ内で実行
- **外部送信なし**: データが外部サーバーに送信されない設計
- **ローカルタイムゾーン対応**: ユーザーの地域設定に合わせた時刻表示
- **Bolt.newバッジ**: 開発プラットフォームの明示

### 技術スタック

- **フロントエンド**: React + TypeScript + Tailwind CSS
- **アイコン**: Lucide React
- **データストレージ**: IndexedDB（ブラウザ内永続化）
- **ビルドツール**: Vite
- **開発環境**: WebContainer（Bolt.new）
- **国際化**: カスタム多言語対応システム

### デザインの進化

#### 初期デザイン
- カラフルな配色（青・紫・緑系の鮮やかな色）
- 視覚的にインパクトがあるが、「見づらい」との指摘

#### 中間デザイン
- 落ち着いた色合いに調整
- しかし、ヘッダーが暗すぎてグレースケールとなったため指摘

#### 現在のデザイン
- **スレート・グレー系の洗練された配色**
- **機能特徴を示すバッジ**（プライバシー保護・ブラウザ内処理・リアルタイム分析）
- **アンバー系のアクセントカラー**（アニメーション要素）
- **統一感のある色彩設計**
- **視認性と美しさのバランス**
- **Bolt.newバッジ**による開発プラットフォームの明示

## Challenges we ran into（直面した課題）

### 1. 複雑なリセットロジック
**課題**: ClaudeCodeの実際の挙動を正確に再現するため、以下の複雑なルールを実装する必要がありました：
- 初回使用時刻の「時」を基準とした00分スナップ
- 5時間以上の間隔での新サイクル開始
- 動的な基準時刻の計算

**解決策**: 実際のログデータを詳細に分析し、時刻計算アルゴリズムを段階的に改善。テストケースを作成して動作を検証。

### 2. ClaudeCodeのログ形式への対応
**課題**: 
- Claudeセッションログの複雑な構造
- データの正規化と統合
- トークン使用量の正確な抽出

**解決策**: 複数のログ形式に対応するパーサーを実装し、エラーハンドリングを強化。サンプルデータを作成してテスト環境を整備。

### 3. パフォーマンスの最適化
**課題**:
- 大量のログデータの効率的な処理
- リアルタイム更新の最適化
- メモリ使用量の管理

**解決策**: データ処理の最適化、不要な再計算の削減、効率的なデータ構造の採用。期間履歴のページネーション機能により大量データの表示を最適化。

### 4. 正確なコスト計算
**課題**:
- モデル別の料金体系の実装（2025年基準への更新）
- 入力・出力トークンの個別計算
- プラン別シミュレーションの精度向上

**解決策**: 最新の料金情報を反映した計算ロジックの実装、キャッシュ機能のコスト計算への対応。

### 5. モデル利用量・コスト分析システムの複雑性
**課題**:
- **異なるモデルごとの複雑な料金体系**: Claude 4 Opus（入力$15/1M、出力$75/1M）、Claude 4 Sonnet（入力$3/1M、出力$15/1M）、GPT-4系（$30-60/1M）など、各モデルで大幅に異なる料金設定への対応
- **多様なトークン種別の正確な集計**: 基本の入力・出力トークンに加え、キャッシュ作成トークン（1.25倍料金）、キャッシュ読み込みトークン（0.1倍料金）の4種類を正確に区別・計算する必要性
- **モデル名の多様性とマッチング**: `claude-4-sonnet`、`claude-sonnet-4`、`claude-sonnet-4-20250514`など、同一モデルでも複数の表記が存在するため、堅牢なパターンマッチングが必要
- **用途別使用パターンの違い**: コード生成、分析、チャットなど用途によってトークン使用比率が大きく異なるため、正確な統計計算が困難

**解決策**: 
- **柔軟な料金体系管理**: MODEL_PRICINGオブジェクトによる構造化された料金定義と、部分マッチングによる堅牢なモデル識別システム
- **詳細なコスト内訳計算**: 入力・出力・キャッシュ書込・読込の各コストを個別に追跡し、デバッグログで検証可能な透明性の高い計算システム
- **包括的なテストケース**: 異なるモデル、使用パターン、トークン配分を含む多様なサンプルデータによる計算精度の検証

### 6. デザインとユーザビリティの改善
**課題**:
- 初期デザインが「カラフル過ぎて見づらい」
- ヘッダーが暗すぎる
- 新規ユーザーがデータなしで機能を試せない

**解決策**:
- スレート・グレー系の落ち着いた配色に統一
- ヘッダーにプライバシー保護・ブラウザ内処理・リアルタイム分析のバッジを追加
- サンプルデータダウンロード機能を追加（現在期間サンプル含む）
- 多言語対応の強化とローカライゼーション

### 7. 大量データの管理と表示
**課題**:
- 長期間の使用履歴による大量の期間データ
- 効率的なデータフィルタリングとソート
- ユーザビリティを損なわない表示方法

**解決策**:
- 期間履歴にフィルタリング機能（日付範囲、最小リクエスト数、最小コスト）を実装
- ソート機能（日時、リクエスト数、コスト、トークン数）を追加
- ページネーション機能により表示パフォーマンスを向上

## Accomplishments that we're proud of（達成できたこと）

このプロジェクトは、日常的な不便さを解決するという明確な目的から始まり、「**リアルタイムの利用状況確認**」「**リセット時刻の把握**」「**効率的なリソース消費計画の立案**」という3つの核となる目標を完全に達成しました。

### 主要な達成事項

#### 当初目標の完全達成
- **リアルタイムの利用状況確認**: 詳細な統計により、現在の使用状況を正確に把握でき、コスト管理が容易になりました
- **リセット時刻の把握**: リセット時刻の可視化により、ユーザーは使用計画を立てやすくなり、効率的なClaudeCode利用が可能になりました
- **効率的なリソース消費計画の立案**: プラン別シミュレーションにより、最適な料金プランを選択できるようになり、コスト効率が向上しました

#### 包括的ソリューションの開発
技術的な挑戦とユーザビリティの向上を両立させた包括的なソリューションに発展し、特に期間履歴の高度な管理機能（フィルタリング、ソート、ページネーション）や現在期間サンプルデータ機能の追加により、プロジェクトのアクセシビリティと実用性が大幅に向上しました。

#### プライバシー重視の設計
プライバシー保護を最優先に設計され、全ての処理がブラウザ内で完結する安全な設計により、ClaudeCodeユーザーにとって真に価値のあるツールとして成長を続けています。

#### ユーザーエクスペリエンスの向上
- **アクセシビリティの向上**: サンプルデータ機能（現在期間サンプル含む）により、新規ユーザーでも簡単に機能を試すことができ、導入障壁が大幅に低下しました
- **大量データの効率的な管理**: フィルタリング、ソート、ページネーション機能により、長期間の使用履歴も効率的に管理・分析できるようになりました
- **使用パターンの分析**: 時間別分布やモデル別使用状況の分析により、使用習慣の最適化が可能になりました
- **プライバシー保護**: 全ての処理がブラウザ内で完結し、データが外部に送信されないため、プライバシーが保護されます

#### 高精度なモデル別コスト分析システムの実現
- **複雑な料金体系への完全対応**: Claude 4 Opus、Sonnet、GPT-4系など複数のAIモデルの料金体系（最大25倍の差）を正確に反映した計算システムを実装
- **4種類のトークンコストの正確な算出**: 入力・出力・キャッシュ作成・キャッシュ読み込みの各トークンを個別に追跡し、それぞれ異なる料金（例：Sonnetでキャッシュ作成$3.75/1M、読み込み$0.3/1M）で正確に計算
- **堅牢なモデル識別システム**: 同一モデルの多様な表記（`claude-4-sonnet`、`claude-sonnet-4-20250514`など）に対応する包括的なパターンマッチング機能
- **透明性の高いコスト内訳**: デバッグログによる詳細なコスト計算過程の可視化により、ユーザーが計算根拠を確認できる信頼性の高いシステム
- **包括的テストケースによる品質保証**: 多様な使用パターン（コード生成、データ分析、チャットなど）を含むサンプルデータによる継続的な計算精度検証

## What we learned（学び）

### 技術的な学び
- **リアルタイムデータ処理**: 効率的なデータ更新とパフォーマンス最適化
- **複雑なビジネスロジック**: 動的リセットサイクルの実装
- **ユーザビリティ設計**: 直感的なインターフェースの重要性
- **国際化対応**: 多言語アプリケーションの設計パターン
- **大量データ管理**: フィルタリング、ソート、ページネーションの複雑性
- **プライバシー保護**: ブラウザ内完結型アプリケーションの設計
- **モデル別料金体系の実装**: 各AIモデルの料金構造の違い（Claude OpusとSonnetで最大25倍の差）を正確に反映するシステム設計の複雑さ
- **コスト計算の精度確保**: 入力・出力・キャッシュ作成・読み込みの4種類のトークンを正確に区別し、それぞれ異なる料金体系で計算する必要性
- **堅牢なモデル識別**: 同一モデルでも複数の表記形式（`claude-4-sonnet`、`claude-sonnet-4-20250514`など）に対応するパターンマッチング技術
- **テストデータ設計の重要性**: 複雑な料金計算ロジックを検証するため、多様な使用パターンを含むサンプルデータの作成と継続的な検証体制の構築

### デザインの学び
- **ユーザーフィードバックの重要性**: 「カラフル過ぎる」「暗すぎる」といった率直な意見の価値
- **段階的な改善**: 一度に完璧を目指すのではなく、フィードバックを受けて改善する重要性
- **バランスの取り方**: 視覚的なインパクトと実用性のバランス
- **アクセシビリティ**: 新規ユーザーでも簡単に試せる仕組みの重要性
- **機能の可視化**: プライバシー保護やリアルタイム処理などの特徴を明確に伝える重要性

### プロジェクト管理の学び
- **ユーザー中心設計**: 実際の不便さから始まったプロジェクトの強み
- **段階的な機能追加**: 基本機能から高度な機能への段階的な発展
- **継続的な改善**: ユーザーフィードバックに基づく継続的な改善の重要性
- **目的の明確化**: 当初の3つの目的を常に意識した開発の重要性

## What's next for visualize-claude-code-usage（今後の展望）

### 短期的な改善
- より詳細な使用パターン分析
- 予測機能の追加
- エクスポート機能の強化

### 中期的な拡張
- 他のAIサービスへの対応拡張
- チーム利用向け機能
- より高度な分析機能

### 長期的なビジョン
- AI使用量管理のデファクトスタンダードツールとしての地位確立
- エンタープライズ向け機能の追加
- API連携による自動データ取得

今後も、ユーザーのニーズに応えながら、AI利用の透明性と効率性を向上させるツールとして発展していくことを目指しています。

## 結論

---

*最終更新: 2025-06-30*  
*作成者: Misa Sekine*  
*開発プラットフォーム: Bolt.new*
