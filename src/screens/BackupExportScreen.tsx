import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { theme } from "../constants/theme";
import { useCards } from "../context/CardsContext";
import { useLimitIncrease } from "../context/LimitIncreaseContext";
import { formatCurrency } from "../utils/formatters";
import { moderateScale, scale } from "../utils/responsive";
import { storage } from "../utils/storage";

export const BackupExportScreen = () => {
  const navigation = useNavigation();
  const { cards, transactions, subscriptions, installmentPlans, restoreData } =
    useCards();
  const { records: limitRecords, getRecordsByCardId } = useLimitIncrease();

  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);

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
      report += `Total Pengeluaran: ${formatCurrency(
        monthlyTransactions.reduce((sum, t) => sum + t.amount, 0)
      )}\n\n`;

      report += `PENGELUARAN PER KATEGORI\n`;
      report += `-----------------------------------------\n`;
      Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, amount]) => {
          report += `${cat}: ${formatCurrency(amount)}\n`;
        });

      report += `\nPENGELUARAN PER KARTU\n`;
      report += `-----------------------------------------\n`;
      Object.entries(byCard)
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, amount]) => {
          report += `${name}: ${formatCurrency(amount)}\n`;
        });

      report += `\nSTATUS KARTU\n`;
      report += `-----------------------------------------\n`;
      cards
        .filter((c) => !c.isArchived)
        .forEach((c) => {
          const pct = ((c.currentUsage / c.creditLimit) * 100).toFixed(1);
          report += `${c.alias}: ${formatCurrency(
            c.currentUsage
          )} / ${formatCurrency(c.creditLimit)} (${pct}%)\n`;
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
});
