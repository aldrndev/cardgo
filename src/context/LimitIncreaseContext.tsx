import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { LimitIncreaseRecord } from "../types/limitIncrease";
import { storage } from "../utils/storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

interface LimitIncreaseContextType {
  records: LimitIncreaseRecord[];
  isLoading: boolean;
  addRecord: (
    data: Omit<LimitIncreaseRecord, "id" | "createdAt">
  ) => Promise<void>;
  updateRecord: (
    id: string,
    data: Partial<LimitIncreaseRecord>
  ) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  getRecordsByCardId: (cardId: string) => LimitIncreaseRecord[];
}

const LimitIncreaseContext = createContext<
  LimitIncreaseContextType | undefined
>(undefined);

export const LimitIncreaseProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [records, setRecords] = useState<LimitIncreaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setIsLoading(true);
    const storedRecords = await storage.getLimitIncreaseRecords();
    // Sort by date descending (newest first)
    const sorted = storedRecords.sort((a, b) => {
      const dateA = a.actionDate || a.requestDate;
      const dateB = b.actionDate || b.requestDate;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    setRecords(sorted);
    setIsLoading(false);
  };

  const addRecord = async (
    data: Omit<LimitIncreaseRecord, "id" | "createdAt">
  ) => {
    const newRecord: LimitIncreaseRecord = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);
    await storage.saveLimitIncreaseRecords(updatedRecords);
  };

  const updateRecord = async (
    id: string,
    data: Partial<LimitIncreaseRecord>
  ) => {
    const updatedRecords = records.map((record) =>
      record.id === id ? { ...record, ...data } : record
    );
    setRecords(updatedRecords);
    await storage.saveLimitIncreaseRecords(updatedRecords);
  };

  const deleteRecord = async (id: string) => {
    const updatedRecords = records.filter((record) => record.id !== id);
    setRecords(updatedRecords);
    await storage.saveLimitIncreaseRecords(updatedRecords);
  };

  const getRecordsByCardId = (cardId: string) => {
    return records.filter((record) => record.cardId === cardId);
  };

  return (
    <LimitIncreaseContext.Provider
      value={{
        records,
        isLoading,
        addRecord,
        updateRecord,
        deleteRecord,
        getRecordsByCardId,
      }}
    >
      {children}
    </LimitIncreaseContext.Provider>
  );
};

export const useLimitIncrease = () => {
  const context = useContext(LimitIncreaseContext);
  if (context === undefined) {
    throw new Error(
      "useLimitIncrease must be used within a LimitIncreaseProvider"
    );
  }
  return context;
};
