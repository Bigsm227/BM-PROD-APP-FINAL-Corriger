# PRD — Big S Media Production (Mobile App)

## Original Problem Statement
Crée une application mobile moderne pour Big S Media Production avec une belle interface d'accueil, des boutons interactifs pour la production audiovisuelle et la numérisation de cassettes.

## User Choices
- Features: services showcase + quote/contact form + portfolio gallery (all)
- Simple appointment booking
- Visual style: dark & cinematic (elegant/premium)
- No brand assets provided (design created from scratch)
- Admin space to manage requests/projects

## Architecture
- Frontend: Expo React Native (expo-router, tabs), React Query, French UI, dark "6 Glass / Luxe DARK" theme (gold #C9A84C on deep black). Fonts: Cormorant Garamond (display) + Geist (text).
- Backend: FastAPI + MongoDB (motor), JWT admin auth (bcrypt/passlib, pyjwt).
- All API routes prefixed `/api`. Images from Unsplash cinematic set.

## Personas
- Prospective client: browses services/portfolio, requests a quote, books an appointment.
- Admin (Big S team): logs in, reviews quotes & appointments, updates statuses, manages portfolio projects.

## Core Requirements (static)
- Cinematic home hero with primary CTAs (devis, rendez-vous).
- Services detail with segmented control (Production / Numérisation).
- Portfolio gallery + project detail.
- Quote form + appointment booking (public, no auth).
- Admin dashboard: stats, quotes, appointments, projects CRUD.

## Implemented (2026-06)
- [x] Backend: services, portfolio (+detail), quotes, appointments, JWT login/me, admin stats/quotes/appointments/portfolio CRUD (soft delete). Admin + 4 projects seeded on startup.
- [x] Home tab (hero, services preview, portfolio carousel, CTA), Services tab, Portfolio tab (grid + detail modal), Devis tab (form + success), Rendez-vous modal (form + success).
- [x] Admin login modal + dashboard (stats, 3 segmented tabs, status toggles, add/delete projects).
- [x] Dark cinematic theme + custom fonts, toast system, safe-area handling.
- [x] Verified: 18/18 backend tests + full frontend flows PASS.

## Backlog / Remaining
- P1: Native date picker for appointments (currently text + time slots).
- P1: Image upload for portfolio (currently image URL) via Object Storage.
- P2: Email notification to admin on new quote/appointment (Resend).
- P2: Testimonials / client logos section on home.

## Test Credentials
- Admin: admin@bigsmedia.com / BigS2026!Admin (see /app/memory/test_credentials.md)
