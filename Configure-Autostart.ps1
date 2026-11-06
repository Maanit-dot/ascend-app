# ASCEND // JARVIS Windows Autostart Configuration Utility
param(
    [switch]$Enable,
    [switch]$Disable,
    [switch]$Status
)

$TaskName = "AscendJarvisStartup"
$LauncherPath = "C:\Users\Lenovo\Documents\ASCEND\ASCEND\Start ASCEND.bat"

if ($Enable) {
    Write-Host "Registering ASCEND + JARVIS in Windows Startup..." -ForegroundColor Cyan
    $Action = New-ScheduledTaskAction -Execute $LauncherPath
    $Trigger = New-ScheduledTaskTrigger -AtLogOn
    $Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -Force | Out-Null
    Write-Host "SUCCESS: ASCEND + JARVIS will now launch automatically at Windows login." -ForegroundColor Green
}
elseif ($Disable) {
    Write-Host "Removing ASCEND from Windows Startup..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "SUCCESS: Autostart disabled." -ForegroundColor Green
}
else {
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($task) {
        Write-Host "ASCEND Windows Autostart: ENABLED (Task: $TaskName)" -ForegroundColor Green
    } else {
        Write-Host "ASCEND Windows Autostart: DISABLED" -ForegroundColor DarkGray
    }
}
