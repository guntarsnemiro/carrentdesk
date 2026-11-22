$imgPath = 'C:\Users\User\.cursor\projects\c-Users-User-Documents-GitHub-Carrentdesk\assets\c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_d6aa13c1e2418aeb4ed43a8e173a19b1_images_carrentdesk-787786ec-8e5f-43a4-aa1b-1bb5684ce629.jpg'
$bytes = [System.IO.File]::ReadAllBytes($imgPath)
$b64 = [Convert]::ToBase64String($bytes)
Write-Host "Length: $($b64.Length)"
$b64 | Out-File -FilePath 'C:\Users\User\Documents\GitHub\Carrentdesk\crd-screenshot-b64.txt' -Encoding ASCII
Write-Host "Done"
