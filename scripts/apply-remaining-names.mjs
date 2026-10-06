/**
 * apply-remaining-names.mjs
 * Melakukan penggantian nama-nama dummy yang tersisa di seluruh file demo:
 * Mengganti ke nama ekosistem resmi:
 * Arzhaning, Arzha, Radit, Zannah, Rajendra
 *
 * Menggunakan string replacement eksak agar aman dari korupsi base64.
 */

import fs from 'fs';
import path from 'path';

const demosDir = 'c:/Project Apps/personal-portfolio/public/demos';

const replacements = {
  // 1. ATELIER KINETIK
  'demo-atelier-kinetik.html': [
    ['placeholder="Contoh: Sarah Azhari"', 'placeholder="Contoh: Zannah Azhari"'],
    ['artist: "Bayu Kurnia (ToyLab)"', 'artist: "Radit Kurnia (ToyLab)"'],
    ['placeholder="Contoh: 08123456789"', 'placeholder="Contoh: 0823-1231-2734"'],
  ],

  // 2. ATELIER NISKALA
  'demo-atelier-niskala.html': [
    ['placeholder="Contoh: 08123456789"', 'placeholder="Contoh: 0823-1231-2734"'],
  ],

  // 3. BENGKEL AUTOFIX
  'demo-bengkel-autofix.html': [
    ['mechanic: \'Bambang Susanto (BNSP #4891)\'', 'mechanic: \'Rajendra Susanto (BNSP #4891)\''],
    ['owner: \'Ahmad Faisal\'', 'owner: \'Radit Faisal\''],
    ['owner: \'dr. Sarah Melinda\'', 'owner: \'dr. Zannah Melinda\''],
    ['mechanic: \'Didik Wahyudi (Kelistrikan & AC)\'', 'mechanic: \'Rajendra Wahyudi (Kelistrikan & AC)\''],
    ['mechanic: \'Agus Setiawan (Kepala Regu Mekanik)\'', 'mechanic: \'Rajendra Setiawan (Kepala Regu Mekanik)\''],
    ['placeholder="Contoh: 08123456789"', 'placeholder="Contoh: 0823-1231-2734"'],
  ],

  // 4. BIMBEL GENIUS
  'demo-bimbel-genius.html': [
    ['<div class="text-xs font-bold text-neutral-900 dark:text-white">Amanda Putri Maharani</div>', '<div class="text-xs font-bold text-neutral-900 dark:text-white">Zannah Putri Maharani</div>'],
    ['<div class="text-xs font-bold text-neutral-900 dark:text-white">Rafi Alamsyah</div>', '<div class="text-xs font-bold text-neutral-900 dark:text-white">Radit Alamsyah</div>'],
    ['placeholder="Contoh: Muhammad Farhan"', 'placeholder="Contoh: Radit Pratama"'],
  ],

  // 5. BREWSPACE POS
  'demo-brewspace-pos.html': [
    ['Kasir: <span class="text-amber-300 font-medium">Rian</span>', 'Kasir: <span class="text-amber-300 font-medium">Radit</span>'],
    ['Meja 02 - Aris', 'Meja 02 - Arzha'],
  ],

  // 6. EKSPEDISI NUSANTARA
  'demo-ekspedisi-nusantara.html': [
    ['Driver: <strong>Bambang S. (NIP: 8821)</strong>', 'Driver: <strong>Rajendra S. (NIP: 8821)</strong>'],
    ['placeholder="Contoh: Arzhaning Santoso / Toko Budi Abadi"', 'placeholder="Contoh: Arzhaning Jagad / Toko Rajendra Abadi"'],
    ['driver: \'Bambang S. (NIP: 8821) · Truk Isuzu Box\'', 'driver: \'Rajendra S. (NIP: 8821) · Truk Isuzu Box\''],
    ['desc: \'Paket berhasil diterima oleh: Ibu Dewi (Penerima Asli).', 'desc: \'Paket berhasil diterima oleh: Ibu Zannah (Penerima Asli).'],
    ['driver: \'Kurir Pengantar: Ahmad Solihin\'', 'driver: \'Kurir Pengantar: Radit Solihin\''],
    ['0811-3322-1100', '0823-1231-2734'],
  ],

  // 7. GALERI SENI
  'demo-galeri-seni.html': [
    ['Kurator: Hendro Wiyanto', 'Kurator: Rajendra Wiyanto'],
    ['<span class="font-serif font-semibold text-[#121212] text-sm block">Bambang Bujono</span>', '<span class="font-serif font-semibold text-[#121212] text-sm block">Rajendra Bujono</span>'],
    ['<span class="font-serif font-semibold text-[#121212] text-sm block">Hendro Wiyanto</span>', '<span class="font-serif font-semibold text-[#121212] text-sm block">Rajendra Wiyanto</span>'],
  ],

  // 8. GYM TITAN
  'demo-gym-titan.html': [
    ['alt="Siti Amelia"', 'alt="Zannah Amelia"'],
    ['<div class="font-bold text-slate-900 dark:text-white text-sm">Siti Amelia</div>', '<div class="font-bold text-slate-900 dark:text-white text-sm">Zannah Amelia</div>'],
    ['placeholder="Contoh: Dimas Aditya"', 'placeholder="Contoh: Radit Aditya"'],
    ['placeholder="Contoh: 08123456789"', 'placeholder="Contoh: 0823-1231-2734"'],
  ],

  // 9. KLINIK ESTETIKA
  'demo-klinik-estetika.html': [
    ['Reza Pramudya', 'Radit Pramudya'],
  ],

  // 10. KLINIK GIGI
  'demo-klinik-gigi.html': [
    ['placeholder="Contoh: 08123456789"', 'placeholder="Contoh: 0823-1231-2734"'],
  ],

  // 11. KOSHARMONY PORTAL
  'demo-kosharmony-portal.html': [
    ['saya%20Rendy%20Kamar%20204', 'saya%20Radit%20Kamar%20204'],
    ['CS Pengelola (Pak Hendra)', 'CS Pengelola (Pak Rajendra)'],
    ['Oleh: Pak Hendra (Manajer Operasional)', 'Oleh: Pak Rajendra (Manajer Operasional)'],
    ['Teknisi Ditugaskan: Pak Joko', 'Teknisi Ditugaskan: Pak Radit'],
    ['Pak Hendra (Pengelola Kos)', 'Pak Rajendra (Pengelola Kos)'],
    ['Pak Joko (Teknisi / Keamanan)', 'Pak Radit (Teknisi / Keamanan)'],
    ['0813-9876-5432', '0823-1231-2734'],
    ['081398765432', '082312312734'],
    ['0821-7788-9900', '0823-1231-2734'],
  ],

  // 12. KOSPRO MANAGER
  'demo-kospro-manager.html': [
    ['Fajar Nugraha', 'Radit Nugraha'],
    ['Fajar+Nugraha', 'Radit+Nugraha'],
    ['Nadia Putri', 'Zannah Putri'],
    ['Nadia+Putri', 'Zannah+Putri'],
    ['Rizky Fauzi', 'Arzha Fauzi'],
    ['Rizky+Fauzi', 'Arzha+Fauzi'],
    ['Ryan Pratama', 'Radit Pratama'],
    ['Sarah Melati', 'Zannah Melati'],
    ['Sarah+Melati', 'Zannah+Melati'],
    ['Pak Joko (Teknisi AC Berlangganan)', 'Pak Rajendra (Teknisi AC Berlangganan)'],
    ['Halo%20Pak%20Joko', 'Halo%20Pak%20Rajendra'],
    ['0812-9988-7766', '0823-1231-2734'],
    ['081987654321', '082312312734'],
    ['0857-1122-3344', '0823-1231-2734'],
    ['081234567891', '082312312734'],
    ['081234567892', '082312312734'],
    ['081234567895', '082312312734'],
    ['081234567897', '082312312734'],
    ['081234567898', '082312312734'],
    ['0812-3456-7891', '0823-1231-2734'],
    ['0812-3456-7892', '0823-1231-2734'],
    ['0812-3456-7895', '0823-1231-2734'],
    ['0819-8765-4321', '0823-1231-2734'],
    ['0812-3456-7897', '0823-1231-2734'],
    ['0812-3456-7898', '0823-1231-2734'],
    ['placeholder="Contoh: 08123456789"', 'placeholder="Contoh: 0823-1231-2734"'],
  ],

  // 13. KOSPRO SUITE
  'demo-kospro-suite.html': [
    ['Fajar Nugraha', 'Radit Nugraha'],
    ['alt="Fajar"', 'alt="Radit"'],
    ['alt="Sarah"', 'alt="Zannah"'],
    ['Nadia Putri', 'Zannah Putri'],
    ['Rizky Fauzi', 'Arzha Fauzi'],
    ['Pak Joko (Teknisi AC)', 'Pak Rajendra (Teknisi AC)'],
    ['6281987654321', '6282312312734'],
    ['0857-1122-3344', '0823-1231-2734'],
    ['6281234567891', '6282312312734'],
    ['6281234567892', '6282312312734'],
    ['6281234567895', '6282312312734'],
    ['6281234567897', '6282312312734'],
    ['6281234567898', '6282312312734'],
  ],

  // 14. LANDING PENULIS
  'demo-landing-penulis.html': [
    ['Saraswati D.', 'Zannah D.'],
    ['alt="Saraswati"', 'alt="Zannah"'],
    ['Reza Fahrezi', 'Radit Fahrezi'],
    ['alt="Reza"', 'alt="Radit"'],
    ['Amanda Lathifah', 'Zannah Lathifah'],
    ['alt="Amanda"', 'alt="Zannah"'],
  ],

  // 15. LAUNDRY BENING
  'demo-laundry-bening.html': [
    ['placeholder="Contoh: Ibu Rina / Kak Kevin"', 'placeholder="Contoh: Ibu Zannah / Kak Radit"'],
    ['nama: \'Kak Sarah Amanda\'', 'nama: \'Kak Zannah Amanda\''],
    ['kurir: \'Mas Budi (Kurir Express)\'', 'kurir: \'Mas Radit (Kurir Express)\''],
  ],

  // 16. MARTEXPRESS POS
  'demo-martexpress-pos.html': [
    ['name: \'Siti Nurhaliza\'', 'name: \'Zannah Nurhaliza\''],
    ['name: \'Ahmad Fauzi\'', 'name: \'Radit Fauzi\''],
    ['cashier: \'Dewi (POS-01)\'', 'cashier: \'Zannah (POS-01)\''],
    ['Shift Kasir Dewi aktif', 'Shift Kasir Zannah aktif'],
  ],

  // 17. PETSHOP PAW CLAW
  'demo-petshop-paw-claw.html': [
    ['drh.%20Farhan', 'drh.%20Radit'],
    ['drh.%20Anindya', 'drh.%20Zannah'],
    ['Bima Satrio', 'Radit Satrio'],
    ['Nathania Putri', 'Zannah Putri'],
    ['Clarissa Rahardjo', 'Zannah Rahardjo'],
  ],

  // 18. SALON AURA GLOW
  'demo-salon-aura-glow.html': [
    ['placeholder="Contoh: Cantika Putri"', 'placeholder="Contoh: Zannah Cantika"'],
  ],

  // 19. THREADPOS
  'demo-threadpos.html': [
    ['Kasir: Zannah Dewi', 'Kasir: Zannah Jagad'],
    ['<span>Zannah Dewi (01)</span>', '<span>Zannah Jagad (01)</span>'],
    ['<span class="font-bold text-slate-800">Zannah Dewi</span>', '<span class="font-bold text-slate-800">Zannah Jagad</span>'],
    ['cashierName: \'Zannah Dewi\'', 'cashierName: \'Zannah Jagad\''],
    ['value="Jessica Tan"', 'value="Zannah Tan"'],
    ['Jessica Tan (SILVER)', 'Zannah Tan (SILVER)'],
  ],

  // 20. TOKO KUE SWEET DELIGHT
  'demo-toko-kue-sweet-delight.html': [
    ['placeholder="Contoh: Sarah Angelina"', 'placeholder="Contoh: Zannah Angelina"'],
    ['placeholder="Contoh: \'Happy 25th Birthday Sarah!\' / Angka: 25"', 'placeholder="Contoh: \'Happy 25th Birthday Zannah!\' / Angka: 25"'],
  ],

  // 21. WEBSITE PENULIS MANDIRI
  'demo-website-penulis-mandiri.html': [
    ['Sarah Amelia', 'Zannah Amelia'],
  ],

  // 22. WEDDING ROYAL DESTINY
  'demo-wedding-royal-destiny.html': [
    ['\'Aditya & Clarissa\'', '\'Radit & Zannah\''],
    ['<p class="text-xs text-amber-600 dark:text-amber-500 font-medium">Aditya & Clarissa</p>', '<p class="text-xs text-amber-600 dark:text-amber-500 font-medium">Radit & Zannah</p>'],
    ['Raden Mas Danu & Putri Sekar', 'Raden Mas Arzha & Putri Zannah'],
    ['Kevin & Amanda', 'Rajendra & Zannah'],
  ],
};

let totalFilesModified = 0;
let totalReplacementsMade = 0;

for (const [file, pairs] of Object.entries(replacements)) {
  const filePath = path.join(demosDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`[SKIP] File ${file} tidak ditemukan`);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf-8');
  let fileChanges = 0;

  for (const [search, replace] of pairs) {
    if (content.includes(search)) {
      const parts = content.split(search);
      const count = parts.length - 1;
      fileChanges += count;
      content = parts.join(replace);
      console.log(`  ✓ ${file}: "${search.slice(0, 35)}..." -> "${replace.slice(0, 35)}..." (${count}x)`);
    }
  }

  if (fileChanges > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    totalFilesModified++;
    totalReplacementsMade += fileChanges;
    console.log(`[SAVED] ${file} (${fileChanges} perubahan)\n`);
  } else {
    console.log(`[NO CHANGE] ${file}\n`);
  }
}

console.log('=============================================');
console.log(`Selesai! ${totalFilesModified} file diubah, ${totalReplacementsMade} penggantian dilakukan.`);
console.log('=============================================');
