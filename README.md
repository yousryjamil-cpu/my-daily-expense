# My Daily Expense

An offline-first Expo React Native Android income/expense tracker with separate SAR and BDT balances, Bengali/English labels, editing and deleting transactions, and monthly totals.

## Run

Install Node.js and npm, then:

```bash
npm install
npx expo start
```

Install **Expo Go** on Android to preview by scanning the QR code (same Wi-Fi, or use `npx expo start --tunnel`).

## Build APK

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

The APK build requires an Expo account and a successful remote build. The resulting build link is provided by EAS.

## Notes

- Transactions are stored only on-device using AsyncStorage. Uninstalling the app or clearing its data may erase them. No cloud backup yet.
- SAR and BDT are tracked independently; there is no exchange-rate conversion.
- This is source code, **not** a built APK. It has not been run on a device in this environment.
