# Reference: Legacy RateTheDogs Repositories

These directories contain the original 2022 RateTheDogs prototypes for reference.

## rate-the-dogs-api

Node.js/Express API from May 2022.

Key files:

- `db-creation.sql` - Original PostgreSQL schema
- `db-setup.ts` - Database seeding script using breed-images.json
- `images-retrieval.ts` - Script that fetches all Dog CEO images
- `breed-images.json` - Pre-fetched 21,025 images (174 breeds, as of 2022)
- `src/` - Express routes and controllers

## rate-the-dogs-client-prototype

Vanilla JavaScript client from January 2022.

Key files:

- `index.html` - Main page
- `js/` - ES6 modules for rating logic
- `css/` - Styling
- `assets/` - SVG logos and background patterns

## Analysis Document

See `docs/old-repos-analysis.md` for a comprehensive analysis of these repos and what features/patterns were extracted for the current implementation.

## Note

These repos are kept for reference only. The current implementation has:

- Modern React + TypeScript + Vite frontend
- Cloudflare Workers + Hono + D1 backend
- Better security (IP hashing, moderation)
- Half-increment ratings (0.5-5.0 vs integer 1-5)
- Image uploads to R2
