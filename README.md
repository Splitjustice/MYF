# Killzone Edge

Production-oriented cross-platform mobile app (Expo React Native + TypeScript) and Node.js backend for ICT Killzone intraday forex signals.

## 1) Architecture

### Mobile (Expo React Native)
- **UI layer**: Screens + reusable components in `src/screens` and `src/components`.
- **Logic layer**: Hooks/context/services in `src/context`, `src/hooks`, `src/services`.
- **Data layer**: API client in `src/api/client.ts` and secure token storage in `src/services/authStorage.ts`.
- **Navigation**: Auth-gated stack + 5-tab main navigation in `src/navigation/AppNavigator.tsx`.
- **Local persistence**: JWT token persisted using Expo Secure Store.

### Backend (Node + Express)
- **Transport layer**: REST routes in `backend/src/routes`.
- **Domain layer**: Signal engine and data adapters in `backend/src/services`.
- **Security layer**: JWT middleware in `backend/src/middleware/auth.js`.
- **Persistence layer**: JSON file datastore in `backend/src/data/store.json` via `fileDb.js`.
- **Market data source**: Twelve Data API when API key exists; deterministic mock fallback otherwise.

### Signal Engine Workflow
1. Pull M15 + M5 + D1 candles (`marketDataService`).
2. Compute ADR(14).
3. Reject when ADR < admin threshold (default 80 pips).
4. Build Asian range (00:00–05:00 UTC).
5. In London/NY killzone: detect sweep + M5 MSS + FVG + M15 OB overlap.
6. Entry at 50% FVG, SL beyond sweep wick, TP at RR target (default 2.5R).
7. Return LONG/SHORT/NO_TRADE with confidence and reasoning.

## 2) Folder Structure

```text
.
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
├── .env.example
├── src
│   ├── api
│   ├── components
│   ├── context
│   ├── hooks
│   ├── navigation
│   ├── screens
│   ├── services
│   ├── theme
│   ├── types
│   └── utils
├── __tests__
└── backend
    ├── package.json
    ├── src
    │   ├── app.js
    │   ├── server.js
    │   ├── config
    │   ├── data
    │   ├── middleware
    │   ├── routes
    │   ├── services
    │   └── utils
    └── tests
```

## 3) Environment Variables

Copy and set:

```bash
cp .env.example .env
```

- `EXPO_PUBLIC_API_URL` → backend URL for mobile app.
- `JWT_SECRET` → backend signing secret.
- `TWELVE_DATA_API_KEY` → optional, if omitted mock market adapter is used.

## 4) Run Instructions

### Install dependencies
```bash
npm install
cd backend && npm install && cd ..
```

### Start backend
```bash
npm run backend:start
```

### Start mobile app
```bash
npx expo start
```

## 5) Tests

### Frontend unit tests
```bash
npm test
```

### Backend tests
```bash
npm run backend:test
```

## 6) Main Features Included
- Email/password auth + JWT sessions.
- User profile + preferences update.
- Dashboard with session, active signals, ADR proxy, rolling win rate.
- Signals tab with confidence + reasoning and local push alerts.
- Lightweight candlestick chart with entry/SL/TP levels.
- Journal trade capture and expectancy/win-rate metrics.
- Hidden admin panel in Settings for thresholds and strategy toggles.
- Local persistence through secure store (mobile token) + JSON backend datastore.
