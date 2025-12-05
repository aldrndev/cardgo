import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as Print from "expo-print";
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { useLimitIncrease } from "../context/LimitIncreaseContext";
import { formatCurrencyExact } from "../utils/formatters";
import { moderateScale, scale } from "../utils/responsive";
import { storage } from "../utils/storage";

export const BackupExportScreen = () => {
  const navigation = useNavigation();
  const { cards, transactions, subscriptions, installmentPlans, restoreData } =
    useCards();
  const { records: limitRecords, getRecordsByCardId } = useLimitIncrease();

  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);
  const [showCustomExport, setShowCustomExport] = useState(false);

  // Inline export options state
  const [exportFormat, setExportFormat] = useState<"csv" | "txt" | "pdf">(
    "csv"
  );
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeCards, setIncludeCards] = useState(true);
  const [includeSubscriptions, setIncludeSubscriptions] = useState(false);
  const [includeInstallments, setIncludeInstallments] = useState(false);
  const [includePayments, setIncludePayments] = useState(false);

  // Date range state
  type DatePreset =
    | "thisMonth"
    | "3months"
    | "6months"
    | "1year"
    | "all"
    | "custom";
  const [datePreset, setDatePreset] = useState<DatePreset>("all");

  // Custom date input state
  const now = new Date();
  const [startDay, setStartDay] = useState(1);
  const [startMonth, setStartMonth] = useState(now.getMonth());
  const [startYear, setStartYear] = useState(now.getFullYear());
  const [endDay, setEndDay] = useState(now.getDate());
  const [endMonth, setEndMonth] = useState(now.getMonth());
  const [endYear, setEndYear] = useState(now.getFullYear());

  // Card selection state
  const [selectAllCards, setSelectAllCards] = useState(true);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  // Category selection state
  const [selectAllCategories, setSelectAllCategories] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const activeCards = cards.filter((c) => !c.isArchived);
    const archivedCards = cards.filter((c) => c.isArchived);
    const totalTransactions = transactions.length;
    const totalSubscriptions = subscriptions.filter((s) => s.isActive).length;
    const totalInstallments = installmentPlans.length;
    const totalLimit = activeCards.reduce((sum, c) => sum + c.creditLimit, 0);
    const totalUsage = activeCards.reduce((sum, c) => sum + c.currentUsage, 0);

    // Calculate payment records
    const paymentRecords = cards.reduce((sum, c) => {
      return sum + (c.paymentHistory?.length || 0);
    }, 0);

    return {
      activeCards: activeCards.length,
      archivedCards: archivedCards.length,
      totalTransactions,
      totalSubscriptions,
      totalInstallments,
      limitRecords: limitRecords.length,
      paymentRecords,
      totalLimit,
      totalUsage,
    };
  }, [cards, transactions, subscriptions, installmentPlans, limitRecords]);

  // Get all unique categories from transactions
  const allCategories = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.category))).sort();
  }, [transactions]);

  // Create JSON backup
  const handleJsonBackup = async () => {
    setIsExporting(true);
    setExportType("json");
    try {
      const backupData = {
        version: 3,
        timestamp: new Date().toISOString(),
        appName: "CardGo",
        summary: {
          totalCards: cards.length,
          totalTransactions: transactions.length,
          totalSubscriptions: subscriptions.length,
          totalInstallments: installmentPlans.length,
          totalLimitRecords: limitRecords.length,
        },
        cards,
        transactions,
        subscriptions,
        limitIncreaseRecords: limitRecords,
        installmentPlans,
        settings: {
          themeMode: "light",
          notificationsEnabled: true,
        },
      };

      const fileName = `cardgo-backup-${new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "")}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(backupData, null, 2),
        { encoding: "utf8" }
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: "Backup CardGo",
        });
      }
    } catch (error) {
      console.error("Backup failed:", error);
      Alert.alert("Error", "Gagal membuat backup");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Create CSV export for transactions
  const handleTransactionsCsv = async () => {
    setIsExporting(true);
    setExportType("transactions");
    try {
      // CSV Header
      let csv =
        "Tanggal,Kartu,Kategori,Deskripsi,Jumlah (IDR),Currency,Original Amount\n";

      // Sort transactions by date
      const sorted = [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      sorted.forEach((t) => {
        const card = cards.find((c) => c.id === t.cardId);
        const cardName = card?.alias || "Unknown";
        const date = new Date(t.date).toLocaleDateString("id-ID");
        const desc = t.description.replace(/,/g, ";"); // Escape commas
        const amount = t.amount;
        const currency = t.currency || "IDR";
        const originalAmount = t.originalAmount || t.amount;

        csv += `${date},"${cardName}","${t.category}","${desc}",${amount},${currency},${originalAmount}\n`;
      });

      const fileName = `cardgo-transaksi-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: "utf8" });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Export Transaksi",
        });
      }
    } catch (error) {
      console.error("CSV export failed:", error);
      Alert.alert("Error", "Gagal export CSV");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Create CSV export for cards summary
  const handleCardsSummary = async () => {
    setIsExporting(true);
    setExportType("cards");
    try {
      let csv =
        "Nama Kartu,Bank,Network,Limit,Pemakaian Saat Ini,Persentase,Billing Date,Due Date,Status\n";

      cards.forEach((c) => {
        const percentage = ((c.currentUsage / c.creditLimit) * 100).toFixed(1);
        const status = c.isArchived ? "Archived" : "Active";

        csv += `"${c.alias}","${c.bankName}","${c.network}",${c.creditLimit},${c.currentUsage},${percentage}%,${c.billingCycleDay},${c.dueDay},${status}\n`;
      });

      const fileName = `cardgo-kartu-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: "utf8" });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Export Ringkasan Kartu",
        });
      }
    } catch (error) {
      console.error("CSV export failed:", error);
      Alert.alert("Error", "Gagal export CSV");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Create monthly report
  const handleMonthlyReport = async () => {
    setIsExporting(true);
    setExportType("monthly");
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Filter transactions for current month
      const monthlyTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      });

      // Group by category
      const byCategory: { [key: string]: number } = {};
      monthlyTransactions.forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      });

      // Group by card
      const byCard: { [key: string]: number } = {};
      monthlyTransactions.forEach((t) => {
        const card = cards.find((c) => c.id === t.cardId);
        const name = card?.alias || "Unknown";
        byCard[name] = (byCard[name] || 0) + t.amount;
      });

      const monthName = now.toLocaleDateString("id-ID", { month: "long" });

      let report = `LAPORAN BULANAN CARDGO\n`;
      report += `Periode: ${monthName} ${currentYear}\n`;
      report += `Generated: ${now.toLocaleString("id-ID")}\n`;
      report += `========================================\n\n`;

      report += `RINGKASAN\n`;
      report += `-----------------------------------------\n`;
      report += `Total Transaksi: ${monthlyTransactions.length}\n`;
      report += `Total Pengeluaran: ${formatCurrencyExact(
        monthlyTransactions.reduce((sum, t) => sum + t.amount, 0)
      )}\n\n`;

      report += `PENGELUARAN PER KATEGORI\n`;
      report += `-----------------------------------------\n`;
      Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, amount]) => {
          report += `${cat}: ${formatCurrencyExact(amount)}\n`;
        });

      report += `\nPENGELUARAN PER KARTU\n`;
      report += `-----------------------------------------\n`;
      Object.entries(byCard)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, amount]) => {
          report += `${name}: ${formatCurrencyExact(amount)}\n`;
        });

      report += `\nSTATUS KARTU\n`;
      report += `-----------------------------------------\n`;
      cards
        .filter((c) => !c.isArchived)
        .forEach((c) => {
          const pct = ((c.currentUsage / c.creditLimit) * 100).toFixed(1);
          report += `${c.alias}: ${formatCurrencyExact(
            c.currentUsage
          )} / ${formatCurrencyExact(c.creditLimit)} (${pct}%)\n`;
        });

      const fileName = `cardgo-laporan-${monthName.toLowerCase()}-${currentYear}.txt`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, report, {
        encoding: "utf8",
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/plain",
          dialogTitle: "Laporan Bulanan",
        });
      }
    } catch (error) {
      console.error("Report export failed:", error);
      Alert.alert("Error", "Gagal membuat laporan");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Restore from backup
  const handleRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: "utf8",
      });
      const data = JSON.parse(content);

      // Validate
      if (!data.cards || !Array.isArray(data.cards)) {
        Alert.alert("Error", "Format file backup tidak valid");
        return;
      }

      const backupDate = data.timestamp
        ? new Date(data.timestamp).toLocaleDateString("id-ID")
        : "Unknown";

      Alert.alert(
        "Restore Backup",
        `File backup dari: ${backupDate}\n\n` +
          `Isi backup:\n` +
          `• ${data.cards?.length || 0} kartu\n` +
          `• ${data.transactions?.length || 0} transaksi\n` +
          `• ${data.subscriptions?.length || 0} langganan\n\n` +
          `Data saat ini akan ditimpa. Lanjutkan?`,
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: async () => {
              try {
                // Restore cards, transactions, subscriptions, installments
                await restoreData(
                  data.cards,
                  data.transactions,
                  data.subscriptions || [],
                  data.installmentPlans || []
                );
                // Restore limit increase records if available
                if (
                  data.limitIncreaseRecords &&
                  data.limitIncreaseRecords.length > 0
                ) {
                  await storage.saveLimitIncreaseRecords(
                    data.limitIncreaseRecords
                  );
                }
                Alert.alert("Sukses", "Data berhasil di-restore!");
              } catch (err) {
                Alert.alert("Error", "Gagal restore data");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Restore failed:", error);
      Alert.alert("Error", "Gagal membaca file backup");
    }
  };

  // Handle inline custom export
  const handleInlineExport = async () => {
    setIsExporting(true);
    setExportType("custom");

    try {
      // Calculate date range from preset
      const now = new Date();
      let startDate = new Date(2020, 0, 1);
      let endDate = now;

      switch (datePreset) {
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "3months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case "6months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          break;
        case "1year":
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
          break;
        case "custom":
          startDate = new Date(startYear, startMonth, startDay);
          endDate = new Date(endYear, endMonth, endDay);
          break;
        case "all":
        default:
          startDate = new Date(2020, 0, 1);
      }

      const dateRange = { start: startDate, end: endDate };
      const format = exportFormat;

      // Use selected cards or all if "select all" is checked
      const cardIds = selectAllCards ? [] : selectedCardIds;
      const categories = selectAllCategories ? [] : selectedCategories;

      // Filter transactions
      let filteredTransactions = transactions.filter((t) => {
        const txDate = new Date(t.date);
        return txDate >= dateRange.start && txDate <= dateRange.end;
      });

      // Filter by cards
      if (cardIds.length > 0) {
        filteredTransactions = filteredTransactions.filter((t) =>
          cardIds.includes(t.cardId)
        );
      }

      // Filter by categories
      if (categories.length > 0) {
        filteredTransactions = filteredTransactions.filter((t) =>
          categories.includes(t.category)
        );
      }

      // Filter cards
      let filteredCards = cards;
      if (cardIds.length > 0) {
        filteredCards = cards.filter((c) => cardIds.includes(c.id));
      }

      // Filter subscriptions
      let filteredSubscriptions = subscriptions;
      if (cardIds.length > 0) {
        filteredSubscriptions = subscriptions.filter((s) =>
          cardIds.includes(s.cardId)
        );
      }

      // Filter installments
      let filteredInstallments = installmentPlans;
      if (cardIds.length > 0) {
        filteredInstallments = installmentPlans.filter((i) =>
          cardIds.includes(i.cardId)
        );
      }

      const dateStr = new Date().toISOString().split("T")[0];
      const startStr = dateRange.start.toLocaleDateString("id-ID");
      const endStr = dateRange.end.toLocaleDateString("id-ID");

      // Check if at least one data type is selected
      if (
        !includeTransactions &&
        !includeCards &&
        !includeSubscriptions &&
        !includeInstallments &&
        !includePayments
      ) {
        Alert.alert("Error", "Pilih minimal satu tipe data untuk di-export");
        return;
      }

      // Check if there's data to export
      const hasData =
        (includeTransactions && filteredTransactions.length > 0) ||
        (includeCards && filteredCards.length > 0) ||
        (includeSubscriptions && filteredSubscriptions.length > 0) ||
        (includeInstallments && filteredInstallments.length > 0) ||
        (includePayments &&
          filteredCards.some((c) => (c.paymentHistory?.length ?? 0) > 0));

      if (!hasData) {
        Alert.alert(
          "Tidak Ada Data",
          "Tidak ada data yang sesuai dengan filter yang dipilih. Coba ubah periode atau filter lainnya."
        );
        return;
      }

      if (format === "csv") {
        // Generate CSV
        let csv = "";

        // Transactions section
        if (includeTransactions && filteredTransactions.length > 0) {
          csv += "=== TRANSAKSI ===\n";
          csv +=
            "Tanggal,Kartu,Kategori,Deskripsi,Jumlah (IDR),Currency,Original Amount\n";

          const sorted = [...filteredTransactions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          sorted.forEach((t) => {
            const card = cards.find((c) => c.id === t.cardId);
            const cardName = card?.alias || "Unknown";
            const date = new Date(t.date).toLocaleDateString("id-ID");
            const desc = t.description.replace(/,/g, ";");
            csv += `${date},"${cardName}","${t.category}","${desc}",${
              t.amount
            },${t.currency || "IDR"},${t.originalAmount || t.amount}\n`;
          });
          csv += "\n";
        }

        // Cards section
        if (includeCards && filteredCards.length > 0) {
          csv += "=== RINGKASAN KARTU ===\n";
          csv +=
            "Nama Kartu,Bank,Network,Limit,Pemakaian,Persentase,Billing Date,Due Date,Status\n";

          filteredCards.forEach((c) => {
            const pct = ((c.currentUsage / c.creditLimit) * 100).toFixed(1);
            const status = c.isArchived ? "Archived" : "Active";
            csv += `"${c.alias}","${c.bankName}","${c.network}",${c.creditLimit},${c.currentUsage},${pct}%,${c.billingCycleDay},${c.dueDay},${status}\n`;
          });
          csv += "\n";
        }

        // Subscriptions section
        if (includeSubscriptions && filteredSubscriptions.length > 0) {
          csv += "=== LANGGANAN ===\n";
          csv += "Nama,Kartu,Kategori,Jumlah,Siklus,Tanggal Tagihan,Status\n";

          filteredSubscriptions.forEach((s) => {
            const card = cards.find((c) => c.id === s.cardId);
            csv += `"${s.name}","${card?.alias || ""}","${s.category}",${
              s.amount
            },"${s.billingCycle}",${s.billingDay},"${
              s.isActive ? "Aktif" : "Nonaktif"
            }"\n`;
          });
          csv += "\n";
        }

        // Installments section
        if (includeInstallments && filteredInstallments.length > 0) {
          csv += "=== CICILAN ===\n";
          csv += "Deskripsi,Kartu,Total,Cicilan/Bulan,Tenor\n";

          filteredInstallments.forEach((i) => {
            const card = cards.find((c) => c.id === i.cardId);
            csv += `"${i.description}","${card?.alias || ""}",${
              i.originalAmount
            },${i.monthlyAmount},${i.totalMonths}\n`;
          });
          csv += "\n";
        }

        // Payment history section
        if (includePayments) {
          const allPayments: any[] = [];
          filteredCards.forEach((c) => {
            if (c.paymentHistory) {
              c.paymentHistory.forEach((p) => {
                allPayments.push({ ...p, cardAlias: c.alias });
              });
            }
          });

          if (allPayments.length > 0) {
            csv += "=== RIWAYAT PEMBAYARAN ===\n";
            csv += "Tanggal,Kartu,Jumlah,Tipe,Catatan\n";

            allPayments
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .forEach((p) => {
                const date = new Date(p.date).toLocaleDateString("id-ID");
                csv += `${date},"${p.cardAlias}",${p.amount},"${p.type}","${
                  p.notes || ""
                }"\n`;
              });
          }
        }

        const fileName = `cardgo-export-kustom-${dateStr}.csv`;
        const fileUri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: "utf8" });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/csv",
            dialogTitle: "Export Kustom CardGo",
          });
        }
      } else if (format === "txt") {
        // Generate TXT Report
        let report = `LAPORAN KUSTOM CARDGO\n`;
        report += `========================================\n`;
        report += `Periode: ${startStr} - ${endStr}\n`;
        report += `Generated: ${new Date().toLocaleString("id-ID")}\n`;
        report += `========================================\n\n`;

        // Transactions summary
        if (includeTransactions && filteredTransactions.length > 0) {
          const totalSpent = filteredTransactions.reduce(
            (sum, t) => sum + t.amount,
            0
          );

          report += `RINGKASAN TRANSAKSI\n`;
          report += `-----------------------------------------\n`;
          report += `Total Transaksi: ${filteredTransactions.length}\n`;
          report += `Total Pengeluaran: ${formatCurrencyExact(totalSpent)}\n\n`;

          // By category
          const byCategory: { [key: string]: number } = {};
          filteredTransactions.forEach((t) => {
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
          });

          report += `PENGELUARAN PER KATEGORI\n`;
          report += `-----------------------------------------\n`;
          Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cat, amount]) => {
              report += `${cat}: ${formatCurrencyExact(amount)}\n`;
            });
          report += "\n";

          // By card
          const byCard: { [key: string]: number } = {};
          filteredTransactions.forEach((t) => {
            const card = cards.find((c) => c.id === t.cardId);
            const name = card?.alias || "Unknown";
            byCard[name] = (byCard[name] || 0) + t.amount;
          });

          report += `PENGELUARAN PER KARTU\n`;
          report += `-----------------------------------------\n`;
          Object.entries(byCard)
            .sort((a, b) => b[1] - a[1])
            .forEach(([name, amount]) => {
              report += `${name}: ${formatCurrencyExact(amount)}\n`;
            });
          report += "\n";
        }

        // Cards status
        if (includeCards && filteredCards.length > 0) {
          report += `STATUS KARTU\n`;
          report += `-----------------------------------------\n`;
          filteredCards.forEach((c) => {
            const pct = ((c.currentUsage / c.creditLimit) * 100).toFixed(1);
            report += `${c.alias}:\n`;
            report += `  Limit: ${formatCurrencyExact(c.creditLimit)}\n`;
            report += `  Pemakaian: ${formatCurrencyExact(
              c.currentUsage
            )} (${pct}%)\n`;
            report += `  Sisa: ${formatCurrencyExact(
              c.creditLimit - c.currentUsage
            )}\n`;
            report += "\n";
          });
        }

        // Subscriptions
        if (includeSubscriptions && filteredSubscriptions.length > 0) {
          const totalMonthly = filteredSubscriptions
            .filter((s) => s.isActive)
            .reduce((sum, s) => sum + s.amount, 0);

          report += `LANGGANAN AKTIF\n`;
          report += `-----------------------------------------\n`;
          report += `Total Bulanan: ${formatCurrencyExact(totalMonthly)}\n\n`;
          filteredSubscriptions
            .filter((s) => s.isActive)
            .forEach((s) => {
              const card = cards.find((c) => c.id === s.cardId);
              report += `${s.name} (${
                card?.alias || ""
              }): ${formatCurrencyExact(s.amount)}/bulan\n`;
            });
          report += "\n";
        }

        // Installments
        if (includeInstallments && filteredInstallments.length > 0) {
          report += `CICILAN AKTIF\n`;
          report += `-----------------------------------------\n`;
          filteredInstallments.forEach((i) => {
            const card = cards.find((c) => c.id === i.cardId);
            report += `${i.description} (${card?.alias || ""}):\n`;
            report += `  Total: ${formatCurrencyExact(i.originalAmount)}\n`;
            report += `  Cicilan: ${formatCurrencyExact(
              i.monthlyAmount
            )}/bulan\n`;
            report += `  Tenor: ${i.totalMonths} bulan\n`;
            report += "\n";
          });
        }

        // Payment history
        if (includePayments) {
          const allPayments: any[] = [];
          filteredCards.forEach((c) => {
            if (c.paymentHistory) {
              c.paymentHistory.forEach((p) => {
                allPayments.push({ ...p, cardAlias: c.alias });
              });
            }
          });

          if (allPayments.length > 0) {
            report += `RIWAYAT PEMBAYARAN\n`;
            report += `-----------------------------------------\n`;
            allPayments
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .slice(0, 10)
              .forEach((p) => {
                const date = new Date(p.date).toLocaleDateString("id-ID");
                report += `${date} - ${p.cardAlias}: ${formatCurrencyExact(
                  p.amount
                )} (${p.type})\n`;
              });
          }
        }

        const fileName = `cardgo-laporan-kustom-${dateStr}.txt`;
        const fileUri = FileSystem.documentDirectory + fileName;

        await FileSystem.writeAsStringAsync(fileUri, report, {
          encoding: "utf8",
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/plain",
            dialogTitle: "Laporan Kustom CardGo",
          });
        }
      } else if (format === "pdf") {
        // Generate PDF with HTML
        let html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Laporan CardGo</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
              .header h1 { color: #3B82F6; font-size: 28px; margin-bottom: 8px; }
              .header p { color: #666; font-size: 14px; }
              .section { margin-bottom: 30px; }
              .section-title { background: #3B82F6; color: white; padding: 10px 15px; font-size: 16px; font-weight: 600; border-radius: 8px 8px 0 0; }
              .section-content { border: 1px solid #e0e0e0; border-top: none; padding: 15px; background: #fafafa; border-radius: 0 0 8px 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { background: #f0f0f0; text-align: left; padding: 10px; font-size: 12px; color: #555; }
              td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
              tr:last-child td { border-bottom: none; }
              .amount { font-weight: 600; color: #1f2937; }
              .summary-box { display: flex; justify-content: space-between; padding: 15px; background: #EFF6FF; border-radius: 8px; margin-bottom: 15px; }
              .summary-item { text-align: center; }
              .summary-value { font-size: 24px; font-weight: 700; color: #3B82F6; }
              .summary-label { font-size: 12px; color: #666; margin-top: 4px; }
              .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 11px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Laporan CardGo</h1>
              <p>Periode: ${startStr} - ${endStr}</p>
              <p>Generated: ${new Date().toLocaleString("id-ID")}</p>
            </div>
        `;

        // Transactions section
        if (includeTransactions && filteredTransactions.length > 0) {
          const totalSpent = filteredTransactions.reduce(
            (sum, t) => sum + t.amount,
            0
          );

          html += `
            <div class="section">
              <div class="section-title">💳 Transaksi (${
                filteredTransactions.length
              })</div>
              <div class="section-content">
                <div class="summary-box">
                  <div class="summary-item">
                    <div class="summary-value">${
                      filteredTransactions.length
                    }</div>
                    <div class="summary-label">Transaksi</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-value">${formatCurrencyExact(
                      totalSpent
                    )}</div>
                    <div class="summary-label">Total Pengeluaran</div>
                  </div>
                </div>
                <table>
                  <tr><th>Tanggal</th><th>Kartu</th><th>Kategori</th><th>Deskripsi</th><th>Jumlah</th></tr>
          `;

          const sorted = [...filteredTransactions]
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            .slice(0, 50); // Limit to 50 for PDF

          sorted.forEach((t) => {
            const card = cards.find((c) => c.id === t.cardId);
            const date = new Date(t.date).toLocaleDateString("id-ID");
            html += `<tr><td>${date}</td><td>${card?.alias || "-"}</td><td>${
              t.category
            }</td><td>${
              t.description
            }</td><td class="amount">${formatCurrencyExact(
              t.amount
            )}</td></tr>`;
          });

          html += `</table></div></div>`;
        }

        // Cards section
        if (includeCards && filteredCards.length > 0) {
          html += `
            <div class="section">
              <div class="section-title">🏦 Status Kartu (${filteredCards.length})</div>
              <div class="section-content">
                <table>
                  <tr><th>Nama Kartu</th><th>Bank</th><th>Limit</th><th>Pemakaian</th><th>%</th><th>Status</th></tr>
          `;

          filteredCards.forEach((c) => {
            const pct = ((c.currentUsage / c.creditLimit) * 100).toFixed(1);
            const status = c.isArchived ? "Archived" : "Active";
            html += `<tr><td>${c.alias}</td><td>${
              c.bankName
            }</td><td class="amount">${formatCurrencyExact(
              c.creditLimit
            )}</td><td class="amount">${formatCurrencyExact(
              c.currentUsage
            )}</td><td>${pct}%</td><td>${status}</td></tr>`;
          });

          html += `</table></div></div>`;
        }

        // Subscriptions section
        if (includeSubscriptions && filteredSubscriptions.length > 0) {
          const totalMonthly = filteredSubscriptions
            .filter((s) => s.isActive)
            .reduce((sum, s) => sum + s.amount, 0);

          html += `
            <div class="section">
              <div class="section-title">🔄 Langganan Aktif</div>
              <div class="section-content">
                <div class="summary-box">
                  <div class="summary-item">
                    <div class="summary-value">${formatCurrencyExact(
                      totalMonthly
                    )}</div>
                    <div class="summary-label">Total Bulanan</div>
                  </div>
                </div>
                <table>
                  <tr><th>Nama</th><th>Kartu</th><th>Kategori</th><th>Jumlah/Bulan</th></tr>
          `;

          filteredSubscriptions
            .filter((s) => s.isActive)
            .forEach((s) => {
              const card = cards.find((c) => c.id === s.cardId);
              html += `<tr><td>${s.name}</td><td>${
                card?.alias || "-"
              }</td><td>${
                s.category
              }</td><td class="amount">${formatCurrencyExact(
                s.amount
              )}</td></tr>`;
            });

          html += `</table></div></div>`;
        }

        // Installments section
        if (includeInstallments && filteredInstallments.length > 0) {
          html += `
            <div class="section">
              <div class="section-title">📅 Cicilan Aktif</div>
              <div class="section-content">
                <table>
                  <tr><th>Deskripsi</th><th>Kartu</th><th>Total</th><th>Cicilan/Bulan</th><th>Tenor</th></tr>
          `;

          filteredInstallments.forEach((i) => {
            const card = cards.find((c) => c.id === i.cardId);
            html += `<tr><td>${i.description}</td><td>${
              card?.alias || "-"
            }</td><td class="amount">${formatCurrencyExact(
              i.originalAmount
            )}</td><td class="amount">${formatCurrencyExact(
              i.monthlyAmount
            )}</td><td>${i.totalMonths} bulan</td></tr>`;
          });

          html += `</table></div></div>`;
        }

        // Payment history section
        if (includePayments) {
          const allPayments: any[] = [];
          filteredCards.forEach((c) => {
            if (c.paymentHistory) {
              c.paymentHistory.forEach((p) => {
                allPayments.push({ ...p, cardAlias: c.alias });
              });
            }
          });

          if (allPayments.length > 0) {
            html += `
              <div class="section">
                <div class="section-title">✅ Riwayat Pembayaran</div>
                <div class="section-content">
                  <table>
                    <tr><th>Tanggal</th><th>Kartu</th><th>Jumlah</th><th>Tipe</th></tr>
            `;

            allPayments
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .slice(0, 20)
              .forEach((p) => {
                const date = new Date(p.date).toLocaleDateString("id-ID");
                html += `<tr><td>${date}</td><td>${
                  p.cardAlias
                }</td><td class="amount">${formatCurrencyExact(
                  p.amount
                )}</td><td>${p.type}</td></tr>`;
              });

            html += `</table></div></div>`;
          }
        }

        html += `
            <div class="footer">
              <p>Dokumen ini dibuat oleh CardGo - Credit Card Tracker</p>
            </div>
          </body>
          </html>
        `;

        // Generate PDF
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
        });

        // Share the PDF file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: "Laporan PDF CardGo",
          });
        }
      }

      Alert.alert("Sukses", "Laporan berhasil di-export!");
    } catch (error) {
      console.error("Custom export failed:", error);
      Alert.alert("Error", "Gagal export laporan");
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const ExportButton = ({
    icon,
    title,
    subtitle,
    onPress,
    type,
    color = theme.colors.primary,
  }: {
    icon: any;
    title: string;
    subtitle: string;
    onPress: () => void;
    type: string;
    color?: string;
  }) => (
    <TouchableOpacity
      style={styles.exportButton}
      onPress={onPress}
      disabled={isExporting}
    >
      <View style={[styles.exportIcon, { backgroundColor: color + "15" }]}>
        {isExporting && exportType === type ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Ionicons name={icon} size={24} color={color} />
        )}
      </View>
      <View style={styles.exportContent}>
        <Text style={styles.exportTitle}>{title}</Text>
        <Text style={styles.exportSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.text.tertiary}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Backup & Export</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Data Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Ringkasan Data</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{stats.activeCards}</Text>
              <Text style={styles.summaryLabel}>Kartu Aktif</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{stats.archivedCards}</Text>
              <Text style={styles.summaryLabel}>Diarsipkan</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{stats.totalTransactions}</Text>
              <Text style={styles.summaryLabel}>Transaksi</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{stats.paymentRecords}</Text>
              <Text style={styles.summaryLabel}>Pembayaran</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {stats.totalSubscriptions}
              </Text>
              <Text style={styles.summaryLabel}>Langganan</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{stats.totalInstallments}</Text>
              <Text style={styles.summaryLabel}>Cicilan</Text>
            </View>
          </View>
        </View>

        {/* Backup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup Data</Text>
          <Text style={styles.sectionDesc}>
            Simpan semua data ke file untuk dipindahkan ke perangkat lain
          </Text>

          <ExportButton
            icon="cloud-download-outline"
            title="Backup Lengkap (JSON)"
            subtitle="Semua kartu, transaksi, langganan, cicilan"
            onPress={handleJsonBackup}
            type="json"
            color={theme.colors.primary}
          />

          <ExportButton
            icon="cloud-upload-outline"
            title="Restore dari Backup"
            subtitle="Pulihkan data dari file backup"
            onPress={handleRestore}
            type="restore"
            color={theme.colors.status.success}
          />
        </View>

        {/* Export Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Data</Text>
          <Text style={styles.sectionDesc}>
            Export ke format yang bisa dibuka di Excel/Spreadsheet
          </Text>

          <ExportButton
            icon="swap-horizontal-outline"
            title="Export Transaksi (CSV)"
            subtitle={`${stats.totalTransactions} transaksi ke spreadsheet`}
            onPress={handleTransactionsCsv}
            type="transactions"
            color="#10B981"
          />

          <ExportButton
            icon="card-outline"
            title="Export Ringkasan Kartu (CSV)"
            subtitle={`${
              stats.activeCards + stats.archivedCards
            } kartu dengan limit & pemakaian`}
            onPress={handleCardsSummary}
            type="cards"
            color="#8B5CF6"
          />

          <ExportButton
            icon="document-text-outline"
            title="Laporan Bulanan"
            subtitle="Ringkasan pengeluaran bulan ini"
            onPress={handleMonthlyReport}
            type="monthly"
            color="#F59E0B"
          />

          <TouchableOpacity
            style={[styles.exportButton, { borderBottomWidth: 0 }]}
            onPress={() => setShowCustomExport(!showCustomExport)}
          >
            <View style={[styles.exportIcon, { backgroundColor: "#EC489915" }]}>
              <Ionicons name="options-outline" size={24} color="#EC4899" />
            </View>
            <View style={styles.exportContent}>
              <Text style={styles.exportTitle}>Laporan Kustom</Text>
              <Text style={styles.exportSubtitle}>
                Pilih data dan format sesuai kebutuhan
              </Text>
            </View>
            <Ionicons
              name={showCustomExport ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.colors.text.tertiary}
            />
          </TouchableOpacity>

          {/* Inline Export Options */}
          {showCustomExport && (
            <View style={styles.inlineExportSection}>
              {/* Period/Date Preset Selection */}
              <Text style={styles.inlineLabel}>Periode:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.presetScroll}
              >
                {(
                  [
                    { key: "thisMonth", label: "Bulan Ini" },
                    { key: "3months", label: "3 Bulan" },
                    { key: "6months", label: "6 Bulan" },
                    { key: "1year", label: "1 Tahun" },
                    { key: "all", label: "Semua Data" },
                    { key: "custom", label: "Pilih Tanggal" },
                  ] as const
                ).map((preset) => (
                  <TouchableOpacity
                    key={preset.key}
                    style={[
                      styles.formatChip,
                      datePreset === preset.key && styles.formatChipActive,
                    ]}
                    onPress={() => setDatePreset(preset.key)}
                  >
                    <Text
                      style={[
                        styles.formatChipText,
                        datePreset === preset.key &&
                          styles.formatChipTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Custom Date Picker - Text Input Style */}
              {datePreset === "custom" && (
                <View style={styles.customDateSection}>
                  {/* Start Date (Dari) */}
                  <Text style={styles.dateInputLabel}>Dari:</Text>
                  <View style={styles.dateInputRow}>
                    <View style={styles.dateInputColumn}>
                      <Text style={styles.dateInputHeader}>Hari</Text>
                      <TextInput
                        style={styles.dateInputField}
                        value={startDay.toString()}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 1;
                          setStartDay(Math.min(31, Math.max(1, num)));
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View style={styles.dateInputColumn}>
                      <Text style={styles.dateInputHeader}>Bulan</Text>
                      <TextInput
                        style={styles.dateInputField}
                        value={(startMonth + 1).toString()}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 1;
                          setStartMonth(Math.min(12, Math.max(1, num)) - 1);
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View style={styles.dateInputColumn}>
                      <Text style={styles.dateInputHeader}>Tahun</Text>
                      <TextInput
                        style={styles.dateInputField}
                        value={startYear.toString()}
                        onChangeText={(text) => {
                          const num =
                            parseInt(text) || new Date().getFullYear();
                          setStartYear(num);
                        }}
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                  </View>

                  {/* End Date (Sampai) */}
                  <Text style={[styles.dateInputLabel, { marginTop: 12 }]}>
                    Sampai:
                  </Text>
                  <View style={styles.dateInputRow}>
                    <View style={styles.dateInputColumn}>
                      <Text style={styles.dateInputHeader}>Hari</Text>
                      <TextInput
                        style={styles.dateInputField}
                        value={endDay.toString()}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 1;
                          setEndDay(Math.min(31, Math.max(1, num)));
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View style={styles.dateInputColumn}>
                      <Text style={styles.dateInputHeader}>Bulan</Text>
                      <TextInput
                        style={styles.dateInputField}
                        value={(endMonth + 1).toString()}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 1;
                          setEndMonth(Math.min(12, Math.max(1, num)) - 1);
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                    <View style={styles.dateInputColumn}>
                      <Text style={styles.dateInputHeader}>Tahun</Text>
                      <TextInput
                        style={styles.dateInputField}
                        value={endYear.toString()}
                        onChangeText={(text) => {
                          const num =
                            parseInt(text) || new Date().getFullYear();
                          setEndYear(num);
                        }}
                        keyboardType="numeric"
                        maxLength={4}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Card Selection */}
              <Text style={[styles.inlineLabel, { marginTop: 16 }]}>
                Kartu:
              </Text>
              <TouchableOpacity
                style={[
                  styles.toggleChip,
                  selectAllCards && styles.toggleChipActive,
                  { alignSelf: "flex-start", marginBottom: 8 },
                ]}
                onPress={() => {
                  setSelectAllCards(!selectAllCards);
                  if (!selectAllCards) setSelectedCardIds([]);
                }}
              >
                <Ionicons
                  name={selectAllCards ? "checkbox" : "square-outline"}
                  size={18}
                  color={
                    selectAllCards
                      ? theme.colors.primary
                      : theme.colors.text.tertiary
                  }
                />
                <Text style={styles.toggleText}>Semua Kartu</Text>
              </TouchableOpacity>

              {!selectAllCards && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.presetScroll}
                >
                  {cards.map((card) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[
                        styles.selectionChip,
                        selectedCardIds.includes(card.id) &&
                          styles.selectionChipActive,
                      ]}
                      onPress={() => {
                        setSelectedCardIds((prev) =>
                          prev.includes(card.id)
                            ? prev.filter((id) => id !== card.id)
                            : [...prev, card.id]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.selectionChipText,
                          selectedCardIds.includes(card.id) &&
                            styles.selectionChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {card.alias.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Category Selection */}
              <Text style={[styles.inlineLabel, { marginTop: 24 }]}>
                Kategori:
              </Text>
              <TouchableOpacity
                style={[
                  styles.toggleChip,
                  selectAllCategories && styles.toggleChipActive,
                  { alignSelf: "flex-start", marginBottom: 8 },
                ]}
                onPress={() => {
                  setSelectAllCategories(!selectAllCategories);
                  if (!selectAllCategories) setSelectedCategories([]);
                }}
              >
                <Ionicons
                  name={selectAllCategories ? "checkbox" : "square-outline"}
                  size={18}
                  color={
                    selectAllCategories
                      ? theme.colors.primary
                      : theme.colors.text.tertiary
                  }
                />
                <Text style={styles.toggleText}>Semua Kategori</Text>
              </TouchableOpacity>

              {!selectAllCategories && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.presetScroll}
                >
                  {allCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.selectionChip,
                        selectedCategories.includes(cat) &&
                          styles.selectionChipActive,
                      ]}
                      onPress={() => {
                        setSelectedCategories((prev) =>
                          prev.includes(cat)
                            ? prev.filter((c) => c !== cat)
                            : [...prev, cat]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.selectionChipText,
                          selectedCategories.includes(cat) &&
                            styles.selectionChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Format Selection */}
              <Text style={[styles.inlineLabel, { marginTop: 24 }]}>
                Format:
              </Text>
              <View style={styles.formatRow}>
                {(["csv", "txt", "pdf"] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.formatChip,
                      exportFormat === f && styles.formatChipActive,
                    ]}
                    onPress={() => setExportFormat(f)}
                  >
                    <Text
                      style={[
                        styles.formatChipText,
                        exportFormat === f && styles.formatChipTextActive,
                      ]}
                    >
                      {f.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Data Type Toggles */}
              <Text style={[styles.inlineLabel, { marginTop: 24 }]}>
                Data yang Di-export:
              </Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleChip,
                    includeTransactions && styles.toggleChipActive,
                  ]}
                  onPress={() => setIncludeTransactions(!includeTransactions)}
                >
                  <Ionicons
                    name={includeTransactions ? "checkbox" : "square-outline"}
                    size={18}
                    color={
                      includeTransactions
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                  <Text style={styles.toggleText}>Transaksi</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleChip,
                    includeCards && styles.toggleChipActive,
                  ]}
                  onPress={() => setIncludeCards(!includeCards)}
                >
                  <Ionicons
                    name={includeCards ? "checkbox" : "square-outline"}
                    size={18}
                    color={
                      includeCards
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                  <Text style={styles.toggleText}>Kartu</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleChip,
                    includeSubscriptions && styles.toggleChipActive,
                  ]}
                  onPress={() => setIncludeSubscriptions(!includeSubscriptions)}
                >
                  <Ionicons
                    name={includeSubscriptions ? "checkbox" : "square-outline"}
                    size={18}
                    color={
                      includeSubscriptions
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                  <Text style={styles.toggleText}>Langganan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleChip,
                    includeInstallments && styles.toggleChipActive,
                  ]}
                  onPress={() => setIncludeInstallments(!includeInstallments)}
                >
                  <Ionicons
                    name={includeInstallments ? "checkbox" : "square-outline"}
                    size={18}
                    color={
                      includeInstallments
                        ? theme.colors.primary
                        : theme.colors.text.tertiary
                    }
                  />
                  <Text style={styles.toggleText}>Cicilan</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.toggleChip,
                  includePayments && styles.toggleChipActive,
                  { alignSelf: "flex-start" },
                ]}
                onPress={() => setIncludePayments(!includePayments)}
              >
                <Ionicons
                  name={includePayments ? "checkbox" : "square-outline"}
                  size={18}
                  color={
                    includePayments
                      ? theme.colors.primary
                      : theme.colors.text.tertiary
                  }
                />
                <Text style={styles.toggleText}>Riwayat Bayar</Text>
              </TouchableOpacity>

              {/* Export Button */}
              <TouchableOpacity
                style={styles.inlineExportButton}
                onPress={handleInlineExport}
                disabled={isExporting && exportType === "custom"}
              >
                {isExporting && exportType === "custom" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.inlineExportButtonText}>
                      Export Sekarang
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.infoText}>
            File backup JSON dapat di-restore ke CardGo. File CSV dapat dibuka
            di Excel, Google Sheets, atau aplikasi spreadsheet lainnya.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.s,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  content: {
    padding: theme.spacing.m,
    paddingBottom: theme.spacing.xl,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
  },
  summaryTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryItem: {
    width: "33.33%",
    alignItems: "center",
    paddingVertical: theme.spacing.s,
  },
  summaryValue: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontWeight: "700",
  },
  summaryLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    ...theme.shadows.small,
  },
  sectionTitle: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  sectionDesc: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.m,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  exportIcon: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    alignItems: "center",
    justifyContent: "center",
  },
  exportContent: {
    flex: 1,
    marginLeft: theme.spacing.m,
  },
  exportTitle: {
    ...theme.typography.body,
    fontWeight: "500",
    color: theme.colors.text.primary,
  },
  exportSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: theme.colors.primary + "10",
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    gap: theme.spacing.s,
  },
  infoText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  // Inline export section styles
  inlineExportSection: {
    paddingTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inlineLabel: {
    ...theme.typography.caption,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
  },
  formatRow: {
    flexDirection: "row",
    gap: theme.spacing.s,
  },
  formatChip: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.s,
  },
  formatChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  formatChipText: {
    ...theme.typography.caption,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },
  formatChipTextActive: {
    color: "#FFFFFF",
  },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.s,
    rowGap: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  toggleChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.s,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.background,
  },
  toggleChipActive: {
    backgroundColor: theme.colors.primary + "10",
  },
  toggleText: {
    ...theme.typography.caption,
    color: theme.colors.text.primary,
  },
  inlineExportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.s,
    backgroundColor: "#EC4899",
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginTop: theme.spacing.m,
  },
  inlineExportButtonText: {
    ...theme.typography.body,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  presetScroll: {
    marginBottom: theme.spacing.s,
  },
  selectionChip: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.s,
  },
  selectionChipActive: {
    backgroundColor: theme.colors.primary + "15",
    borderColor: theme.colors.primary,
  },
  selectionChipText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  selectionChipTextActive: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.s,
  },
  // Custom date input styles
  customDateSection: {
    marginTop: theme.spacing.s,
  },
  dateInputLabel: {
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  dateInputRow: {
    flexDirection: "row",
    gap: theme.spacing.m,
  },
  dateInputColumn: {
    flex: 1,
    alignItems: "center",
  },
  dateInputHeader: {
    ...theme.typography.caption,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.xs,
  },
  dateInputField: {
    width: "100%",
    textAlign: "center",
    ...theme.typography.body,
    fontWeight: "600",
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary + "40",
  },
});
