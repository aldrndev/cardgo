---
description: How to create and use an Expo Development Build
---

# How to Create and Use an Expo Development Build

Development builds allow you to use native libraries (like `expo-local-authentication` or `expo-notifications`) that might not be fully supported in the standard Expo Go app.

## Prerequisites

1.  **EAS CLI**: Ensure you have the EAS CLI installed.
    ```bash
    npm install -g eas-cli
    ```
2.  **Expo Account**: You need an Expo account. Run `eas login` to log in.

## Steps

### 1. Configure EAS

If you haven't already, initialize EAS in your project:

```bash
eas build:configure
```

This will create an `eas.json` file.

### 2. Create a Development Build

You can create a build for Android (APK) or iOS (Simulator).

**For Android (Emulator/Device):**

```bash
eas build --profile development --platform android
```

**For iOS (Simulator):**

```bash
eas build --profile development --platform ios
```

_Note: Building for iOS device requires an Apple Developer Account._

### 3. Install the Build

**Android:**

- Download the `.apk` from the build link provided by EAS.
- Drag and drop it into your emulator, or install it on your device.

**iOS Simulator:**

- EAS will provide a command to install it automatically, or you can download the `.tar.gz`, extract it, and drag the `.app` into the simulator.

### 4. Run the Development Server

Start your development server specifically for the dev build:

```bash
npx expo start --dev-client
```

### 5. Open the App

- Open the "Card Go" app (it will look different from Expo Go) on your device/emulator.
- It should automatically connect to your running bundler.
