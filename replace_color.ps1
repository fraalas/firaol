# Actually replaces #1A3A6B with #075290 across all .tsx, .ts, and .css files
# Run the preview script FIRST to see what will change before running this.

Get-ChildItem -Path . -Recurse -Include *.tsx,*.ts,*.css | `
  Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.next\\' } | `
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match '(?i)1A3A6B') {
      $updated = $content -replace '(?i)1A3A6B', '075290'
      Set-Content -Path $_.FullName -Value $updated -NoNewline
      Write-Host "Updated: $($_.FullName)"
    }
  }

Write-Host ""
Write-Host "Done. Run 'git diff --stat' to see how many files changed, then review with 'git diff' before committing."
