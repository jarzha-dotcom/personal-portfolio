/**
 * fix-demo-names.mjs
 * Ganti semua nama dummy di file demo dengan nama ekosistem portofolio:
 * Arzhaning, Arzha, Radit, Zannah, Rajendra
 *
 * Menggunakan exact string matching (bukan regex) agar aman dari base64.
 * Nama pendek (Alex, Sarah, Dewi, Bima, Randy) hanya diganti dalam konteks
 * lengkapnya untuk menghindari korupsi base64.
 */

import fs from 'fs';
import path from 'path';

const demosDir = 'c:/Project Apps/personal-portfolio/public/demos';

function replaceAllExact(content, search, replacement) {
  if (!content.includes(search)) return content;
  return content.split(search).join(replacement);
}

// Per-file replacement pairs: [search, replace]
// RULE: longer strings MUST come before shorter substrings of the same name
const fileReplacements = {

  // ============================================================
  // 1. ABSENPRO HRIS
  // ============================================================
  'demo-absenpro-hris.html': [
    ['name=Rizky+Pratama', 'name=Arzhaning+Jagad'],
    ['Muhammad Rizky Pratama', 'K. Arzhaning Jagad'],
    ['Rizky Pratama', 'K. Arzhaning Jagad'],
    ['Budi Santoso', 'Rajendra'],
  ],

  // ============================================================
  // 2. ATELIER KINETIK
  // ============================================================
  'demo-atelier-kinetik.html': [
    ['Maya Candrawati', 'Zannah Candrawati'],
    ['Hendra Sukmana', 'Rajendra Sukmana'],
  ],

  // ============================================================
  // 3. ATELIER NISKALA
  // ============================================================
  'demo-atelier-niskala.html': [
    ['Maya Candrawati', 'Zannah Candrawati'],
    ['Hendra Sukmana', 'Rajendra Sukmana'],
    ['Budi Santoso', 'Radit Santoso'],
  ],

  // ============================================================
  // 4. BARBERSHOP GENTLEMEN'S CAVE
  // ============================================================
  'demo-barbershop-gentlemens-cave.html': [
    ['Dimas Anggara', 'Radit Jagad'],
    ['Kevin Suryadinata', 'Rajendra Suryadinata'],
    ['Raditya Mahendra', 'Arzha Mahendra'],
    ['Bagas Prawira', 'Radit Prawira'],
    ['Master Barber Rian', 'Master Barber Rajendra'],
    ['Barber Rian', 'Barber Rajendra'],
    // short names in full context only
    ['Senior Barber Alex', 'Senior Barber Radit'],
    ['Barber Alex', 'Barber Radit'],
    ['Senior Stylist Bima', 'Senior Stylist Arzhaning'],
    ['Stylist Bima', 'Stylist Arzhaning'],
    // Suryadi standalone (not part of Suryadinata since that was already replaced)
    ['Suryadi', 'Rajendra'],
  ],

  // ============================================================
  // 5. BENGKEL AUTOFIX
  // ============================================================
  'demo-bengkel-autofix.html': [
    ['Hendra Gunawan', 'Rajendra Gunawan'],
    ['Maya Anggraeni', 'Zannah Anggraeni'],
    ['drg. Maya', 'dr. Zannah'],
    ['Budi Santoso, S.T.', 'Ir. Rajendra Jagad'],
    ['Budi Santoso', 'Rajendra Jagad'],
    ['Rian Pratama', 'Radit Pratama'],
  ],

  // ============================================================
  // 6. BIMBEL GENIUS
  // ============================================================
  'demo-bimbel-genius.html': [
    // Tutors (full names with titles)
    ['Kak Farhan Pratama, S.Si', 'Kak Radit Pratama, S.Si'],
    ['Kak Farhan UI', 'Kak Radit UI'],
    ['Kak Farhan', 'Kak Radit'],
    ['Kak Dimas Ardiansyah, M.T', 'Kak Rajendra Ardiansyah, M.T'],
    ['Kak Dimas ITB', 'Kak Rajendra ITB'],
    ['Kak Dimas', 'Kak Rajendra'],
    ['Kak Nadia Safitri, S.Kom', 'Kak Arzha Safitri, S.Kom'],
    ['Kak Nadia', 'Kak Arzha'],
    ['Kak Sarah Kimberly, M.Ed', 'Kak Zannah Kimberly, M.Ed'],
    ['Kak Sarah UGM', 'Kak Zannah UGM'],
    ['Kak Sarah', 'Kak Zannah'],
    ['Kak Aris Munandar, M.Hum', 'Kak Rajendra Munandar, M.Hum'],
    ['Kak Aris UI', 'Kak Rajendra UI'],
    ['Kak Aris', 'Kak Rajendra'],
    ['Kak Rina Wulandari, S.Pd', 'Kak Arzhaning Wulandari, S.Pd'],
    ['Kak Rina UNJ', 'Kak Arzhaning UNJ'],
    ['Kak Rina', 'Kak Arzhaning'],
    // Parent testimonial
    ['Ir. Budi Santoso', 'Ir. K. Arzhaning Jagad'],
    ['Budi Santoso', 'K. Arzhaning Jagad'],
  ],

  // ============================================================
  // 7. BREWSPACE POS
  // ============================================================
  'demo-brewspace-pos.html': [
    ['Rian Pratama', 'Radit Pratama'],
  ],

  // ============================================================
  // 8. DISTRIBUTOR SPAREPART
  // ============================================================
  'demo-distributor-sparepart.html': [
    ['Bambang Prasetyo, S.T.', 'Ir. Rajendra Pratama'],
    ['Bambang Prasetyo', 'Rajendra Pratama'],
    ['Ir. Agus Wijaya', 'Radit Arzhaning, S.T.'],
    ['Agus Wijaya', 'Radit Arzhaning'],
    ['H. Suryadi', 'H. K. Arzhaning Jagad'],
    ['Suryadi', 'K. Arzhaning Jagad'],
  ],

  // ============================================================
  // 9. EKSPEDISI NUSANTARA
  // ============================================================
  'demo-ekspedisi-nusantara.html': [
    ['Riana Mayasari', 'Zannah Mayasari'],
    ['Hendro Wibowo', 'Rajendra Wibowo'],
    ['Agung Daniswara', 'Radit Daniswara'],
    ['Budi Santoso', 'Arzhaning Santoso'],
  ],

  // ============================================================
  // 10. GALERI SENI
  // ============================================================
  'demo-galeri-seni.html': [
    ['Arunika', 'Arzhaning'],
  ],

  // ============================================================
  // 11. GYM TITAN
  // ============================================================
  'demo-gym-titan.html': [
    // Context-safe replacements for short coach names
    ['Coach Randy & Dimas', 'Coach Rajendra & Radit'],
    ['Coach Randy', 'Coach Rajendra'],
    ['Coach Dimas', 'Coach Radit'],
    ['Coach Sarah', 'Coach Zannah'],
    ['Coach Jessica', 'Coach Arzha'],
    ['Coach Nadia', 'Coach Arzhaning'],
    ['Coach Alex', 'Coach Radit A.'],
  ],

  // ============================================================
  // 12. KEDAI KOPI
  // ============================================================
  'demo-kedai-kopi.html': [
    ['Andi Pratama', 'Radit Pratama'],
    ['Clarissa Maharani', 'Zannah Maharani'],
    ['Dimas Wicaksono', 'Rajendra Wicaksono'],
    ['Rian Pratama', 'Arzha Pratama'],
  ],

  // ============================================================
  // 13. KLINIK ESTETIKA
  // ============================================================
  'demo-klinik-estetika.html': [
    ['Dr. dr. Amanda Vanya, Sp.D.V.E', 'Dr. dr. Zannah Vanya, Sp.D.V.E'],
    ['dr. Kevin Pratama, Sp.D.V.E', 'dr. Rajendra Pratama, Sp.D.V.E'],
    ['dr. Clarissa Tan, M.Biomed (AAM)', 'dr. Radit Arzhaning, M.Biomed (AAM)'],
    ['dr. Clarissa Tan, M.Biomed', 'dr. Radit Arzhaning, M.Biomed'],
    ['Dr Amanda', 'Dr Zannah'],
    ['dr Kevin', 'dr Rajendra'],
    ['dr Clarissa', 'dr Radit'],
    ['dr. Kevin', 'dr. Rajendra'],
    ['dr. Clarissa', 'dr. Radit'],
    ['Amanda Vanya', 'Zannah Vanya'],
    ['Kevin Pratama', 'Rajendra Pratama'],
    ['Clarissa Tan', 'Radit Arzhaning'],
  ],

  // ============================================================
  // 14. KLINIK GIGI
  // ============================================================
  'demo-klinik-gigi.html': [
    ['Contoh: Budi Santoso', 'Contoh: Radit Pratama'],
    ['Budi Santoso', 'Radit Pratama'],
    ['Andi K.', 'Rajendra K.'],
    ['Rina S.', 'Zannah S.'],
    ['Sari W.', 'Arzhaning W.'],
  ],

  // ============================================================
  // 15. KONTRAKTOR CIPTA KARYA
  // ============================================================
  'demo-kontraktor-cipta-karya.html': [
    ['Bpk. Ir. Rian Pratama', 'Bpk. Ir. Radit Pratama'],
    ['Bpk. Hendra Gunawan', 'Bpk. Rajendra Gunawan'],
    ['Bpk. Budi Santoso', 'Bpk. K. Arzhaning Jagad'],
    ['Hendra Gunawan', 'Rajendra Gunawan'],
    ['Rian Pratama', 'Radit Pratama'],
    ['Budi Santoso', 'K. Arzhaning Jagad'],
  ],

  // ============================================================
  // 16. KOSHARMONY PORTAL
  // ============================================================
  'demo-kosharmony-portal.html': [
    ['Rendy Pratama', 'Radit Pratama'],
    ['Hendra Wijaya', 'Rajendra Wijaya'],
    ['name=Rendy+Pratama', 'name=Radit+Pratama'],
  ],

  // ============================================================
  // 17. KOSPRO MANAGER
  // ============================================================
  'demo-kospro-manager.html': [
    ['Dimas Pratama', 'Radit Pratama'],
    ['Hendra Wijaya', 'Rajendra Wijaya'],
    ['Hendra+W', 'Rajendra+W'],
    ['Anisa Rahma', 'Zannah Rahma'],
    ['Budi Santoso', 'Arzhaning Santoso'],
    ['Sarah Melati', 'Zannah Melati'],
  ],

  // ============================================================
  // 18. KOSPRO SUITE
  // ============================================================
  'demo-kospro-suite.html': [
    ['Dimas Pratama', 'Radit Pratama'],
    ['Hendra Wijaya, S.E.', 'Rajendra Wijaya, S.E.'],
    ['Hendra Wijaya', 'Rajendra Wijaya'],
    ['Hendra+W', 'Rajendra+W'],
    ['Anisa Rahma', 'Zannah Rahma'],
    ['Budi Santoso', 'Arzhaning Santoso'],
    ['Sarah Melati', 'Zannah Melati'],
  ],

  // ============================================================
  // 19. KURSUS SETIR KILAT
  // ============================================================
  'demo-kursus-setir-kilat.html': [
    ['Nadia Saraswati', 'Zannah Saraswati'],
    ['Bambang Trianto', 'Rajendra Trianto'],
  ],

  // ============================================================
  // 20. LANDING PENULIS
  // ============================================================
  'demo-landing-penulis.html': [
    ['Aiden Gray', 'Radit Arzhaning'],
  ],

  // ============================================================
  // 21. LAUNDRY BENING
  // ============================================================
  'demo-laundry-bening.html': [
    ['dr. Rina Puspita', 'dr. Zannah Puspita'],
    ['Rina Puspita', 'Zannah Puspita'],
    ['Andhika Pratama, S.T.', 'Radit Pratama, S.T.'],
    ['Andhika Pratama', 'Radit Pratama'],
    ['Stephanie Wijaya', 'Arzhaning Wijaya'],
    ['Bpk. Hendra Wijaya', 'Bpk. Rajendra Wijaya'],
    ['Hendra Wijaya', 'Rajendra Wijaya'],
  ],

  // ============================================================
  // 22. MARTEXPRESS POS
  // ============================================================
  'demo-martexpress-pos.html': [
    ['Kasir: Dewi', 'Kasir: Zannah'],
    ['Budi Santoso', 'Rajendra Pratama'],
  ],

  // ============================================================
  // 23. PETSHOP PAW & CLAW
  // ============================================================
  'demo-petshop-paw-claw.html': [
    ['drh. Farhan Maulana, M.Si.', 'drh. Rajendra Maulana, M.Si.'],
    ['drh. Farhan Maulana', 'drh. Rajendra Maulana'],
    ['drh. Farhan', 'drh. Rajendra'],
    ['drh. Anindya Larasati, M.Vet.', 'drh. Zannah Larasati, M.Vet.'],
    ['drh. Anindya Larasati', 'drh. Zannah Larasati'],
    ['drh. Anindya', 'drh. Zannah'],
    ['Contoh: Amanda', 'Contoh: Zannah'],
    ['Farhan Maulana', 'Rajendra Maulana'],
    ['Anindya Larasati', 'Zannah Larasati'],
  ],

  // ============================================================
  // 24. RENTAL MOBIL TRANSPRIME
  // ============================================================
  'demo-rental-mobil-transprime.html': [
    ['Bambang Sudiro, S.E.', 'Rajendra Sudiro, S.E.'],
    ['Bambang Sudiro', 'Rajendra Sudiro'],
    ['Dewi Anggraeni & Suami', 'Zannah & Arzha'],
    ['Dewi Anggraeni', 'Zannah Anggraeni'],
    ['Michael Chen', 'Radit K. Jagad'],
  ],

  // ============================================================
  // 25. SALON AURA GLOW
  // ============================================================
  'demo-salon-aura-glow.html': [
    ['dr. Amanda Natalie, Sp.KK', 'dr. Zannah Natalie, Sp.KK'],
    ['dr. Amanda Natalie', 'dr. Zannah Natalie'],
    ['Amanda Natalie', 'Zannah Natalie'],
    ['Clarissa Wijaya', 'Arzhaning Wijaya'],
    ['Felicia Sandra', 'Arzha Sandra'],
    ['Vanessa Novitasari', 'Zannah Novitasari'],
    ['Dian Kartika', 'Arzhaning Kartika'],
    ['Audrey Larasati', 'Radit Larasati'],
  ],

  // ============================================================
  // 26. THREADPOS
  // ============================================================
  'demo-threadpos.html': [
    ['Sarah Dewi', 'Zannah Dewi'],
    ['Kasir: Sarah', 'Kasir: Zannah'],
  ],

  // ============================================================
  // 27. TOKO KUE SWEET DELIGHT
  // ============================================================
  'demo-toko-kue-sweet-delight.html': [
    ['Nadya Arisandi', 'Zannah Arisandi'],
    ['Rian Pratama', 'Rajendra Pratama'],
    ['Clarissa Laura', 'Arzhaning Laura'],
  ],

  // ============================================================
  // 28. WARUNGKU POS
  // ============================================================
  'demo-warungku-pos.html': [
    ["cashierName: 'Budi Santoso'", "cashierName: 'Radit Pratama'"],
    ["value = 'Budi Santoso'", "value = 'Radit Pratama'"],
    ['Budi Santoso', 'Radit Pratama'],
  ],

  // ============================================================
  // 29. WEBSITE PENULIS MANDIRI
  // ============================================================
  'demo-website-penulis-mandiri.html': [
    ['Arzan Raditya', 'K. Arzhaning Jagad'],
    ['Hendra Wijaya', 'Rajendra Wijaya'],
  ],

  // ============================================================
  // 30. WEDDING ROYAL DESTINY
  // ============================================================
  'demo-wedding-royal-destiny.html': [
    ['dr. Rendy & drg. Sarah', 'Rajendra & Zannah'],
    ['Dimas & Anindya', 'Radit & Arzhaning'],
    ['Bravian & Claudia', 'Arzha & Zannah'],
    ['Farhan & Nadira', 'Radit & Zannah'],
  ],
};

// ============================================================
// EXECUTE
// ============================================================
console.log('=============================================');
console.log(' Fix Demo Names - Ekosistem Arzhaning        ');
console.log('=============================================');
console.log(`Target folder: ${demosDir}\n`);

let totalChanges = 0;
let filesChanged = 0;

for (const [filename, pairs] of Object.entries(fileReplacements)) {
  const filePath = path.join(demosDir, filename);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠  ${filename} - FILE NOT FOUND, skipped`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  let changeCount = 0;

  for (const [search, replacement] of pairs) {
    const occurrences = content.split(search).length - 1;
    if (occurrences > 0) {
      content = replaceAllExact(content, search, replacement);
      changeCount += occurrences;
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${filename} (${changeCount} penggantian)`);
    totalChanges += changeCount;
    filesChanged++;
  } else {
    console.log(`─  ${filename} (tidak ada perubahan)`);
  }
}

console.log('\n=============================================');
console.log(` Selesai! ${filesChanged} file diubah, total ${totalChanges} penggantian`);
console.log(' Semua nama kini: Arzhaning/Arzha/Radit/Zannah/Rajendra');
console.log('=============================================');
