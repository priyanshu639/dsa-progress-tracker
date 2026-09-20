# DSA Progress Tracker

A full-stack Next.js + Supabase app for tracking DSA problem progress.

## Features
- Email/password authentication
- Problem sheet with LeetCode/GFG links
- Search/filter by topic, difficulty, platform and pattern
- Mark solved/unsolved
- Daily, 7-day and monthly counters
- 30-day activity chart
- Difficulty chart and topic analytics
- CSV import for your 240+ problem sheet
- PostgreSQL + Row Level Security so each user's progress is private

## 1. Install

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 2. Create Supabase project

Create a project in Supabase, then open SQL Editor and run `supabase/schema.sql`.

Copy the Project URL and Publishable Key from Supabase Project Settings/API.

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Restart `npm run dev`.

## 3. Import your sheet

Open `/import` after login and upload a CSV matching:

```csv
position,title,platform,difficulty,topic,pattern,problem_url,editorial_url
```

`problems.sample.csv` is a starter dataset. Replace/extend it with your curated 240+ list.

## 4. Deploy

Recommended: Vercel + Supabase.

Push this folder to GitHub, import the repository into Vercel, add the two environment variables, and deploy.

## Important data-model idea

`problems` is the master question bank. `progress` stores each user's personal state for each problem. This means you can add thousands of problems without duplicating the question metadata per user.
