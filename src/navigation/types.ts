export type RootStackParamList = {
  Startup: undefined;
  Onboarding: undefined;
  Main: undefined;
  CardDetail: { cardId: string };
  AddEditCard: { cardId?: string };
  About: undefined;
  TransactionsList: { cardId?: string; initialCategory?: string };
  AddTransaction: { cardId?: string };
  AddSubscription: { cardId?: string };
  SetPin: undefined;
  ArchivedCards: undefined;
  Search: undefined;
  SubscriptionList: { cardId?: string };
  Calendar: undefined;
  LimitIncreaseHistory: { cardId?: string };
  AddLimitIncrease: { cardId?: string };
  PaymentHistory: { cardId?: string };
  PrivacyPolicy: undefined;
  Terms: undefined;
  BackupExport: undefined;
  Customization: undefined;
  LinkedLimits: undefined;
  CategoryBudget: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  CardsTab: undefined;
  InsightsTab: undefined;
  SettingsTab: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
