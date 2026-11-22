$j = Get-Content 'C:\Users\User\.cursor\browser-logs\cdp-response-Page.captureScreenshot-2026-10-07T08-02-34-133Z.json' -Raw | ConvertFrom-Json
[System.IO.File]::WriteAllBytes('C:\Users\User\Documents\GitHub\Carrentdesk\slides-eng-png\slide_00.png', [Convert]::FromBase64String($j.data))
Write-Host 'slide_00 saved'
