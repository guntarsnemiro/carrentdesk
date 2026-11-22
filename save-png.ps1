param([string]$JsonFile, [string]$OutFile)
$j = Get-Content $JsonFile -Raw | ConvertFrom-Json
[System.IO.File]::WriteAllBytes($OutFile, [Convert]::FromBase64String($j.data))
Write-Host "Saved: $OutFile"
