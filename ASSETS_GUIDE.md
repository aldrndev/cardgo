# Card Go - Assets & Design Guide

## 📁 Assets yang Sudah Di-Copy ke `/assets`

### App Icons & Splash

1. **`splash-new.png`** - New splash screen dengan ilustrasi credit cards

   - Gradient teal → blue background
   - Floating credit cards illustration
   - Use in `app.json`: `"splash": { "image": "./assets/splash-new.png" }`

2. **`icon-new.png`** - New app icon
   - Simple credit card symbol
   - Teal color (#00A896)
   - Use in `app.json`: `"icon": "./assets/icon-new.png"`

### Onboarding Illustrations

3. **`onboarding-hero.png`** - Credit cards illustration

   - For welcome/hero screen
   - Floating cards with shadows
   - 400x300px

4. **`onboarding-shield.png`** - Security/privacy icon
   - Shield with gradient (teal → green)
   - For privacy promise screen
   - 200x200px

### Existing Assets (Already in folder)

- `onboarding_celebrate.png` - Celebration for final step ✅
- `onboarding_feature_tracking.png` - Card tracking icon ✅
- `onboarding_feature_reminder.png` - Calendar reminder icon ✅
- `onboarding_feature_insights.png` - Analytics chart icon ✅
- `privacy_badge.png` - Privacy seal/badge ✅
- `empty_state_cards.png` - Empty state illustration ✅

---

## 🎨 Mockups (Reference Only - in artifacts folder)

Located in: `/Users/aldrnmrsd/.gemini/antigravity/brain/a971981c-0aff-476b-b80b-6580b633b90c/`

1. `onboarding_welcome_mockup_*.png` - Welcome screen design
2. `onboarding_privacy_mockup_*.png` - Privacy screen design
3. `onboarding_nickname_mockup_*.png` - Nickname input design

These are **UI mockups** for reference. Don't import in code, just use as design guide.

---

## 🔧 How to Use in Code

### Update app.json (Splash & Icon)

```json
{
  "expo": {
    "icon": "./assets/icon-new.png",
    "splash": {
      "image": "./assets/splash-new.png",
      "resizeMode": "contain",
      "backgroundColor": "#00A896"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon-new.png",
        "backgroundColor": "#00A896"
      }
    }
  }
}
```

### Import in OnboardingScreen.tsx

```typescript
// Hero illustration
const HeroImage = require("../assets/onboarding-hero.png");

// Privacy shield
const ShieldImage = require("../assets/onboarding-shield.png");

// Feature icons
const TrackingIcon = require("../assets/onboarding_feature_tracking.png");
const ReminderIcon = require("../assets/onboarding_feature_reminder.png");
const InsightsIcon = require("../assets/onboarding_feature_insights.png");

// Celebration
const CelebrateIcon = require("../assets/onboarding_celebrate.png");

// Usage in component
<Image source={HeroImage} style={styles.heroImage} />;
```

---

## 📐 Image Specifications

| Asset                    | Size      | Format | Usage          |
| ------------------------ | --------- | ------ | -------------- |
| splash-new.png           | 1080x1920 | PNG    | Splash screen  |
| icon-new.png             | 1024x1024 | PNG    | App icon       |
| onboarding-hero.png      | 400x300   | PNG    | Welcome screen |
| onboarding-shield.png    | 200x200   | PNG    | Privacy screen |
| onboarding_celebrate.png | 200x200   | PNG    | Final step     |
| feature icons            | 120x120   | PNG    | Feature cards  |

---

## 🎨 Color Palette

```
Primary Teal: #00A896
Primary Dark: #008C7D
Primary Light: #E0F7FA

Accent Blue: #3B82F6
Success Green: #10B981
Warning Orange: #F59E0B
Danger Red: #EF4444

Background: #F5F7FA
Surface: #FFFFFF
Border: #E5E7EB

Text Primary: #111827
Text Secondary: #4B5563
Text Tertiary: #9CA3AF
```

---

## ✅ Next Steps

1. **Update app.json** dengan splash & icon baru
2. **Implement enhanced OnboardingScreen** menggunakan assets ini
3. **Test di development build**: `npx expo start --clear`
4. **Regenerate native**: `npx expo prebuild --clean` (if needed)

---

## 📝 Notes

- All images are optimized for mobile (reasonable file sizes)
- PNG format with transparency where applicable
- Designed for both light mode (dark mode variants can be added later)
- Follow Material Design 3 spacing & sizing guidelines
