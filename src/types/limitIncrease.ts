export interface LimitIncreaseRecord {
  id: string;
  cardId: string;
  requestDate: string; // ISO Date (When user applied)
  actionDate?: string; // ISO Date (When Approved/Rejected)
  amount: number;
  type: "permanent" | "temporary";
  frequency: number; // Months (Perm: 6,9,12; Temp: 1,2,3,6)
  status: "pending" | "approved" | "rejected";
  note?: string;
  createdAt: string;
}
