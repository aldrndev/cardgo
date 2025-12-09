import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme, Theme } from "../context/ThemeContext";

export const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();

  // Dynamic styles based on theme
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Bullet Point Component (defined inside to access styles)
  const BulletPoint = ({
    text,
    isDanger = false,
  }: {
    text: string;
    isDanger?: boolean;
  }) => (
    <View style={styles.bulletItem}>
      <Text style={[styles.bullet, isDanger && styles.dangerBullet]}>•</Text>
      <Text style={[styles.bulletText, isDanger && styles.dangerText]}>
        {text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Kebijakan Privasi</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Introduction */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="shield-checkmark"
                size={32}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Komitmen Kami</Text>
          </View>
          <Text style={styles.text}>
            Card Go adalah aplikasi{" "}
            <Text style={styles.bold}>offline-first</Text> yang dirancang dengan
            prinsip <Text style={styles.bold}>Privacy First</Text>. Kami
            berkomitmen untuk melindungi privasi dan keamanan data finansial
            Anda.
          </Text>
          <Text style={styles.text}>
            Kebijakan Privasi ini menjelaskan bagaimana kami menangani data
            Anda, apa yang kami simpan, dan apa yang{" "}
            <Text style={styles.bold}>TIDAK PERNAH</Text> kami simpan atau
            kirimkan.
          </Text>
        </View>

        {/* Data yang Disimpan */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="folder-open-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Data yang Disimpan</Text>
          </View>
          <Text style={styles.text}>
            Semua data berikut disimpan{" "}
            <Text style={styles.bold}>secara lokal</Text> di perangkat Anda
            menggunakan AsyncStorage (React Native):
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Metadata kartu kredit (nama bank, alias, brand kartu)" />
            <BulletPoint text="Informasi keuangan (limit kredit, total tagihan, minimum payment)" />
            <BulletPoint text="Siklus tagihan (billing date, due date)" />
            <BulletPoint text="4 digit terakhir kartu (opsional, jika Anda input)" />
            <BulletPoint text="Transaksi (tanggal, jumlah, kategori, deskripsi)" />
            <BulletPoint text="Langganan berulang (nama, jumlah, tanggal tagihan)" />
            <BulletPoint text="Rencana cicilan" />
            <BulletPoint text="Riwayat pengajuan kenaikan limit" />
            <BulletPoint text="Preferensi notifikasi" />
            <BulletPoint text="Catatan pribadi untuk setiap kartu" />
          </View>
        </View>

        {/* Data yang TIDAK Disimpan */}
        <View style={[styles.section, styles.dangerSection]}>
          <View style={styles.iconHeader}>
            <View style={[styles.iconContainer, styles.dangerIconContainer]}>
              <Ionicons
                name="close-circle"
                size={28}
                color={theme.colors.status.error}
              />
            </View>
            <Text style={[styles.sectionTitle, styles.dangerTitle]}>
              Data yang TIDAK PERNAH Disimpan
            </Text>
          </View>
          <Text style={styles.text}>
            Untuk keamanan Anda, aplikasi ini{" "}
            <Text style={styles.bold}>secara tegas melarang</Text> dan{" "}
            <Text style={styles.bold}>tidak menyimpan</Text> informasi sensitif
            berikut:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint
              text="Nomor kartu kredit lengkap (16 digit)"
              isDanger
            />
            <BulletPoint
              text="CVV/CVC (3 atau 4 digit di belakang kartu)"
              isDanger
            />
            <BulletPoint text="PIN kartu kredit" isDanger />
            <BulletPoint text="Tanggal kadaluarsa kartu" isDanger />
            <BulletPoint
              text="Password e-banking atau mobile banking"
              isDanger
            />
            <BulletPoint text="OTP (One-Time Password)" isDanger />
            <BulletPoint text="3D Secure password" isDanger />
          </View>
          <Text style={[styles.text, styles.warningText]}>
            ⚠️ <Text style={styles.bold}>Peringatan:</Text> Jangan pernah
            memasukkan data sensitif di atas di kolom catatan atau alias kartu.
            Aplikasi akan menolak penyimpanan jika mendeteksi input angka lebih
            dari 4 digit di field tertentu.
          </Text>
        </View>

        {/* Penyimpanan Lokal */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="phone-portrait-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Penyimpanan 100% Lokal</Text>
          </View>
          <Text style={styles.text}>
            <Text style={styles.bold}>
              Semua data Anda tersimpan hanya di perangkat Anda.
            </Text>{" "}
            Tidak ada data yang dikirim ke server kami atau pihak ketiga
            manapun.
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Tidak ada koneksi internet yang diperlukan" />
            <BulletPoint text="Tidak ada sinkronisasi cloud" />
            <BulletPoint text="Tidak ada transmisi data keluar perangkat" />
            <BulletPoint text="Data terenkripsi oleh sistem operasi perangkat Anda" />
          </View>
          <Text style={styles.text}>
            Jika Anda menghapus aplikasi, semua data akan terhapus permanen dari
            perangkat Anda.
          </Text>
        </View>

        {/* Keamanan */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Fitur Keamanan</Text>
          </View>
          <Text style={styles.text}>
            Card Go menyediakan fitur keamanan tambahan untuk melindungi data
            Anda:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="PIN Lock: Kunci aplikasi dengan 6-digit PIN" />
            <BulletPoint text="Biometric Authentication: Login dengan FaceID/TouchID (jika didukung perangkat)" />
            <BulletPoint text="Backup Terenkripsi: Export data ke file JSON yang dapat di-restore" />
          </View>
        </View>

        {/* Hak Pengguna */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="person-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Hak Anda atas Data</Text>
          </View>
          <Text style={styles.text}>
            Sebagai pengguna Card Go, Anda memiliki kendali penuh atas data
            Anda:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Hak Akses: Lihat semua data Anda kapan saja melalui aplikasi" />
            <BulletPoint text="Hak Export: Export data dalam format JSON, CSV, atau PDF" />
            <BulletPoint text="Hak Portabilitas: Pindahkan data Anda ke perangkat lain via backup file" />
            <BulletPoint text="Hak Penghapusan: Hapus semua data permanen melalui Settings > Hapus Semua Data" />
          </View>
        </View>

        {/* Third-Party Services */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="people-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Layanan Pihak Ketiga</Text>
          </View>
          <Text style={styles.text}>
            Card Go <Text style={styles.bold}>TIDAK menggunakan</Text> layanan
            berikut:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint
              text="Analytics atau tracking tools (Google Analytics, Firebase Analytics, dll)"
              isDanger
            />
            <BulletPoint text="Iklan atau ad networks" isDanger />
            <BulletPoint text="Social media integration" isDanger />
            <BulletPoint text="Crash reporting dengan data pribadi" isDanger />
          </View>
          <Text style={styles.text}>
            Aplikasi ini sepenuhnya{" "}
            <Text style={styles.bold}>
              offline dan tidak berkomunikasi dengan server eksternal
            </Text>
            .
          </Text>
        </View>

        {/* Anak di Bawah Umur */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="shield-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Pengguna di Bawah Umur</Text>
          </View>
          <Text style={styles.text}>
            Card Go dirancang untuk pengguna yang memiliki kartu kredit, yang
            umumnya berusia 17+ tahun atau sesuai dengan ketentuan bank penerbit
            kartu.
          </Text>
          <Text style={styles.text}>
            Karena aplikasi tidak mengumpulkan data pribadi atau mengirim data
            ke server, tidak ada risiko privasi khusus untuk pengguna muda yang
            mungkin menggunakan aplikasi ini untuk membantu melacak kartu kredit
            keluarga.
          </Text>
        </View>

        {/* Perubahan Kebijakan */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="refresh-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Perubahan Kebijakan Privasi</Text>
          </View>
          <Text style={styles.text}>
            Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu
            untuk mencerminkan perubahan pada praktik kami atau untuk alasan
            operasional, hukum, atau regulasi lainnya.
          </Text>
          <Text style={styles.text}>
            Perubahan akan diinformasikan melalui update notes saat Anda
            mengupdate aplikasi. Versi terbaru selalu tersedia di menu Settings{" "}
            {"->"} Kebijakan Privasi.
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="mail-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Hubungi Kami</Text>
          </View>
          <Text style={styles.text}>
            Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini atau
            praktik privasi kami, silakan hubungi kami melalui:
          </Text>
          <Text style={styles.contactText}>
            📧 Email: digitesiaedge@gmail.com
          </Text>
          <Text style={styles.contactText}>
            🌐 Website: https://digitesia.com
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Terakhir diperbarui: Desember 2025
          </Text>
          <Text style={styles.footerText}>Card Go v1.2.0</Text>
          <Text style={[styles.footerText, styles.boldFooter]}>
            Privasi Anda adalah prioritas kami. 🔒
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backButton: {
      padding: theme.spacing.s,
    },
    placeholder: {
      width: 40,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.text.primary,
      flex: 1,
      textAlign: "center",
    },
    content: {
      padding: theme.spacing.m,
      paddingBottom: 100,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.l,
      marginBottom: theme.spacing.m,
      ...theme.shadows.small,
    },
    dangerSection: {
      backgroundColor: theme.colors.status.error + "08",
      borderWidth: 1,
      borderColor: theme.colors.status.error + "30",
    },
    iconHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.m,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.m,
    },
    dangerIconContainer: {
      backgroundColor: theme.colors.status.error + "15",
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      flex: 1,
    },
    dangerTitle: {
      color: theme.colors.status.error,
    },
    text: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      lineHeight: 24,
      marginBottom: theme.spacing.m,
    },
    bold: {
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    bulletList: {
      marginVertical: theme.spacing.s,
    },
    bulletItem: {
      flexDirection: "row",
      marginBottom: theme.spacing.s,
      paddingLeft: theme.spacing.s,
    },
    bullet: {
      ...theme.typography.body,
      color: theme.colors.primary,
      marginRight: theme.spacing.s,
      fontWeight: "bold",
      fontSize: 18,
    },
    dangerBullet: {
      color: theme.colors.status.error,
    },
    bulletText: {
      ...theme.typography.body,
      color: theme.colors.text.secondary,
      flex: 1,
      lineHeight: 22,
    },
    dangerText: {
      color: theme.colors.status.error,
      fontWeight: "500",
    },
    warningText: {
      backgroundColor: theme.colors.status.warning + "15",
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.s,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.status.warning,
      color: theme.colors.text.primary,
    },
    contactText: {
      ...theme.typography.body,
      color: theme.colors.primary,
      marginBottom: theme.spacing.s,
      fontWeight: "500",
    },
    footer: {
      marginTop: theme.spacing.l,
      paddingTop: theme.spacing.l,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      alignItems: "center",
    },
    footerText: {
      ...theme.typography.caption,
      color: theme.colors.text.tertiary,
      marginBottom: theme.spacing.xs,
      textAlign: "center",
    },
    boldFooter: {
      ...theme.typography.body,
      fontWeight: "600",
      color: theme.colors.primary,
      marginTop: theme.spacing.s,
    },
  });
