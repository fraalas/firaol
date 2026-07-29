# Replaces #1A3A6B with #075290 across all .tsx, .ts, and .css files,
# AND converts the matching RGB decimal form (26, 58, 107) -> (7, 82, 144)
# used in PDF export code (lib/export.ts, EmployeesClient.tsx).
#
# Run preview_color_replace.ps1 FIRST to see what will change before running this.

Get-ChildItem -Path . -Recurse -Include *.tsx,*.ts,*.css | `
  Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.next\\' } | `
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $changed = $false

    if ($content -match '(?i)1A3A6B') {
      $content = $content -replace '(?i)1A3A6B', '075290'
      $changed = $true
    }

    if ($content -match '26,\s*58,\s*107') {
      $content = $content -replace '26,\s*58,\s*107', '7, 82, 144'
      $changed = $true
    }

    if ($changed) {
      Set-Content -Path $_.FullName -Value $content -NoNewline
      Write-Host "Updated: $($_.FullName)"
    }
  }

Write-Host ""
Write-Host "Done. Run 'git diff --stat' to see how many files changed, then review with 'git diff' before committing."
