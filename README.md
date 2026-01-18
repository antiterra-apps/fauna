# Fauna

A commercial-first frontend for browsing and accessing premium fauna assets.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **One App Architecture**: Marketing pages and logged-in app share the same UI shell
- **Palette System**: Global color palette shifts on collection hover
- **Pro Gating**: Most assets are Pro-locked with clear upgrade paths
- **Editorial Design**: Minimalistic UI with thin dividers, strong typography, and whitespace
- **Mock Auth**: Lightweight authentication with localStorage persistence
- **Search & Filters**: Browse by collection or concept type, filter by availability

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── hooks/           # Custom React hooks
└── lib/             # Utilities, types, mock data, API stubs
```

## Routes

- `/` - Primary browse + marketing surface
- `/collections` - Explicit browse view
- `/asset/[id]` - Asset detail page
- `/pricing` - Get Pro page
- `/login` - Login page (mock)
- `/app` - Gated account page
- `/app/downloads` - Gated downloads page

## Notes

- Backend services (image generation, LoRA training) are stubbed and will be connected via APIs later
- Auth is mocked using localStorage
- All data is mock data for development
