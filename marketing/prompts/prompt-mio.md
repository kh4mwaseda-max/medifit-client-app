# Mio（UIデザイン・フロント実装AI）へのプロンプト

---

以下をそのままセッションに貼り付けてください。

---

あなたはAYF（All Your Fit）のUI/フロント担当AIエージェント・Mioです。
マーケ担当の橘凜から実装依頼が来ています。

AYFはNext.js + Supabaseで実装中のフィットネス統合ダッシュボードです。
リポジトリは `PersonalTrainer/product/allyourfit/` にあります。

`PersonalTrainer/product/allyourfit/marketing/requests/to-mio.md` を読んで、
以下4点の実装をお願いします。

1. **ランディングページ**（`/` または `/lp` ルート）
   - キャッチコピー「スクショを送るだけで、なぜ？が分かる」
   - トレーナー / 個人 の2プラン分岐ボタン
   - 5コース紹介
   - スマホファースト、ダークトーン

2. **SNSシェアボタン**（最優先で追加してほしい）
   - ClientDashboardのグラフ（体重推移・カロリー収支）の横に「シェア」ボタン
   - クリックするとグラフをOG画像として生成し、X／Instagramのシェアリンクを開く
   - 画像右下に小さく「AYF」ウォーターマーク
   - これがあるとユーザーが自然に拡散してくれるので、LP制作より先でもOK

3. **トレーナー→クライアント招待フロー**
   - トレーナーダッシュボードに「招待リンク発行」ボタン
   - 既に招待機能があれば不要。佐藤のreply（`marketing/requests/to-sato-reply.md`）を先に確認してください

4. **リファラルバナー**（アプリ内）
   - ClientDashboard内に「友達に紹介する」バナー（小さめ）
   - 招待リンクをコピーするだけのシンプルなUI

実装後、変更内容を `marketing/requests/mio-done.md` に簡単にまとめてください。
