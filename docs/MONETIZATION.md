# Card Go - Monetization Integration

## Overview

Skeleton code untuk AdMob dan Google Play Billing. Semua **disabled by default** - flip flags untuk enable saat produksi.

## File Structure

```
src/
├── config/
│   └── monetization.ts    # Toggle flags, Ad IDs, SKUs
├── services/
│   ├── AdMobService.ts    # Banner, Interstitial, Rewarded
│   └── BillingService.ts  # Purchase, Restore, Products
├── components/
│   └── AdBanner.tsx       # Banner wrapper (free tier)
└── context/
    └── PremiumContext.tsx # purchasePremium(), restorePurchases()
```

## Configuration

```typescript
// src/config/monetization.ts
ENABLE_ADS: false,      // Set true saat AdMob approved
ENABLE_BILLING: false,  // Set true saat app produksi
```

## Cara Enable (Production Ready)

### 1. Install Dependencies

```bash
npm install react-native-google-mobile-ads
npm install react-native-iap
```

### 2. Update Config

```typescript
// src/config/monetization.ts
ENABLE_ADS: true,
ENABLE_BILLING: true,
PROD_BANNER_ID: 'ca-app-pub-XXXXX/XXXXX',      // Ganti dengan ID asli
PROD_INTERSTITIAL_ID: 'ca-app-pub-XXXXX/XXXXX',
```

### 3. Enable SDK Code

Cari `// TODO: Uncomment` di service files dan uncomment kode SDK.

### 4. Setup Play Console

- Buat in-app products dengan SKU:
  - `premium_monthly`
  - `premium_yearly`
  - `premium_lifetime`

## Usage

### Check Premium Status

```typescript
import { usePremium } from "./context/PremiumContext";

const { isPremium, canExport } = usePremium();
```

### Purchase Premium

```typescript
const { purchasePremium } = usePremium();

const result = await purchasePremium("premium_monthly");
if (result.success) {
  // Handle success
}
```

### Restore Purchases

```typescript
const { restorePurchases } = usePremium();

const result = await restorePurchases();
```

### Show Banner Ad (Free Tier)

```tsx
import { AdBanner } from "./components/AdBanner";

// Only shows for non-premium users when ENABLE_ADS = true
<AdBanner />;
```

## Notes

- ✅ Build aman dengan flags `false` - tidak ada error
- ✅ Onboarding restore backup tetap gratis
- ✅ Premium status tersimpan lokal dan ikut backup/restore
