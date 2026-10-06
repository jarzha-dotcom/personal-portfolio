$files = Get-ChildItem 'c:\Project Apps\personal-portfolio\public\demos\demo-*.html'

# Regex patterns for people names, testimonials, teams, authors
$patterns = @(
    'dr\.\s+(?:dr\.\s+)?[A-Z][a-z]+(\s+[A-Z][a-z]+)*(?:,\s*Sp\.[A-Z\.]+|,\s*M\.[A-Za-z]+)?',
    'drg\.\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*',
    'drh\.\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*',
    'Coach\s+[A-Z][a-z]+',
    'Kasir:\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)*',
    '(?:Bpk|Ibu|Kak|Ir|H|Hj)\.\s+(?:Ir\.\s+)?[A-Z][a-z]+(\s+[A-Z][a-z]+)*(?:,\s*[A-Z\.]+)?',
    'Master Barber\s+[A-Z][a-z]+',
    'artist:\s*"[^"]+"',
    'author:\s*"[^"]+"',
    'cashierName:\s*''[^'']+''',
    '(?:founder|creator|penulis|stylist|owner|dokter|instruktur|tutor|mechanic|therapist|barber|alumni|pelanggan|klien|pengantin|customer)\b[^<\n]{0,60}',
    'testimonial[s]?\b[^<\n]{0,80}'
)

foreach ($f in $files) {
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $lines = $content -split "`n"
    $matchesFound = [System.Collections.Generic.List[string]]::new()
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        # Ignore long base64 lines
        if ($line.Length -gt 1000) { continue }
        
        foreach ($p in $patterns) {
            $m = [regex]::Matches($line, $p, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            foreach ($match in $m) {
                $trimmed = $match.Value.Trim()
                if ($trimmed.Length -gt 3 -and -not $matchesFound.Contains($trimmed)) {
                    $matchesFound.Add("$trimmed (line $($i+1))")
                }
            }
        }
    }
    
    if ($matchesFound.Count -gt 0) {
        Write-Host "=== $($f.Name) ===" -ForegroundColor Cyan
        foreach ($item in $matchesFound) {
            Write-Host "  $item"
        }
    }
}
