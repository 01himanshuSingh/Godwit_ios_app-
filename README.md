# Godwit Client (iOS)

Expo + TypeScript scaffold for the Godwit luxury travel client app (Phase 1).

## Requirements

- Node.js LTS, npm
- macOS + Xcode for iOS Simulator or device builds (EAS Build for CI)

## Setup

```bash
cp .env.example .env
npm install
```

## Styling (NativeWind / Tailwind)

Utility classes via [`className`](https://www.nativewind.dev/) on React Native components. Theme tokens live in `tailwind.config.js`; global entry is `global.css` (imported in `src/app/_layout.tsx`). After config changes, restart with `npx expo start --clear`.

## Scripts

| Command             | Description        |
| ------------------- | ------------------ |
| `npm start`         | Expo dev server    |
| `npm run ios`       | Open iOS simulator |
| `npm run typecheck` | TypeScript         |
| `npm run lint`      | ESLint             |
| `npm test`          | Jest (jest-expo)   |
| `npm run doctor`    | expo-doctor        |

## Documentation

- `docs/ARCHITECTURE.md` — layers and BFF data flow
- `docs/AUTH.md` — AUTH-1 sign-in methods
- `docs/ROUTES.md` — Phase 1 route table
- `docs/FIREBASE_MAP.md` — modules and collections
- `docs/DEPENDENCIES.md` — installed libraries and compliance notes
- `docs/APP_STORE_CHECKLIST.md` — release checklist

## Temporary test Home

`src/app/index.tsx` is a toolchain smoke screen; replace with the tab shell on Day 2.
