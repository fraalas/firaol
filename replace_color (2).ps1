# Replaces #1A3A6B with #075290 across all .tsx, .ts, and .css files,
# AND converts the matching RGB decimal form (26, 58, 107) -> (7, 82, 144).
# Explicitly forces UTF-8 encoding on read AND write to avoid corrupting
# special characters like em-dashes, arrows, and checkmarks.

Get-ChildItem -Path . -Recurse -Include *.tsx,*.ts,*.css | `
  Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.next\\' } | `
  ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content -LiteralPath $filePath -Raw -Encoding UTF8
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
      # UTF8 without BOM to match how these files were originally saved
      $utf8NoBom = New-Object System.Text.UTF8Encoding $false
      [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
      Write-Host "Updated: $filePath"
    }
  }

Write-Host ""
Write-Host "Done. Run 'npm run build' locally BEFORE pushing, to confirm no errors."
