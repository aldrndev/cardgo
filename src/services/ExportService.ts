import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { Card, Transaction } from "../types/card";

export const ExportService = {
  async exportToPDF(cards: Card[], transactions: Transaction[]) {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
            h1 { color: #231F7C; }
            h2 { color: #444; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .amount { text-align: right; }
            .danger { color: red; }
          </style>
        </head>
        <body>
          <h1>Laporan Card Go</h1>
          <p>Tanggal: ${new Date().toLocaleDateString("id-ID")}</p>

          <h2>Ringkasan Kartu</h2>
          <table>
            <tr>
              <th>Kartu</th>
              <th>Bank</th>
              <th>Limit</th>
              <th>Terpakai</th>
              <th>Sisa</th>
            </tr>
            ${cards
              .map(
                (card) => `
              <tr>
                <td>${card.alias}</td>
                <td>${card.bankName}</td>
                <td class="amount">${formatCurrency(card.creditLimit)}</td>
                <td class="amount">${formatCurrency(card.currentUsage)}</td>
                <td class="amount">${formatCurrency(
                  card.creditLimit - card.currentUsage
                )}</td>
              </tr>
            `
              )
              .join("")}
          </table>

          <h2>Transaksi Terakhir</h2>
          <table>
            <tr>
              <th>Tanggal</th>
              <th>Kartu</th>
              <th>Deskripsi</th>
              <th>Kategori</th>
              <th>Jumlah</th>
            </tr>
            ${transactions
              .slice(0, 50) // Limit to last 50 for PDF readability
              .map((tx) => {
                const card = cards.find((c) => c.id === tx.cardId);
                return `
              <tr>
                <td>${new Date(tx.date).toLocaleDateString("id-ID")}</td>
                <td>${card?.alias || "-"}</td>
                <td>${tx.description}</td>
                <td>${tx.category}</td>
                <td class="amount">${formatCurrency(tx.amount)}</td>
              </tr>
            `;
              })
              .join("")}
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  },

  async exportToCSV(cards: Card[], transactions: Transaction[]) {
    try {
      let csv = "Tanggal,Kartu,Deskripsi,Kategori,Jumlah\n";

      transactions.forEach((tx) => {
        const card = cards.find((c) => c.id === tx.cardId);
        const row = [
          new Date(tx.date).toISOString().split("T")[0],
          `"${card?.alias || "-"}"`,
          `"${tx.description.replace(/"/g, '""')}"`,
          `"${tx.category}"`,
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
  }).format(amount);
};
