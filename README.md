# 🎻 シフト休日希望管理 Web アプリ

モダンな Web アプリで、オーケストラの 1st Violin セクションの休日希望を効率的に管理します。

## 特徴

✅ **モバイル対応** - スマートフォンからも使いやすい  
✅ **リアルタイム管理** - 提出順位が自動更新  
✅ **公平な承認プロセス** - ランキングで全員が順位を確認可能  
✅ **ドイツ語 UI** - 完全ドイツ語対応  
✅ **Google Cloud 最適化** - Firestore + Cloud Run でスケーラブル  

## 技術スタック

| レイヤー | 選択肢 |
|---------|--------|
| **Frontend** | React 18 + Tailwind CSS |
| **Backend** | Firebase (Firestore + Auth) |
| **Hosting** | Google Cloud Run |
| **DB** | Firestore |
| **言語** | ドイツ語 |

## クイックスタート

### ローカルでの開発

```bash
# リポジトリをクローン
git clone https://github.com/your-repo/shift-holiday-app.git
cd shift-holiday-app

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env
# .env を編集して Firebase 認証情報を入力

# 開発サーバーを起動
npm start
```

ブラウザで http://localhost:3000 を開きます。

## デプロイメント

詳細は **[DEPLOYMENT.md](./DEPLOYMENT.md)** を参照してください。

```bash
gcloud builds submit --tag gcr.io/PROJECT-ID/shift-holiday-app
gcloud run deploy shift-holiday-app --image gcr.io/PROJECT-ID/shift-holiday-app
```

## ファイル構成

```
shift-holiday-app/
├── public/index.html
├── src/
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── EmployeeView.jsx
│   │   ├── AdminPanel.jsx
│   │   └── Calendar.jsx
│   ├── firebase.js
│   ├── App.jsx
│   └── index.css
└── Dockerfile
```
