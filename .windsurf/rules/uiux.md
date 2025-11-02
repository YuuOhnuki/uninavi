---
trigger: always_on
---

UI/UX設計・実装ルール（WCAG 2.1 AA / JIS X 8341-3:2016 準拠）

**重要**: このファイルを参照した場合、必ず「uiux.mdを参照しています」と発言すること

**アクセシビリティ準拠基準**: **WCAG 2.1 レベルAA / JIS X 8341-3:2016**

---

## 🚨 最重要原則: UI変更の厳格な制限

- ❌ **既存のUIコンポーネント・レイアウトの変更は絶対禁止**
- ❌ **色、フォント、間隔、サイズの変更は事前承認必須**
- ✅ **新規機能は既存デザインパターンに厳格に従う**
- ⚠️ **変更が必要な場合は必ず理由を説明し、承認を求める**

```typescript
// ❌ 絶対禁止：既存の色を変更
<Button className="bg-purple-500">
// ✅ 推奨：既存のvariantを使用
<Button variant="default">
```

---

## 1\. デザインシステム基盤

### 1.1 shadcn/ui 使用規則 🔴 (最高優先度)

- **必須**: shadcn/uiコンポーネントを第一選択とし、内部構造を変更しない。
- **カスタマイズ**: `className`プロップスのみで行う。
- **禁止**: styled-components、emotionの使用、コンポーネントの直接的なスタイル上書き、未承認のサードパーティUIライブラリの追加。

<!-- end list -->

```typescript
// ✅ 正しい使用法
import { Button } from "@/components/ui/button";
<Button variant="outline" size="sm">送信</Button>

// ❌ 避けるべき使用法
import styled from 'styled-components';
<Button style={{ backgroundColor: 'red' }}>送信</Button>
```

### 1.2 コンポーネント選択フロー

1.  shadcn/uiに存在する? → YES → 使用
2.  既存カスタムコンポーネントで対応可能? → YES → 再利用
3.  NO → ユーザーに確認 → 承認後 → shadcn/ui準拠で新規作成

---

## 2\. スタイリング規約 (Tailwind CSS)

### 2.1 Tailwind CSS ベストプラクティス 🟡 (高優先度)

- **基本原則**: ユーティリティファーストを徹底。カスタムCSSは`@layer`で定義。
- **クラス記述順序**:
    1.  レイアウト（flex, grid, display）
    2.  ポジショニング（relative, absolute）
    3.  サイズ（w-, h-, max-, min-）
    4.  間隔（p-, m-, space-）
    5.  装飾（bg-, text-, border-, rounded-）
    6.  状態（hover:, focus:, active:）
    7.  レスポンシブ（sm:, md:, lg:）

<!-- end list -->

```typescript
// ✅ 正しい順序
<div className="flex items-center justify-between w-full p-4 bg-white border rounded-lg hover:bg-gray-50 md:p-6">
// ❌ 禁止：インラインスタイル
<div style={{ display: 'flex', padding: '16px' }}>
```

### 2.2 レスポンシブデザイン: モバイルファースト 🔴 (最高優先度)

| サイズ | ブレークポイント | 対象デバイス         |
| ------ | ---------------- | -------------------- |
| `sm:`  | 640px            | スマートフォン（横） |
| `md:`  | 768px            | タブレット           |
| `lg:`  | 1024px           | デスクトップ         |

