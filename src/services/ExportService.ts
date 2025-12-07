import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Card, Transaction } from "../types/card";

// Enhanced PDF Export Service
export const ExportService = {
  async exportToPDF(
    cards: Card[],
    transactions: Transaction[],
    paymentHistory?: any[]
  ) {
    // Calculate totals
    const totalLimit = cards.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
    const totalUsage = cards.reduce((sum, c) => sum + (c.currentUsage || 0), 0);
    const totalRemaining = totalLimit - totalUsage;
    const usagePercentage =
      totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0;

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        categoryTotals[tx.category] =
          (categoryTotals[tx.category] || 0) + tx.amount;
      }
    });
    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Recent transactions (last 50)
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Laporan Card Go</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
              padding: 40px; 
              color: #333;
              font-size: 12px;
              line-height: 1.5;
            }
            
            /* Header */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #6366F1;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: 800;
              color: #6366F1;
            }
            .logo-icon { font-size: 24px; }
            .report-info {
              text-align: right;
              color: #666;
            }
            .report-date { font-size: 14px; font-weight: 600; }
            
            /* Summary Cards */
            .summary-section {
              display: flex;
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-card {
              flex: 1;
              background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
              color: white;
              padding: 20px;
              border-radius: 12px;
            }
            .summary-card.success {
              background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            }
            .summary-card.warning {
              background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            }
            .summary-label { font-size: 11px; opacity: 0.9; }
            .summary-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
            .summary-sub { font-size: 10px; opacity: 0.8; margin-top: 4px; }
            
            /* Section Headers */
            h2 {
              color: #1F2937;
              font-size: 16px;
              font-weight: 700;
              margin: 30px 0 15px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #E5E7EB;
            }
            h2 .icon { margin-right: 8px; }
            
            /* Tables */
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
              font-size: 11px;
            }
            th, td { 
              padding: 10px 8px; 
              text-align: left; 
              border-bottom: 1px solid #E5E7EB;
            }
            th { 
              background-color: #F9FAFB; 
              font-weight: 600;
              color: #4B5563;
              text-transform: uppercase;
              font-size: 10px;
            }
            tr:hover { background-color: #F9FAFB; }
            .amount { text-align: right; font-family: monospace; }
            .expense { color: #EF4444; }
            .payment { color: #10B981; }
            
            /* Status badges */
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 9px;
              font-weight: 600;
            }
            .badge-success { background: #D1FAE5; color: #059669; }
            .badge-warning { background: #FEF3C7; color: #D97706; }
            .badge-danger { background: #FEE2E2; color: #DC2626; }
            
            /* Category breakdown */
            .category-bar {
              background: #E5E7EB;
              height: 8px;
              border-radius: 4px;
              overflow: hidden;
              margin-top: 4px;
            }
            .category-fill {
              height: 100%;
              background: #6366F1;
              border-radius: 4px;
            }
            
            /* Footer */
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              text-align: center;
              color: #9CA3AF;
              font-size: 10px;
            }
            
            /* Progress bar */
            .progress-bar {
              background: #E5E7EB;
              height: 6px;
              border-radius: 3px;
              overflow: hidden;
              width: 80px;
            }
            .progress-fill {
              height: 100%;
              border-radius: 3px;
            }
            .progress-low { background: #10B981; }
            .progress-medium { background: #F59E0B; }
            .progress-high { background: #EF4444; }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <div>
              <span class="logo"><span class="logo-icon">💳</span> Card Go</span>
              <div style="color: #666; margin-top: 4px;">Laporan Keuangan Kartu Kredit</div>
            </div>
            <div class="report-info">
              <div class="report-date">${new Date().toLocaleDateString(
                "id-ID",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}</div>
              <div>${cards.length} Kartu • ${
      transactions.length
    } Transaksi</div>
            </div>
          </div>

          <!-- Summary -->
          <div class="summary-section">
            <div class="summary-card">
              <div class="summary-label">Total Limit</div>
              <div class="summary-value">${formatCurrency(totalLimit)}</div>
              <div class="summary-sub">${cards.length} kartu aktif</div>
            </div>
            <div class="summary-card ${
              usagePercentage > 80 ? "warning" : "success"
            }">
              <div class="summary-label">Penggunaan</div>
              <div class="summary-value">${formatCurrency(totalUsage)}</div>
              <div class="summary-sub">${usagePercentage.toFixed(
                1
              )}% dari total limit</div>
            </div>
            <div class="summary-card success">
              <div class="summary-label">Sisa Limit</div>
              <div class="summary-value">${formatCurrency(totalRemaining)}</div>
              <div class="summary-sub">Tersedia untuk digunakan</div>
            </div>
          </div>

          <!-- Cards Summary -->
          <h2>📊 Ringkasan Kartu</h2>
          <table>
            <tr>
              <th>Kartu</th>
              <th>Bank</th>
              <th class="amount">Limit</th>
              <th class="amount">Terpakai</th>
              <th class="amount">Sisa</th>
              <th>Penggunaan</th>
              <th>Status</th>
            </tr>
            ${cards
              .map((card) => {
                const usage =
                  card.creditLimit > 0
                    ? (card.currentUsage / card.creditLimit) * 100
                    : 0;
                const progressClass =
                  usage > 80
                    ? "progress-high"
                    : usage > 50
                    ? "progress-medium"
                    : "progress-low";
                const statusBadge = card.isPaid
                  ? '<span class="badge badge-success">Lunas</span>'
                  : usage > 80
                  ? '<span class="badge badge-danger">Tinggi</span>'
                  : '<span class="badge badge-success">Aman</span>';

                return `
                <tr>
                  <td><strong>${card.alias}</strong></td>
                  <td>${card.bankName}</td>
                  <td class="amount">${formatCurrency(card.creditLimit)}</td>
                  <td class="amount expense">${formatCurrency(
                    card.currentUsage
                  )}</td>
                  <td class="amount payment">${formatCurrency(
                    card.creditLimit - card.currentUsage
                  )}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${Math.min(
                  usage,
                  100
                )}%"></div>
                      </div>
                      <span>${usage.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td>${statusBadge}</td>
                </tr>
              `;
              })
              .join("")}
          </table>

          <!-- Top Categories -->
          ${
            sortedCategories.length > 0
              ? `
          <h2>📈 Pengeluaran per Kategori</h2>
          <table>
            <tr>
              <th>Kategori</th>
              <th class="amount">Total</th>
              <th style="width: 40%">Proporsi</th>
            </tr>
            ${sortedCategories
              .map(([category, amount]) => {
                const maxAmount = sortedCategories[0][1];
                const percentage = (amount / maxAmount) * 100;
                return `
                <tr>
                  <td><strong>${category}</strong></td>
                  <td class="amount">${formatCurrency(amount)}</td>
                  <td>
                    <div class="category-bar">
                      <div class="category-fill" style="width: ${percentage}%"></div>
                    </div>
                  </td>
                </tr>
              `;
              })
              .join("")}
          </table>
          `
              : ""
          }

          <!-- Recent Transactions -->
          <h2>📋 Transaksi Terakhir</h2>
          <table>
            <tr>
              <th>Tanggal</th>
              <th>Kartu</th>
              <th>Deskripsi</th>
              <th>Kategori</th>
              <th class="amount">Jumlah</th>
            </tr>
            ${recentTransactions
              .map((tx) => {
                const card = cards.find((c) => c.id === tx.cardId);
                const amountClass =
                  tx.type === "expense" ? "expense" : "payment";
                const prefix = tx.type === "expense" ? "-" : "+";

                // Handle multi-currency
                let amountDisplay = formatCurrency(tx.amount);
                if (tx.currency && tx.currency !== "IDR" && tx.originalAmount) {
                  amountDisplay = `${formatForeignCurrency(
                    tx.originalAmount,
                    tx.currency
                  )}<br><small style="color:#666">(${formatCurrency(
                    tx.amount
                  )})</small>`;
                }

                return `
                <tr>
                  <td>${new Date(tx.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}</td>
                  <td>${card?.alias || "-"}</td>
                  <td>${tx.description}</td>
                  <td>${tx.category}</td>
                  <td class="amount ${amountClass}">${prefix}${amountDisplay}</td>
                </tr>
              `;
              })
              .join("")}
          </table>

          <!-- Footer -->
          <div class="footer">
            <p>Laporan ini dibuat secara otomatis oleh Card Go</p>
            <p>Data bersifat pribadi dan tersimpan hanya di perangkat Anda</p>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  },

  async exportToCSV(cards: Card[], transactions: Transaction[]) {
    try {
      let csv =
        "Tanggal,Kartu,Bank,Deskripsi,Kategori,Mata Uang,Jumlah Asli,Jumlah IDR\n";

      transactions.forEach((tx) => {
        const card = cards.find((c) => c.id === tx.cardId);
        const row = [
          new Date(tx.date).toISOString().split("T")[0],
          `"${card?.alias || "-"}"`,
          `"${card?.bankName || "-"}"`,
          `"${tx.description.replace(/"/g, '""')}"`,
          `"${tx.category}"`,
          tx.currency || "IDR",
          tx.originalAmount || tx.amount,
          tx.amount,
        ].join(",");
        csv += row + "\n";
      });

      const fileName = `card_go_export_${new Date().getTime()}.csv`;

      // Use new expo-file-system API
      const file = new FileSystem.File(FileSystem.Paths.cache, fileName);
      await file.write(csv);

      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Export CSV",
        UTI: "public.comma-separated-values-text",
      });
    } catch (error) {
      console.error("CSV Export Error:", error);
      throw error;
    }
  },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatForeignCurrency = (amount: number, currency: string) => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    SGD: "S$",
    JPY: "¥",
    AUD: "A$",
    MYR: "RM",
    THB: "฿",
  };
  return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
};
