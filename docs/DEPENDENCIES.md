# Dependencies

Resolved versions from `npm ls --depth=0` at scaffold time. Expo SDK **57.0.26**.

| Package                                   | Version         | Purpose                               | Module(s)           | Apple / compliance note                                     |
| ----------------------------------------- | --------------- | ------------------------------------- | ------------------- | ----------------------------------------------------------- |
| expo                                      | 57.0.26         | Expo SDK runtime                      | All                 | App Store via EAS; no private API                           |
| babel-preset-expo                         | 57.0.13         | Babel preset for Metro                | Build               | Required for bundling; blank template did not hoist it      |
| @react-native-firebase/app                | 26.4.0          | Firebase core (native)                | Auth                | Requires `GoogleService-Info.plist`; dev client / EAS build |
| @react-native-firebase/auth               | 26.4.0          | Firebase Authentication               | `src/auth`          | Not available in Expo Go                                    |
| @react-native-firebase/functions          | 26.4.0          | Callable Cloud Functions              | Optional            | Client SDK; Godwit BFF may still be preferred for `/v1`     |
| nativewind                                | 4.2.7           | Tailwind `className` for React Native | `src/ui`, screens   | Compile-time styles; Expo SDK 57 supported                  |
| tailwindcss                               | 3.4.19          | Tailwind compiler (dev)               | Build               | Used by NativeWind; not web CSS in bundle                   |
| react                                     | 19.2.3          | UI runtime                            | All                 | —                                                           |
| react-dom                                 | 19.2.3          | Peer for Expo Router web tooling      | —                   | Not shipped (iOS-only config)                               |
| react-native                              | 0.86.3          | Native renderer                       | All                 | New Architecture compatible                                 |
| typescript                                | 6.0.3           | Type checking                         | All                 | strict                                                      |
| expo-router                               | 57.0.24         | File-based navigation                 | `src/app`           | Typed routes experiment enabled                             |
| react-native-safe-area-context            | 5.7.0           | Safe areas                            | Shell, screens      | —                                                           |
| react-native-screens                      | 4.26.2          | Native stack                          | Navigation          | —                                                           |
| expo-linking                              | 57.0.11         | Deep links                            | `src/navigation`    | Custom scheme `godwit`                                      |
| expo-constants                            | 57.0.20         | App metadata                          | Config, test Home   | —                                                           |
| expo-status-bar                           | 57.0.1          | Status bar                            | Root layout         | —                                                           |
| expo-splash-screen                        | 57.0.9          | Launch splash                         | Native shell        | —                                                           |
| expo-font                                 | 57.0.4          | Custom fonts                          | `assets/fonts`      | —                                                           |
| expo-image                                | 57.0.5          | Optimized images                      | UI                  | —                                                           |
| expo-dev-client                           | 57.0.19         | Custom dev client                     | Development         | Not for App Store production UX                             |
| expo-build-properties                     | 57.0.22         | Native build flags                    | EAS                 | —                                                           |
| react-native-gesture-handler              | 2.32.0          | Gestures                              | UI, sheets          | —                                                           |
| react-native-reanimated                   | 4.5.1           | Animations                            | UI                  | Worklets peer installed                                     |
| react-native-worklets                     | 0.10.1          | Reanimated peer                       | UI                  | Required by expo-doctor                                     |
| react-native-svg                          | 15.15.4         | SVG                                   | UI icons            | —                                                           |
| @shopify/flash-list                       | 2.0.2           | Performant lists                      | Feature lists       | MIT                                                         |
| @gorhom/bottom-sheet                      | 5.2.14          | Bottom sheets                         | Modals              | MIT                                                         |
| @react-native-community/datetimepicker    | 9.1.0           | Date/time pickers                     | Forms               | —                                                           |
| @expo/vector-icons                        | 15.1.1          | Icon font                             | UI                  | Bundled glyphs only                                         |
| expo-symbols                              | 57.0.3          | SF Symbols                            | UI                  | iOS system symbols                                          |
| expo-haptics                              | 57.0.3          | Haptic feedback                       | UI                  | —                                                           |
| expo-secure-store                         | 57.0.4          | Keychain storage                      | Auth tokens         | Keychain-backed; no AsyncStorage for secrets                |
| expo-apple-authentication                 | 57.0.2          | Sign in with Apple                    | Auth                | Required with Google (4.8)                                  |
| @react-native-google-signin/google-signin | 16.1.5          | Google sign-in                        | Auth                | Plugin registered Day 3                                     |
| expo-crypto                               | 57.0.3          | Cryptographic helpers                 | Auth, security      | —                                                           |
| expo-device                               | 57.0.2          | Device metadata                       | Notifications       | No tracking SDK                                             |
| expo-application                          | 57.0.3          | App metadata                          | Diagnostics         | —                                                           |
| expo-notifications                        | 57.0.21         | APNs token registration               | Notifications       | Apple push only; no third-party push SDK                    |
| expo-image-picker                         | 57.0.20         | Photo/camera picker                   | Messages, documents | Usage strings in Info.plist                                 |
| expo-document-picker                      | 57.0.3          | Document picker                       | Documents           | —                                                           |
| expo-file-system                          | 57.0.7          | File I/O                              | Uploads             | —                                                           |
| expo-sharing                              | 57.0.22         | Share sheet                           | Documents           | —                                                           |
| expo-web-browser                          | 57.0.3          | In-app browser                        | Legal links         | SFSafariViewController pattern                              |
| react-native-webview                      | 13.16.1         | Embedded web content                  | Rare flows          | Review content if used                                      |
| @react-native-community/netinfo           | 12.0.1          | Connectivity                          | API client          | —                                                           |
| @tanstack/react-query                     | 5.104.1         | Server state                          | All features        | MIT                                                         |
| zod                                       | 4.6.5           | Runtime validation                    | API contracts, env  | MIT                                                         |
| react-hook-form                           | 7.89.0          | Forms                                 | Auth, requests      | MIT                                                         |
| @hookform/resolvers                       | 5.9.1           | Zod + RHF                             | Forms               | MIT                                                         |
| date-fns                                  | 4.4.0           | Date formatting                       | UI                  | MIT; no moment                                              |
| @sentry/react-native                      | 7.11.0          | Crash reporting                       | Monitoring          | Initialise when DSN exists; plugin Day 3                    |
| jest / jest-expo                          | 29.7.0 / 57.0.5 | Unit tests                            | `tests/`            | Dev only                                                    |
| eslint / eslint-config-expo               | 9.39.5 / 57.0.2 | Lint                                  | CI                  | Dev only                                                    |
| prettier / eslint-config-prettier         | 3.9.9 / 10.1.8  | Format                                | CI                  | Dev only                                                    |
| @tanstack/eslint-plugin-query             | 5.104.1         | Query lint rules                      | CI                  | Dev only                                                    |
| @testing-library/react-native             | 13.3.3          | Component tests                       | Tests               | Dev only                                                    |
| husky / lint-staged                       | 9.1.7 / 16.4.0  | Pre-commit                            | Git hooks           | Dev only                                                    |

**Forbidden (not installed):** `firebase` (JS web SDK), `axios`, `moment`, `redux`, `@reduxjs/toolkit`, `@react-native-async-storage/async-storage`, `expo-permissions`.
