<#
.SYNOPSIS
    Ganti semua data dummy (nomor WA, email, URL situs) di file-file demo
    dengan identitas resmi K. Arzhaning Jagad (Arzha).
#>

$demosPath = "c:\Project Apps\personal-portfolio\public\demos"

# Identitas resmi Arzha
$arzhaWA        = "6282312312734"
$arzhaWADisplay = "0823-1231-2734"
$arzhaWAFull    = "+62 823-1231-2734"
$arzhaEmail     = "admin@arzhaning.my.id"
$arzhaWebsite   = "https://arzhaning.my.id"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Fix Demo Contacts - K. Arzhaning Jagad      " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Target folder: $demosPath" -ForegroundColor Gray
Write-Host ""

$htmlFiles = Get-ChildItem -Path $demosPath -Filter "demo-*.html"
Write-Host "Ditemukan $($htmlFiles.Count) file demo" -ForegroundColor Yellow
Write-Host ""

$totalChanges = 0

foreach ($file in $htmlFiles) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor White -NoNewline
    
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $content
    $changes = 0

    # --- 1. GANTI NOMOR WA di URL wa.me/628XXXXXXXXX ---
    $waUrlPat = 'wa\.me/628\d{8,12}'
    $waUrlMatches = [regex]::Matches($content, $waUrlPat)
    foreach ($m in $waUrlMatches) {
        if ($m.Value -ne "wa.me/$arzhaWA") { $changes++ }
    }
    $content = [regex]::Replace($content, $waUrlPat, "wa.me/$arzhaWA")

    # --- 2. GANTI NOMOR DISPLAY +62 8xx-xxxx-xxxx ---
    $waDisplayPat = '\+62\s*8\d{2}[-\s]?\d{4}[-\s]?\d{4,5}'
    $dispMatches = [regex]::Matches($content, $waDisplayPat)
    foreach ($m in $dispMatches) {
        if ($m.Value -notmatch '82312312734|823-1231-2734') { $changes++ }
    }
    $content = [regex]::Replace($content, $waDisplayPat, $arzhaWAFull)

    # --- 3. GANTI NOMOR HP DUMMY SPESIFIK ---
    $dummyNumbers = @(
        '0812-8899-7711','0812-8899-7766','0812-8899-7700','0812-8899-7722',
        '0812-9876-5432','0812-9900-1122','0812-9988-7700','0821-2345-6789',
        '0822-1234-5678','0821-4567-8900','0812-0000-0000','0812-3456-7890',
        '081288997711','081288997766','081288997700','081288997722',
        '081298765432','081299887766','081299887700','081234567890',
        '081200000000','082123456789','082145678900','0821-45-678-900',
        '6281288997711','6281288997766','6281288997700','6281288997722',
        '6281298765432','6281299887766','6281299887700','6281234567890',
        '6281200000000','6282123456789','6282145678900'
    )
    foreach ($num in $dummyNumbers) {
        $escaped = [regex]::Escape($num)
        if ([regex]::IsMatch($content, $escaped)) { $changes++ }
        $content = [regex]::Replace($content, $escaped, $arzhaWADisplay)
    }

    # --- 4. GANTI EMAIL DUMMY ---
    $specificEmails = @(
        'rizky\.pratama@kinerjakita\.id',
        'kolektor@example\.com',
        'sales@jayateknikmandiri\.co\.id',
        'cs@expresskirim\.id',
        'halo@expresskirim\.id',
        'halo@contoh-galeri\.id',
        'halo@titanfitness\.co\.id',
        'halo@ciptakaryautama\.co\.id',
        'halo@kilatdriving\.com',
        'booking@transprimerental\.com',
        'contact@auraglowsalon\.com',
        'order@sweetdelightbakery\.id',
        'kontak@arzanraditya\.com',
        'concierge@royaldestinywedding\.com',
        'nama@gmail\.com',
        'email@contoh\.com'
    )
    foreach ($pat in $specificEmails) {
        if ([regex]::IsMatch($content, $pat, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) { $changes++ }
        $content = [regex]::Replace($content, $pat, $arzhaEmail, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    }
    # Pola generik sisa email
    $genericEmailPat = '[a-zA-Z0-9._%+-]+@(?!arzhaning)[a-zA-Z0-9.-]+\.(com|id|co\.id|net|org)(?=[^a-zA-Z0-9]|$)'
    $genMatches = [regex]::Matches($content, $genericEmailPat, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    $changes += $genMatches.Count
    $content = [regex]::Replace($content, $genericEmailPat, $arzhaEmail, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

    # --- 5. GANTI URL SITUS BISNIS DUMMY ---
    $dummySites = @(
        'https?://www\.bengkelautofix\.com[^\s"<]*',
        'https?://www\.expresskirim\.id[^\s"<]*',
        'https?://www\.ciptakaryautama\.co\.id[^\s"<]*',
        'https?://www\.transprimerental\.com[^\s"<]*',
        'https?://www\.royaldestinywedding\.com[^\s"<]*',
        'https?://www\.titanfitness\.co\.id[^\s"<]*',
        'https?://www\.kilatdriving\.com[^\s"<]*',
        'https?://www\.auraglowsalon\.com[^\s"<]*',
        'https?://www\.sweetdelightbakery\.id[^\s"<]*',
        'https?://www\.jayateknikmandiri\.co\.id[^\s"<]*',
        'https?://kinerjakita\.id[^\s"<]*',
        'https?://www\.bimbelgenius\.id[^\s"<]*',
        'https?://www\.arzanraditya\.com[^\s"<]*',
        'https?://www\.contoh-galeri\.id[^\s"<]*'
    )
    foreach ($pat in $dummySites) {
        if ([regex]::IsMatch($content, $pat, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) { $changes++ }
        $content = [regex]::Replace($content, $pat, $arzhaWebsite, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    }

    # Simpan jika ada perubahan
    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host " ✅ ($changes penggantian)" -ForegroundColor Green
        $totalChanges += $changes
    } else {
        Write-Host " ─ (tidak ada perubahan)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " Selesai! Total penggantian: $totalChanges" -ForegroundColor Green
Write-Host " Semua demo kini melekat pada identitas Arzha" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
