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

export const TermsScreen = () => {
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
        <Text style={styles.title}>Syarat & Ketentuan</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Introduction */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="document-text"
                size={32}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Ketentuan Penggunaan</Text>
          </View>
          <Text style={styles.text}>
            Selamat datang di <Text style={styles.bold}>Card Go</Text>. Dengan
            mengunduh, menginstall, atau menggunakan aplikasi ini, Anda
            menyetujui untuk terikat oleh Syarat dan Ketentuan berikut.
          </Text>
          <Text style={styles.text}>
            Harap baca dengan seksama sebelum menggunakan aplikasi. Jika Anda
            tidak setuju dengan ketentuan ini, mohon untuk tidak menggunakan
            aplikasi Card Go.
          </Text>
        </View>

        {/* Penerimaan Ketentuan */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>1. Penerimaan Ketentuan</Text>
          </View>
          <Text style={styles.text}>
            Dengan menggunakan Card Go, Anda menyatakan bahwa:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Anda telah membaca dan memahami Syarat & Ketentuan ini" />
            <BulletPoint text="Anda berusia minimal 17 tahun atau memiliki izin orang tua/wali" />
            <BulletPoint text="Anda memiliki hak legal untuk menggunakan aplikasi ini" />
            <BulletPoint text="Anda setuju untuk menggunakan aplikasi sesuai dengan ketentuan yang berlaku" />
          </View>
        </View>

        {/* Penggunaan yang Diizinkan */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>
              2. Penggunaan yang Diizinkan
            </Text>
          </View>
          <Text style={styles.text}>Card Go dirancang untuk:</Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Pelacakan kartu kredit pribadi (personal financial tracking)" />
            <BulletPoint text="Manajemen tagihan dan pengingat jatuh tempo" />
            <BulletPoint text="Pencatatan transaksi dan pengeluaran personal" />
            <BulletPoint text="Penggunaan non-komersial dan pribadi" />
          </View>
          <Text style={styles.text}>
            Anda <Text style={styles.bold}>TIDAK DIIZINKAN</Text> untuk:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint
              text="Menggunakan aplikasi untuk tujuan ilegal atau melanggar hukum"
              isDanger
            />
            <BulletPoint
              text="Melakukan reverse engineering, decompile, atau disassemble aplikasi"
              isDanger
            />
            <BulletPoint
              text="Menjual, menyewakan, atau mendistribusikan aplikasi tanpa izin"
              isDanger
            />
            <BulletPoint
              text="Menggunakan aplikasi untuk keperluan komersial tanpa lisensi"
              isDanger
            />
            <BulletPoint
              text="Memodifikasi atau membuat karya turunan dari aplikasi"
              isDanger
            />
          </View>
        </View>

        {/* Disclaimer */}
        <View style={[styles.section, styles.warningSection]}>
          <View style={styles.iconHeader}>
            <View style={[styles.iconContainer, styles.warningIconContainer]}>
              <Ionicons
                name="warning-outline"
                size={28}
                color={theme.colors.status.warning}
              />
            </View>
            <Text style={[styles.sectionTitle, styles.warningTitle]}>
              3. Disclaimer (Penafian)
            </Text>
          </View>
          <Text style={styles.text}>
            <Text style={styles.bold}>PENTING:</Text> Card Go adalah alat
            tracking pribadi dan <Text style={styles.bold}>BUKAN</Text> aplikasi
            resmi dari bank atau lembaga keuangan manapun.
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Aplikasi ini TIDAK terafiliasi dengan bank atau penerbit kartu kredit" />
            <BulletPoint text="Data dalam aplikasi adalah input manual oleh Anda dan mungkin tidak akurat" />
            <BulletPoint text="Selalu merujuk pada statement resmi bank untuk informasi tagihan yang akurat" />
            <BulletPoint text="Aplikasi tidak dapat mengakses data kartu kredit Anda dari bank" />
            <BulletPoint text="Notifikasi dan pengingat hanya bersifat bantuan, bukan pengganti kalender pribadi" />
          </View>
        </View>

        {/* Batasan Tanggung Jawab */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>4. Batasan Tanggung Jawab</Text>
          </View>
          <Text style={styles.text}>
            Card Go disediakan{" "}
            <Text style={styles.bold}>"SEBAGAIMANA ADANYA"</Text> (AS-IS) tanpa
            jaminan dalam bentuk apapun.
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Developer tidak bertanggung jawab atas kesalahan perhitungan atau data yang tidak akurat" />
            <BulletPoint text="Developer tidak liable untuk kerugian finansial akibat keterlambatan pembayaran" />
            <BulletPoint text="Developer tidak menjamin aplikasi bebas dari bug atau error" />
            <BulletPoint text="Developer tidak bertanggung jawab atas kehilangan data akibat kerusakan perangkat atau uninstall" />
          </View>
          <Text style={[styles.text, styles.boldText]}>
            Anda bertanggung jawab penuh atas:
          </Text>
          <View style={styles.bulletList}>
            <BulletPoint text="Keamanan perangkat Anda (PIN, biometric, lock screen)" />
            <BulletPoint text="Akurasi data yang Anda input" />
            <BulletPoint text="Backup data secara berkala" />
            <BulletPoint text="Pembayaran tagihan kartu kredit tepat waktu" />
          </View>
        </View>

        {/* Keakuratan Data */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="create-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>5. Keakuratan Data</Text>
          </View>
          <Text style={styles.text}>
            Anda bertanggung jawab untuk memastikan bahwa semua informasi yang
            Anda masukkan ke dalam aplikasi adalah akurat dan up-to-date.
          </Text>
          <Text style={styles.text}>
            Card Go tidak memiliki kemampuan untuk memverifikasi keakuratan data
            yang Anda input. Developer tidak bertanggung jawab atas konsekuensi
            dari data yang salah atau ketinggalan informasi.
          </Text>
        </View>

        {/* Hak Cipta */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="business-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>6. Hak Cipta & Kepemilikan</Text>
          </View>
          <Text style={styles.text}>
            <Text style={styles.bold}>© 2025 Card Go.</Text> All rights
            reserved.
          </Text>
          <Text style={styles.text}>
            Aplikasi Card Go, termasuk namun tidak terbatas pada kode sumber,
            desain UI/UX, logo, dan konten adalah milik eksklusif developer.
          </Text>
          <Text style={styles.text}>
            Aplikasi ini menggunakan beberapa library open-source yang
            dilisensikan di bawah lisensi mereka masing-masing (React Native,
            Expo, dll). Lisensi tersebut tersedia dalam dokumentasi teknis
            aplikasi.
          </Text>
        </View>

        {/* Privasi */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>7. Privasi Data</Text>
          </View>
          <Text style={styles.text}>
            Penggunaan data Anda diatur oleh{" "}
            <Text style={styles.bold}>Kebijakan Privasi</Text> kami yang
            terpisah.
          </Text>
          <Text style={styles.text}>
            Dengan menggunakan aplikasi ini, Anda menyetujui praktik pengumpulan
            dan penggunaan data sebagaimana dijelaskan dalam Kebijakan Privasi.
          </Text>
          <Text style={styles.text}>
            Ringkasan: Semua data disimpan lokal di perangkat Anda. Kami tidak
            mengumpulkan, mengirim, atau menyimpan data Anda di server.
          </Text>
        </View>

        {/* Perubahan Ketentuan */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="refresh-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>8. Perubahan Ketentuan</Text>
          </View>
          <Text style={styles.text}>
            Kami berhak untuk mengubah, memodifikasi, atau memperbarui Syarat &
            Ketentuan ini kapan saja tanpa pemberitahuan sebelumnya.
          </Text>
          <Text style={styles.text}>
            Perubahan akan berlaku segera setelah dipublikasikan dalam update
            aplikasi. Penggunaan aplikasi setelah perubahan berarti Anda
            menerima ketentuan yang baru.
          </Text>
          <Text style={styles.text}>
            Anda disarankan untuk memeriksa halaman ini secara berkala untuk
            mengetahui perubahan terbaru.
          </Text>
        </View>

        {/* Penghentian Layanan */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="power-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>9. Penghentian</Text>
          </View>
          <Text style={styles.text}>
            Kami berhak untuk menghentikan atau menangguhkan akses Anda ke
            aplikasi tanpa pemberitahuan sebelumnya jika Anda melanggar Syarat &
            Ketentuan ini.
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Catatan:</Text> Karena Card Go adalah
            aplikasi offline tanpa akun pengguna, "penghentian" berarti Anda
            tidak lagi memiliki hak untuk menggunakan aplikasi dan harus
            menghapusnya dari perangkat Anda.
          </Text>
        </View>

        {/* Hukum yang Berlaku */}
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="hammer-outline"
                size={28}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>10. Hukum yang Berlaku</Text>
          </View>
          <Text style={styles.text}>
            Syarat & Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum
            yang berlaku di Republik Indonesia.
          </Text>
          <Text style={styles.text}>
            Setiap perselisihan yang timbul dari atau terkait dengan Syarat &
            Ketentuan ini akan diselesaikan melalui mediasi atau arbitrase
            sesuai dengan hukum Indonesia.
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
            Jika Anda memiliki pertanyaan tentang Syarat & Ketentuan ini,
            silakan hubungi kami:
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
          <View style={styles.acknowledgement}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.colors.status.success}
            />
            <Text style={styles.acknowledgementText}>
              Dengan menggunakan Card Go, Anda menyetujui Syarat & Ketentuan
              ini.
            </Text>
          </View>
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
    warningSection: {
      backgroundColor: theme.colors.status.warning + "08",
      borderWidth: 1,
      borderColor: theme.colors.status.warning + "30",
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
    warningIconContainer: {
      backgroundColor: theme.colors.status.warning + "15",
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.text.primary,
      flex: 1,
    },
    warningTitle: {
      color: theme.colors.status.warning,
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
    boldText: {
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
    acknowledgement: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
    },
    acknowledgementText: {
      ...theme.typography.body,
      color: theme.colors.status.success,
      fontWeight: "500",
      marginLeft: theme.spacing.s,
      flex: 1,
      textAlign: "center",
    },
  });
