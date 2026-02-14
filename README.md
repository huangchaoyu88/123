# 課程預約系統 MVP

技術棧：Next.js App Router + TypeScript + Prisma + PostgreSQL + Tailwind CSS。

## 快速開始

1. 複製環境變數
   ```bash
   cp .env.example .env
   ```
2. 安裝套件
   ```bash
   npm install
   ```
3. 套用 migration
   ```bash
   npm run prisma:deploy
   ```
4. 匯入種子資料
   ```bash
   npm run prisma:seed
   ```
5. 啟動開發
   ```bash
   npm run dev
   ```

## 功能
- `/courses` 課程列表
- `/courses/[id]` 時段瀏覽 + 預約
- `/admin` 管理員登入後管理課程、時段、預約
- 預約與取消皆使用 transaction 更新 `bookedCount`
