### Quick Start (for new users)

1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd APPS/MOBILE/SikshaSync
   ```

2. Download the APK (if provided) and install it on your device.

3. Open Command Prompt (cmd) in the same directory as the project (where your `package.json` is).

4. Install dependencies:
   ```sh
   npm install
   ```

5. Run the app:
   ```sh
   npx expo run -c
   ```

This will build and launch the app. Make sure your device/emulator is connected.

# Udbhav Hackathon 2K26

**Team Name:** QUBES  
**Team Code:** UDB-97N6

## Problem Statement
**Hyper Personalized Learning Assistant for Underserved Students**

Build an AI system that adapts to a student's learning style, pace, and knowledge gaps — offering contextual explanations, quizzes, and career guidance for low-resource college students.

# SikshaSync Mobile App

## Overview
SikshaSync is a modern, AI-powered educational mobile app built with React Native and Expo. It provides students with interactive learning tools, including AI chat, PDF summarization, quizzes, and more. The app is designed for both Android and iOS platforms.

## Features
- **AI Tutor Chat:** Chat with an AI tutor for instant help and explanations.
- **PDF Summarization:** Upload PDFs and get concise, student-friendly summaries (requires development build).
- **Quizzes & Modules:** Practice with subject-wise quizzes and learning modules.
- **Offline Support:** Access modules and quizzes even without internet.
- **Google Sign-In & Guest Mode:** Secure authentication with Google or as a guest.
- **Analytics:** Track your learning pace, productivity, and interests.
- **Theming & Localization:** Modern UI with support for multiple languages.

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- Yarn or npm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

### Installation
1. Clone the repository:
   ```sh
   git clone <repo-url>
   cd APPS/MOBILE/SikshaSync
   ```
2. Install dependencies:
   ```sh
   yarn install
   # or
   npm install
   ```


### Running the App (Development Build)

To test all features (including PDF upload and summarization), use a development build:

1. **Install dependencies (if not already done):**
   ```sh
   yarn install
   # or
   npm install
   ```

2. **Build the development client:**
   ```sh
   eas build --profile development --platform android
   # or
   eas build --profile development --platform ios
   ```

3. **Download and install the generated build** on your device or emulator.

4. **Start the Metro bundler in development client mode:**
   ```sh
   expo start --dev-client
   ```

5. **Open the SikshaSync app** on your device/emulator. It will connect to the Metro server and load your JS bundle.

> Now you can test all features, including PDF upload and summarization, which require native modules only available in development builds.

### Running the App (Preview Mode)

If you only need to test basic features (without native modules):

```sh
expo start
```
> Note: PDF summarization only works in development builds due to native module requirements.

## Project Structure
```
APPS/MOBILE/SikshaSync/
├── app.json
├── App.tsx
├── package.json
├── eas.json
├── assets/
├── src/
│   ├── components/
│   ├── data/
│   ├── firebase/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   └── theme/
└── ...
```

## Key Technologies
- **React Native** (with Expo)
- **Firebase** (Auth, Firestore)
- **Google Sign-In**
- **expo-pdf-text-extract** (PDF summarization)
- **i18next** (Localization)
- **React Navigation**

## Environment & Configuration
- Update `app.json` and `google-services.json` for your Firebase project.
- For Google Sign-In, configure your web client ID in `LoginScreen.tsx`.
- EAS project ID is set in `app.json` under `extra.eas.projectId`.

## Known Limitations
- **PDF Summarization:** Only works in development builds (expo-dev-client) due to native module restrictions. Not available in preview/production builds.
- **Native Modules:** Some features require a custom dev client (not available in Expo Go or preview builds).

## Contributing
1. Fork the repo and create your branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -am 'Add new feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Open a pull request

## License
[MIT](../LICENSE)

## Contact
For questions or support, open an issue or contact the maintainer.
