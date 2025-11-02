# UniNavi – AI大学ナビゲーションプラットフォーム

UniNavi は Next.js 16 + React 19 を基盤に、学生が進学先を検索・比較できる AI サポート型の大学ナビゲーションツールです。Tailwind CSS v4 と shadcn/ui を活用したモダンな UI/UX に加え、バックエンドの FastAPI と Hugging Face / Tavily / Serper API を組み合わせることで、最新の入試情報と AI チャット機能を提供します。

## ✨ 主な特徴

- **ストリーミング AI チャット**: Hugging Face Chat Completions API を用いたストリーミング応答。Markdown（表・箇条書きなど）に対応し、進路相談をリアルタイムでサポート。
- **大学検索の自動要約**: Tavily / Serper API で取得した検索結果を AI が集約し、偏差値・共テ得点率・入試方式・必要科目などを構造化してカード表示。
- **詳細な入試情報**: 試験日、出願締切、入試スケジュール、共テ配点比率、特記事項、入試方式、科目別配点など受験生が必要とする情報を網羅。
- **公式サイトリンクの補正**: `.ac.jp` ドメインや admissions ページを優先的に抽出し、参照元リンクとともに信頼性を担保。
- **お気に入り機能**: 気になる大学を保存し、入試形態ごとの内訳や比較表示が可能。
- **フロントエンド/バックエンド分離構成**: Next.js (フロント) と FastAPI (バック) を分離し、拡張性とテスト容易性を確保。

## 🚀 セットアップ

### 前提条件

- Node.js 18.18+ または 20+
- Python 3.11+
- `bun`（推奨）または任意のパッケージマネージャ
- 取得必須の API キー
    - `HF_API_KEY` (Hugging Face)
    - `HF_MODEL_ID` (任意、既定値は `MiniMaxAI/MiniMax-M2:novita`)
    - `TAVILY_API_KEY` または `SERPER_API_KEY`

### フロントエンド

```bash
cd uninavi
bun install
bun dev
```

### バックエンド

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell の場合
pip install -r requirements.txt
python main.py
```

バックエンドは `http://localhost:8000` で FastAPI が起動し、フロントエンドから `NEXT_PUBLIC_API_URL` 経由でアクセスされます。

## 📦 利用可能なスクリプト（フロントエンド）

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `bun dev`              | Next.js 開発サーバを起動します。                  |
| `bun run build`        | 最適化された本番ビルドを生成します。              |
| `bun run start`        | 本番ビルドをローカルで提供します。                |
| `bun run lint`         | ESLint（警告も失敗扱い）を実行します。            |
| `bun run lint:fix`     | ESLint の自動修正を試みます。                     |
| `bun run format`       | Prettier + Tailwind で整形します。                |
| `bun run format:check` | 整形の差分のみを確認します。                      |
| `bun run typecheck`    | TypeScript 型チェックを `--noEmit` で実行します。 |

バックエンドのローカル開発では `python main.py` で ASGI サーバ（Uvicorn）が立ち上がります。

## 🧱 プロジェクト構成（抜粋）

```
uninavi/
├─ app/                  # Next.js App Router ページとレイアウト
├─ components/
│  ├─ layout/            # レイアウト・カード・チャットなど主要UI
│  └─ ui/                # shadcn/ui ベースの再利用コンポーネント
├─ hooks/                # カスタムフック（お気に入り管理など）
├─ backend/
│  ├─ main.py            # FastAPI エントリーポイント
│  └─ services/
│     ├─ summarize.py    # Web検索 + AI要約パイプライン
│     └─ ai_search.py    # ストリーミングチャット機能
└─ README.md             # 本ドキュメント
```

## 🧠 バックエンド API ハイライト

### `/api/chat/stream`

- Hugging Face Chat Completions API を利用し、進路相談チャットをストリーミングで返却。
- SSE イベント (`delta`, `complete`, `error`) をフロントが逐次描画。
- Markdown/GFM（表・箇条書き）に対応。

### `/api/search`

- ユーザーのフィルタ条件から検索クエリを構築。Tavily / Serper を並列実行し、高速に結果取得。
- AI が偏差値・共テ得点率・入試方式・必要科目・公式URL・入試日程などを JSON 構造化。
- 公式サイト URL を補正し、信頼度に基づくソース優先度で重複排除。

## 🖥 フロントエンド UI

- **検索フォーム**: 偏差値帯、入試方式、共通テスト利用、学費などの高度なフィルタ。
- **結果カード**: 入試スケジュール、入試方式、科目配点、共テ比率、特記事項、AI要約を表示。
- **チャットドロワー**: ストリーミング応答、Markdown整形、履歴保存、ローディングアニメーション。
- **お気に入り機能**: お気に入り内訳の集計テーブルとカード一覧。

## ⚙️ 環境変数（一例）

フロント (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

バックエンド (`backend/.env`):

```env
HF_API_KEY=your_huggingface_api_key
HF_MODEL_ID=MiniMaxAI/MiniMax-M2:novita
TAVILY_API_KEY=your_tavily_api_key
# または
SERPER_API_KEY=your_serper_api_key
```

## ✅ テストの進め方

- フロント: `bun run lint`, `bun run typecheck`, `bun run test`（任意）を CI に統合。
- バック: FastAPI エンドポイントに対する pytest / httpx ベースの統合テストを推奨。
- Lint/Formatting: ESLint + Prettier + Tailwind プラグインで一貫性を担保。

## 📄 ライセンス

本プロジェクトは MIT License で公開されています。商用・OSS 問わずフォークしてご活用ください。