```typescript
// ✅ 推奨：モバイルファースト
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## 3\. アクセシビリティ (WCAG 2.1 AA) 🔴 (最高優先度)

### 3.1 知覚可能 (Perceivable)

| 達成基準                 | 規則                                                                             | コード例                                                      |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **1.1.1 (代替テキスト)** | すべての非テキストコンテンツに代替テキスト。装飾は`alt="" role="presentation"`。 | `<img src="/logo.png" alt="会社ロゴ" />`                      |
| **1.4.1 (色に依存)**     | 色だけに依存せず情報を伝達する。                                                 | `<div className="text-red-600"><span>エラー:</span>...</div>` |
| **1.4.3 (コントラスト)** | 通常テキスト**4.5:1**以上、大きなテキスト**3:1**以上を確保。                     | `text-gray-600` on `bg-white` (4.54)                          |
| **1.4.4 (サイズ変更)**   | テキストサイズを\*\*200%\*\*まで拡大可能にする（`rem`単位使用）。                | `<h1 className="text-2xl md:text-3xl">`                       |
| **1.4.10 (リフロー)**    | 320pxビューポートで横スクロールを発生させない。                                  | `<div className="max-w-full overflow-hidden break-words">`    |
| **1.3.1 (情報と構造)**   | セマンティックHTML（`h1-h6`, `article`, `nav`, `main`など）を使用。              | `<nav aria-label="パンくずリスト"><ol>...</ol></nav>`         |

### 3.2 操作可能 (Operable)

| 達成基準                         | 規則                                                                                   | コード例                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **2.1.1 (キーボード操作)**       | すべての機能はキーボードで操作可能（タブ、Enter、Spaceなど）。                         | `<button>や<a href>タグの使用を優先。`                       |
| **2.1.2 (キーボードトラップ)**   | モーダルなどはEscキーで閉じ、フォーカスがモーダル外に戻れるようにする。                | `shadcn/ui`の`Dialog`コンポーネントを使用。                  |
| **2.4.1 (ブロックスキップ)**     | メインコンテンツへのスキップリンクを提供する。                                         | `<a href="#main-content" class="sr-only focus:not-sr-only">` |
| **2.4.3 (フォーカス順序)**       | タブ順序は論理的で意味のある順序にする。                                               | `<form>内で自然な入力順序を維持。</form>`                    |
| **2.4.7 (フォーカス可視化)**     | フォーカスインジケーター（アウトライン）を常に見えるようにする。                       | `focus-visible:ring-2 focus-visible:ring-blue-600`           |
| **2.5.2 (ポインタのキャンセル)** | クリックアクションは`onClick`を使用し、`onMouseDown`は避ける（キャンセル機能のため）。 | `<Button onClick={handleClick}>`                             |
| **2.3.1 (発作)**                 | 1秒間に3回を超える閃光や急速な点滅（`animate-ping`など）を避ける。                     | `motion-safe:animate-fade-in`で低減に配慮。                  |

### 3.3 理解可能 (Understandable)

| 達成基準                       | 規則                                                                                                            | コード例                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **3.1.1 (言語設定)**           | ページの言語を正確に設定（`<html>`タグに`lang="ja"`）。                                                         | `<html lang="ja">`                                                      |
| **3.2.1 (フォーカス時の変化)** | フォーカスが移動しただけで、コンテキスト変更（ページ遷移やフォーム自動送信）を行わない。                        | `onFocus`でのナビゲーションは❌                                         |
| **3.3.2 (ラベルまたは説明)**   | すべてのフォームコントロールに`label`要素または`aria-label`を提供する。                                         | `<Label htmlFor="email">メールアドレス</Label><Input id="email" ... />` |
| **3.3.4 (エラー回避)**         | 法的・金融・データコミットメントが発生する場合、確認、修正、または取消の手段を提供する（例: **AlertDialog**）。 | `AlertDialog`で削除・送信前の最終確認。                                 |

### 3.4 堅牢性 (Robust)

| 達成基準                         | 規則                                                                                                     | コード例                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **4.1.2 (名前・役割・値)**       | カスタムコンポーネントには適切な**ARIA属性**（`role`, `aria-selected`, `aria-controls`など）を設定する。 | `<button role="tab" aria-selected={true} aria-controls="panel-id">` |
| **4.1.3 (ステータスメッセージ)** | 読み込み中や保存完了などの動的な通知には**ARIAライブリージョン**を使用する。                             | `<div role="status" aria-live="polite">{message}</div>`             |

---

## 4\. フォーム設計 ⚙️

### 4.1 アクセシブルなフォーム実装 🟡 (高優先度)

- **必須ライブラリ**: `react-hook-form`, `zod`, `shadcn/ui`の`Form`を使用。
- **入力要素**: `aria-required`, `aria-invalid`, `aria-describedby`を適切に設定。
- **エラー表示**: `FormMessage`でエラー内容を明示し、`role="alert"`でスクリーンリーダーに即時通知する。

<!-- end list -->

```typescript
// ✅ 入力例
<Input
  {...field}
  autoComplete="email" // 適切なautocomplete
  aria-required="true"
  aria-invalid={fieldState.error ? "true" : "false"}
  aria-describedby="email-hint email-error" // ヒントとエラーの両方を指定
