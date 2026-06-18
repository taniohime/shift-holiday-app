FROM node:18-alpine

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci

# React アプリのビルド
COPY . .
RUN npm run build

# サーバーを起動（簡易 HTTP サーバー）
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
