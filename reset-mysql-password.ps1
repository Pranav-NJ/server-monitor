# MySQL Password Reset Script
# Run this as Administrator

# 1. Stop MySQL service
Write-Host "Stopping MySQL service..."
Stop-Service -Name "MySQL80" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# 2. Create init file to reset password
$initFile = "$env:TEMP\mysql-init.txt"
Set-Content -Path $initFile -Value "ALTER USER 'root'@'localhost' IDENTIFIED BY 'root1234';"
Write-Host "Init file created at $initFile"

# 3. Start MySQL with init-file
Write-Host "Starting MySQL with password reset..."
$proc = Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" `
    -ArgumentList "--init-file=$initFile","--console" `
    -PassThru -NoNewWindow

Start-Sleep -Seconds 8

# 4. Stop mysqld process
Write-Host "Stopping mysqld..."
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# 5. Restart MySQL service normally
Write-Host "Starting MySQL service normally..."
Start-Service -Name "MySQL80"
Start-Sleep -Seconds 3

# 6. Clean up
Remove-Item $initFile -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== PASSWORD RESET COMPLETE ==="
Write-Host "New root password: root1234"
Write-Host ""

# Keep window open
Read-Host "Press Enter to close"
