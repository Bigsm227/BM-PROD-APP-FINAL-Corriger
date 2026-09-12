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
- [x] Backend: services, portfolio (+detail/CRUD/soft-delete), **beats catalog** (public GET + admin GET/POST/DELETE, 3 seeded), quotes, appointments, JWT login/me, admin stats. Admin + portfolio + beats seeded on startup.
- [x] **Studio pivot (matches user's original Flutter logic)**: Home shows BIG S MEDIA PRODUCTION (Niamey) with 3 action cards + contact links (tel/mail/TikTok/YouTube/Facebook/Instagram).
- [x] **Beats tab**: catalogue d'instrumentales, each "Commander" → WhatsApp (wa.me/22796558193) with pre-filled order message.
- [x] **Studio tab**: réservation (nom + service parmi 4) → WhatsApp reservation message.
- [x] **Paiement modal**: numéro de réception +227 96 55 81 93, sélecteur MyNita/Amanata, "Confirmer le paiement sur WhatsApp".
- [x] **Admin**: 2 onglets (Réalisations + Instrumentales) avec ajout/suppression.
- [x] Dark cinematic theme + custom fonts, toast system, safe-area handling.
- [x] Verified: 25/25 backend tests + 100% frontend flows PASS (iteration_2).

## WhatsApp / Studio constants (src/contact.ts)
- WhatsApp: wa.me/22796558193 · Tél: +227 96 55 81 93 · Email: sanistomoussa@gmail.com
- Socials: TikTok @big.sm.officiel227, YouTube @big_sm_officiel, Facebook/Instagram BM Prod

## Backlog / Remaining
- P1: Lecteur audio (extraits) pour chaque instrumentale.
- P1: Prix des beats + panier.
- P2: Import d'images depuis le téléphone pour les réalisations (Object Storage).
- P2: Historique des commandes côté studio.

## Test Credentials
- Admin: admin@bigsmedia.com / BigS2026!Admin (see /app/memory/test_credentials.md)
