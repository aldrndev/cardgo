export const CATEGORIES = [
  "Makanan & Minuman",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Tagihan",
  "Kesehatan",
  "Pendidikan",
  "Lainnya",
];

const CATEGORY_RULES: Record<string, RegExp> = {
  "Makanan & Minuman":
    /kopi|coffee|starbucks|mcd|kfc|burger|pizza|restoran|warung|makan|food|grabfood|gofood|shopeefood/i,
  Transportasi:
    /grab|gojek|uber|taxi|bluebird|bensin|pertamina|shell|parkir|tol|kereta|kai|mrt|busway|transjakarta/i,
  Belanja:
    /tokopedia|shopee|lazada|blibli|zalora|uniqlo|h&m|zara|supermarket|alfamart|indomaret|hypermart|carrefour/i,
  Hiburan:
    /netflix|spotify|youtube|bioskop|xxi|cgv|steam|playstation|game|disney/i,
  Tagihan:
    /pln|listrik|air|pdam|telkom|indihome|biznet|firstmedia|pulsa|paket data|asuransi|bpjs/i,
  Kesehatan: /apotek|dokter|rumahsakit|siloam|halodoc|alodokter/i,
  Pendidikan: /udemy|coursera|ruangguru|sekolah|kampus|buku|gramedia/i,
};

export const categorizeTransaction = (description: string): string => {
  for (const [category, regex] of Object.entries(CATEGORY_RULES)) {
    if (regex.test(description)) {
      return category;
    }
  }
  return "Lainnya";
};
