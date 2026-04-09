# 1. アプリ全体構成の概要

本アプリは、`React Native + Expo` をフロントエンド、`Supabase` をバックエンドとして構成するスマートフォン専用のシフト管理アプリです。認証後にユーザーの `role` を読み取り、管理者には「ダッシュボード / シフト / 従業員 / チャット / 設定」、従業員には「ホーム / シフト / チャット / お知らせ / 設定」のタブを表示します。

MVPでは以下の原則で構成します。

- 片手操作しやすい下部タブ中心の情報設計
- 一覧画面はカード主体、編集は別画面やモーダルに分離
- 認証、プロフィール、シフト、メッセージを責務分離
- 権限制御は必ず Supabase RLS で実施
- Realtime は `messages` を起点に段階的に導入

# 2. 採用技術の理由

- `React Native + Expo`
  スマホ前提UIを iOS / Android 双方で素早く構築しやすく、SafeArea やネイティブ挙動にも対応しやすいためです。
- `TypeScript`
  管理者・従業員で見える機能が分かれるため、型安全にロール別制御を実装しやすくします。
- `Supabase`
  Auth / PostgreSQL / Realtime / RLS を一体で扱え、MVPを短期間で構築しやすいためです。
- `React Navigation`
  下部タブと詳細画面スタックを自然に組み合わせられ、スマホ導線に向いています。
- `Zustand`
  Context よりボイラープレートが少なく、認証や軽量なグローバル状態をシンプルに保てます。
- `dayjs`
  シフト日付や時刻の整形、当日判定、次回勤務判定を簡潔に書けます。
- `react-native-calendars`
  月表示カレンダーが扱いやすく、シフト日マーキングとの相性がよいためです。
- `React Query`
  一覧取得、再取得、ローディング制御を整理しやすく、Realtime とも併用しやすいためです。

# 3. フォルダ構成

```text
shift/
├─ App.tsx
├─ app.json
├─ package.json
├─ .env.example
├─ docs/
│  └─ architecture.md
├─ supabase/
│  └─ schema.sql
└─ src/
   ├─ components/
   ├─ hooks/
   ├─ lib/
   ├─ navigation/
   ├─ screens/
   │  ├─ admin/
   │  ├─ auth/
   │  ├─ common/
   │  └─ employee/
   ├─ store/
   ├─ theme/
   └─ types/
```

# 4. 画面一覧

## 共通

- スプラッシュ画面
- ログイン画面
- 設定画面
- エラー表示バナー / ローディング表示

## 管理者

- ダッシュボード画面
- 従業員一覧画面
- 従業員追加画面
- 従業員編集画面
- シフトカレンダー画面
- 日別シフト一覧画面
- シフト追加 / 編集画面
- 全体チャット画面
- 個人チャット一覧画面
- 個人チャット詳細画面

## 従業員

- ホーム画面
- マイシフトカレンダー画面
- シフト詳細画面
- 管理者チャット画面
- 全体連絡画面
- 設定画面

# 5. 画面遷移設計

## 未ログイン

- スプラッシュ
- ログイン
- パスワード再設定

## 管理者

- タブ: ホーム / シフト / 従業員 / チャット / 設定
- `シフトタブ`
  月表示カレンダー → 日別シフト一覧 → シフト追加 / 編集
- `従業員タブ`
  従業員一覧 → 従業員詳細 / 編集
- `チャットタブ`
  全体チャット / 個人チャット一覧 → 個人チャット詳細

## 従業員

- タブ: ホーム / シフト / チャット / お知らせ / 設定
- `ホーム`
  今日の勤務 / 次回勤務 → シフト詳細
- `シフト`
  月表示カレンダー → 日別シフト詳細
- `チャット`
  管理者チャット詳細
- `お知らせ`
  全体連絡一覧 → お知らせ詳細

# 6. データベース設計

## profiles

- `id`
  `auth.users.id` と連携する主キー
- `role`
  `admin` / `employee`
- `name`
  表示名
- `employee_code`
  ログインID用途にも拡張可能
- `phone`
  連絡先
- `department`
  所属
- `status`
  在籍状態
- `created_at`, `updated_at`

## shifts

- `employee_id`
  対象従業員
- `shift_date`
  勤務日
- `start_time`, `end_time`
  勤務時間
- `shift_type`
  通常勤務 / 早番 / 遅番など
- `note`
  備考
- `created_by`
  登録管理者

## chat_rooms

- `room_type`
  `global` または `direct`

## direct_room_members

- `room_id`
  個人チャットのルーム
- `user_id`
  参加ユーザー

## messages

- `room_id`
  所属ルーム
- `sender_id`
  送信者
- `content`
  本文
- `created_at`
  送信日時
- `read_flag`
  簡易既読フラグ

# 7. Supabaseテーブル作成SQL

実装済みSQLは [schema.sql](/c:/Users/longx/shift/supabase/schema.sql) にまとめています。内容は以下を含みます。

- Enum 作成
- 5テーブル作成
- 更新日時トリガー
- シフト重複防止トリガー
- グローバルチャット初期作成
- Realtime 対象 publication

# 8. RLSポリシー設計

- `profiles`
  管理者は全件参照・更新・削除可能、従業員は自分のみ参照・更新可能
- `shifts`
  管理者のみ作成・更新・削除可能、従業員は自分のシフトのみ参照可能
- `chat_rooms`
  `global` は全ログインユーザー参照可能、`direct` は参加者と管理者のみ参照可能
- `direct_room_members`
  管理者が作成・管理、参加者は自分の所属確認のみ可能
- `messages`
  アクセス可能ルームに属するメッセージのみ参照可能、送信者本人のみ送信者ID一致で投稿可能

補助関数:

- `is_admin(uuid)`
- `user_can_access_room(uuid, uuid)`

# 9. 状態管理設計

MVPでは Zustand と React Query を併用します。

- `authStore`
  セッション、プロフィール、起動中状態
- `React Query`
  シフト一覧、従業員一覧、チャット一覧、メッセージ一覧
- ローカル state
  フォーム入力、モーダル開閉、選択日付

責務:

- 認証状態はグローバル
- サーバーデータは React Query
- 一時UI状態は各画面ローカル

# 10. コンポーネント設計

実装済みまたは土台を作成済みの再利用コンポーネント:

- `Header`
- `PrimaryButton`
- `FormInput`
- `EmployeeCard`
- `ShiftCard`
- `CalendarView`
- `MessageBubble`
- `ChatInput`
- `LoadingOverlay`
- `EmptyState`
- `ErrorBanner`

今後追加推奨:

- `ConfirmDialog`
- `DatePicker`
- `TimePicker`
- `BottomTabBar` のカスタム化

# 11. 開発手順

1. `.env.example` を `.env` にコピーして Supabase の URL / Anon Key を設定する
2. Supabase プロジェクトを作成し、[schema.sql](/c:/Users/longx/shift/supabase/schema.sql) を実行する
3. `profiles` に初期管理者ユーザーを紐づける
4. `npm install`
5. `npm run start`
6. Expo Go または Simulator で起動確認する
7. 画面土台をもとに API フック、詳細画面、作成更新フォームを追加する
8. `messages` テーブルを Realtime 購読し、全体チャット / 個人チャットに反映する

# 12. 今後の拡張案

- Expo Push Notifications による新着通知
- 従業員招待フローの自動化
- ログインID + パスワード運用のための employee_code ベース認証補助
- 既読管理を `message_reads` テーブルへ分離
- シフト希望提出、承認フロー、休暇申請
- 添付ファイル付きチャット
- 店舗 / 拠点の複数管理
- 監査ログと操作履歴
