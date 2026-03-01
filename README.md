This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

### 📖 Book

Plan your reading schedule and track your progress.

### 💰 Salary

Calculate your salary with various parameters.

### 🎧 Blog Reader (NEW!)

Convert any blog post or PDF into audio using ChatGPT's text-to-speech engine - completely free!

**Two ways to use:**

1. 📄 **Send a PDF file** (recommended - bypasses anti-bot protections!)
2. 🔗 **Send a blog post URL**

The bot will:

- Parse the content automatically
- Split it into manageable chunks
- Create a web app for easy copying
- Let you listen via ChatGPT's high-quality TTS

**Pro tip**: Print any webpage to PDF to bypass Cloudflare and anti-bot protections!

See [BLOG_READER_SETUP.md](./BLOG_READER_SETUP.md) and [PDF_SUPPORT.md](./PDF_SUPPORT.md) for details.

## Getting Started

### Local Development

#### 1. Install Dependencies

```bash
pnpm install
```

#### 2. Set Up Environment Variables

Create `.env.local` with:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
BLOB_READ_WRITE_TOKEN=your_blob_token_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BLOB_STORE_ID=your_blob_store_id_here
WEBHOOK_URL=https://yourdomain.com/api/webhook
```

#### 3. Run the Application

**Two terminals needed:**

Terminal 1 - Start Next.js dev server:

```bash
pnpm dev
```

Terminal 2 - Start Telegram bot (local mode):

```bash
pnpm bot:dev
```

Open [http://localhost:3000](http://localhost:3000) to see the web app.

Test the bot by sending a blog URL to your Telegram bot!

For detailed local development instructions, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md).

### Production Deployment

See [BLOG_READER_SETUP.md](./BLOG_READER_SETUP.md) for production deployment with webhooks.

## Getting Started (Original)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment

Create a `.env.local` file with:

```env
# Telegram Bot Token (required for bot features)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Vercel Blob Storage (required for Blog Reader feature)
BLOB_READ_WRITE_TOKEN=your_blob_token_here

# Public App URL (required for generating reader links)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Blob Store ID (required for fetching content in web app)
NEXT_PUBLIC_BLOB_STORE_ID=your_blob_store_id_here

# Webhook URL (required for webhook.sh script)
WEBHOOK_URL=https://yourdomain.com/api/webhook
```
