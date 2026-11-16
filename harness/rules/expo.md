## Stack: Expo (React Native)

- Routes are files under `app/` (Expo Router). Prefer Expo SDK modules to community packages, and install with `npx expo install` so versions match the SDK.
- Everything in the JS bundle can be read by anyone who has the app. `EXPO_PUBLIC_` variables are public. Secrets live on a server the app calls.
- Tokens go in `expo-secure-store`, never in AsyncStorage.
- Check every screen on iOS and Android: safe areas, keyboard avoidance, the back gesture and hardware back, large text sizes.
- Long lists use FlatList or FlashList with stable keys, not ScrollView.
- Say which kind of change you made. A new native module, config plugin or permission in `app.json` needs a new build. A JS-only change can ship as an update.
- `eas build`, `eas submit` and `eas update` to a production channel are the user's call.
- Ask for a device permission at the moment it is needed, with a reason, and handle a refusal.
- Test deep links and auth redirects with the real scheme on a device.
