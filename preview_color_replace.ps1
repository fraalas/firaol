# Preview: shows every file and line containing the old color, without changing anything
Get-ChildItem -Path . -Recurse -Include *.tsx,*.ts,*.css | `
  Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.next\\' } | `
  Select-String -Pattern '1A3A6B' -CaseSensitive:$false
