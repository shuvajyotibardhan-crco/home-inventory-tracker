# Home Inventory Tracker

A premium hybrid-input home asset and inventory management app. Track every item in your home with manual editing or AI-powered document scanning via Gemini.

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- Lucide Icons
- Firebase Auth (Google Sign-In)
- Gemini 2.5 Flash API (AI document scanning)
- localStorage (persistence)

## Setup

1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env` and fill in your Firebase credentials
4. `npm run dev`

## Features

- Google Sign-In
- Manual CRUD — add, edit, delete inventory items
- AI scan — photograph a paper list and auto-parse items via Gemini
- Live search and room filter
- Financial analytics dashboard with per-room value breakdown
- CSV export
- Offline-first localStorage persistence
