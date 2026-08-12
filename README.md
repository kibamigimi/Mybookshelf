# My Bookshelf

読んだ本の表紙を検索し、木製の本棚へ自由に配置できる個人用Webアプリです。読了日をカレンダーで確認し、評価や感想を読書記録として一覧できます。

**公開アプリ:** https://kibamigimi.github.io/Mybookshelf/

## 主な機能

- Google Booksからの書籍検索とopenBDによる日本語書誌・表紙・内容紹介の補完
- Google Booksで取得できない場合のOpen Library検索
- 検索にない本の手動追加と表紙URL指定
- マウス・タッチによる3段本棚への自由配置
- 読了日カレンダー、読書記録一覧
- 読了日、5段階評価、一言感想の保存
- ブラウザ内への自動保存

## ローカルで起動

Node.js 20.19以降を用意し、次を実行します。

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Google Books APIキーは任意です。キーを使用する場合だけ `.env.local` の `VITE_GOOGLE_BOOKS_API_KEY` に設定してください。キーがなくてもGoogle Booksの匿名検索とOpen Libraryへの切り替えが利用できます。

## APIキーの安全な設定

`VITE_` で始まる値はブラウザへ組み込まれるため、公開後の利用者から完全に隠すことはできません。Google Cloud Consoleで必ず次の制限を設定してください。

1. 「APIの制限」を Books API のみにする
2. 「アプリケーションの制限」を「ウェブサイト」にする
3. 利用するURLだけをHTTPリファラーに登録する
4. `.env.local` をGitへ追加しない

GitHub Pagesの標準公開ではAPIキーを組み込まず、匿名検索を使用します。

公開版でGoogle Booksを安定して利用する場合は、リポジトリの **Settings → Secrets and variables → Actions** で `VITE_GOOGLE_BOOKS_API_KEY` というRepository secretを作成してください。Google Cloud ConsoleではBooks APIだけを許可し、HTTPリファラーを `https://kibamigimi.github.io/*` に制限します。ブラウザは外部APIへの通信時にパス部分を省略してオリジンだけを送るため、`/Mybookshelf/*` のようなパス単位の制限では正しく認証できません。GitHub Actionsのビルド時にだけこの値を受け取りますが、ブラウザ用キーは生成後のJavaScriptから確認できるため、Google Cloud側の制限設定が必須です。

## データとプライバシー

本、棚の配置、読了日、評価、感想は利用者自身のブラウザの `localStorage` にのみ保存されます。ログイン、広告、アクセス解析、外部データベースへの読書記録送信はありません。ブラウザのデータを削除すると記録も消え、端末間の同期は行われません。

ヘッダーの設定ボタンから、本棚名の変更とJSONバックアップの書き出し・復元ができます。バックアップには感想を含む読書記録が入るため、第三者へ共有せず安全な場所で保管してください。復元時はファイル内容を検証し、確認操作の後に現在のデータを置き換えます。

書籍検索時は検索語が Google Books または Open Library に送信されます。外部の表紙画像URLを設定した場合、その画像提供元へ画像取得リクエストが送信されますが、参照元情報は送信しない設定です。

Google Booksの検索結果にISBN-13が含まれる場合、そのISBNをopenBDへ送信し、日本語書誌・書影・内容紹介を補完します。openBDに情報がない場合はGoogle Booksの情報をそのまま表示します。

## 公開

`main` ブランチへの更新でGitHub Pages用のワークフローが実行されます。リポジトリの **Settings → Pages → Source** を **GitHub Actions** に設定してください。

## 確認

```bash
pnpm run typecheck
pnpm run build
```

脆弱性の報告方法は [SECURITY.md](SECURITY.md) を参照してください。ライセンスはMITです。
