# Deployment Guide

## 1. Environment variables
Set the following variables:

```env
DATABASE_URL=
ADMIN_PASSWORD=
```

## 2. Install dependencies

```bash
npm install
```

## 3. Generate Prisma client & apply migrations

```bash
npm run prisma:generate
npm run prisma:deploy
```

## 4. Seed sample data

```bash
npm run prisma:seed
```

## 5. Build and run

```bash
npm run build
npm run start
```

## 6. Development

```bash
npm run dev
```
