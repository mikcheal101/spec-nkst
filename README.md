# NKST Church Management System

Church management system branded for **NKST Church**.

## Structure

- `src/api/` — backend services (auth, api-service, announcement) and infrastructure compose definitions
- `src/web/` — web application
- `src/mobile/` — mobile application (Expo/React Native)

## Local development

- API stack: `docker compose up -d`
- Web: `cd src/web && npm install && npm run dev`
- Mobile: `cd src/mobile && npm install && npm run start`