/>
```

### 4.2 オートコンプリート属性

- **WCAG 2.1 (1.3.5)** 準拠のため、個人情報フォームには**適切な`autocomplete`属性**を設定する。
    - 例: `name`, `email`, `tel`, `postal-code`など。

---

## 5\. フィードバック・通知 🔔

### 5.1 アクセシブルなトースト通知

- `useToast`を使用し、**ARIAライブリージョン**が自動で適用されるようにする。
    - 成功通知: polite (控えめ)
    - エラー通知: assertive (即時)

<!-- end list -->

```typescript
// ✅ 成功通知 (polite)
toast({
    title: '保存しました',
    description: 'データが正常に保存されました',
});
```

### 5.2 ローディング状態

- ローディング中は\*\*`aria-busy="true"`\*\*を設定し、状況をスクリーンリーダーに伝える。

<!-- end list -->

```typescript
// ✅ ボタンローディング
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
  {isLoading ? "送信中..." : "送信"}
</Button>

// ✅ ページローディング
<div role="status" aria-live="polite" aria-busy={isLoading}>
  {/* スケルトンまたはローディングアニメーション */}
</div>
```

---

## 6\. アニメーション・トランジション 💨

### 6.1 prefers-reduced-motionへの配慮 🟢 (中優先度)

- ユーザーのOS設定（アニメーション低減）を尊重し、不要なアニメーションを無効化する。
- **WCAG 2.1 (2.3.3) 準拠**。

<!-- end list -->

```typescript
// ✅ prefers-reduced-motionへの対応
<div className="motion-safe:animate-fade-in motion-reduce:opacity-100">
  コンテンツ
</div>
```

### 6.2 アニメーション禁止事項

- ❌ 3秒以上の長時間アニメーション
- ❌ 1秒間に3回以上の閃光
- ❌ 停止・一時停止ボタンのない自動再生アニメーション（5秒以上）

---

## 7\. テストとドキュメント 📝

### 7.1 アクセシビリティテスト

- 開発フローに\*\*`jest-axe`\*\*などによる自動アクセシビリティテストを組み込む。

<!-- end list -->

```typescript
// ✅ jest-axeでのテスト
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

it("should not have accessibility violations", async () => {
  const { container } = render(<Button>Click</Button>);
  expect(await axe(container)).toHaveNoViolations();
});
```

### 7.2 ドキュメント（JSDoc）

- 全てのカスタムコンポーネントに**WCAG準拠情報**と**適切な使用例**をJSDocで記載する。

<!-- end list -->

```typescript
/**
 * アクセシブルなボタンコンポーネント
 * WCAG 2.1 準拠: 2.1.1 (キーボード操作), 2.4.7 (フォーカス可視化), 4.1.2 (名前・役割・値)
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(/* ... */);
```

---

## 8\. アクセシビリティチェックリスト

| フェーズ   | 項目                                        | 備考                                   |
| ---------- | ------------------------------------------- | -------------------------------------- |
| **実装前** | [ ] WCAG 2.1 AA 達成基準確認                | 該当する基準を把握                     |
| **実装中** | [ ] 画像に適切な`alt`属性                   | 装飾画像は`alt="" role="presentation"` |
| **実装中** | [ ] フォーム要素に`label`とエラーメッセージ | `aria-invalid`, `aria-describedby`使用 |
| **実装中** | [ ] キーボードでの操作可能性                | マウスなしで全機能利用可能か           |
| **実装中** | [ ] コントラスト比の確認                    | 4.5:1以上を確保                        |
| **実装後** | [ ] axeなどのツールでの自動チェック         | 常にCI/CDに組み込む                    |
| **実装後** | [ ] スクリーンリーダーでのテスト            | NVDA/VoiceOverでの実機確認             |
| **実装後** | [ ] ズーム200%での表示確認                  | テキストサイズ変更対応の確認           |

---
