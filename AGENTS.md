# AGENTS.md

Watune（Rails 7.1 / Ruby 3.3）で作業する AI エージェント向けのルールと手順です。

## 基本のルール

- 説明・コードのコメント・コミットメッセージの案は日本語で書く
- コミットはしない。作業が終わったら、変更したファイルの一覧と各変更の理由を短く説明する（人が差分を確認してからコミットする）
- Issue に書かれた範囲だけを変更する。範囲外の問題に気づいたら、変更せずに報告する
- 秘密情報（credentials の中身、.env、鍵、パスワード）を表示・出力・コミットしない

## ブランチと本番の流れ

- 機能のブランチ → develop に PR → develop から main に PR → main が本番（Render）に反映される
- ブランチ名は `Issue番号_内容`（例：`714_restrict-post-visibility`）

## テストと rubocop の実行

Docker のテスト用の環境で実行する。

```bash
docker compose -f compose.test.yml run --rm web bundle exec rubocop
docker compose -f compose.test.yml run --rm web bundle exec rspec
```

- 変更したら、報告の前に rubocop を実行して 0 件にする
- rspec は、まず変更に関係する spec だけを実行する（全体には、#740 で直すまで、もともと失敗しているテストがある）
- compose.dev.yml の web コンテナでは rspec を実行しない（RAILS_ENV が development のため、開発用のデータベースで動いてしまう）
- compose.dev.yml と compose.test.yml を同時に起動しない（サービス名とポートが同じため）
- Docker を使えない環境では、構文チェック（`ruby -c`）だけ行い、rubocop と rspec を実行できなかったことを報告する
- React / TypeScript を変更したら `yarn typecheck` も実行する

## rubocop のルール

- `rubocop:disable` と `.rubocop.yml` の変更はしない
- `[Correctable]` の指摘は `rubocop -a ファイル名` で直してよい（差分を確認する）
- 1行は 130 文字以内、メソッドは 30 行以内、クラスは 150 行以内
  - モデルが長くなったら、役割ごとに `app/models/concerns/posts/` などの concern に切り出す
- `self.user` のような不要な `self.` は付けない
- `category: category` ではなく `category:` と書く

### spec のルール（よく指摘されるもの）

- 1つの `it` は 8 行以内
- 1つの `describe` で使える `let` は 5 つ以下。`let` は、使う `describe` の中に書く（外側の `let` は内側にも数えられる）
- 同じ `describe` に `before` は1つだけ
- クラス名ではなく `described_class` を使う
- `where(id: x).exists?` ではなく `exists?(id: x)` と書く
- 先に作っておきたいデータは `before` で呼ぶ（`let` は呼ばれたときに作られるため、件数のテストが狂う）

## 投稿の公開範囲

- 投稿を見せてよいかは `Post#visible_to?` と `Post.visible_to(viewer)`（`app/models/concerns/posts/visibility.rb`）で判定する
- 投稿の一覧を取得するときは、必ず `visible_to(current_user)` を通す
- 投稿を操作するコントローラーでは `authorize_view!`（`PostViewAuthorization`）を使う
- 公開範囲の条件を変えたら、`visible_to?` とスコープの結果が一致するモデルスペックも直す
