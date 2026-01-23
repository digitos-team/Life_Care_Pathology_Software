# Check for Administrator privileges
if (!([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    exit 1
}

$configPath = "C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg"

# Check if file exists, if not try to find it
if (-not (Test-Path $configPath)) {
    Write-Host "Searching for mongod.cfg..."
    $foundPath = Get-ChildItem -Path "C:\Program Files\MongoDB" -Filter "mongod.cfg" -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName -First 1
    
    if ($foundPath) {
        $configPath = $foundPath
        Write-Host "Found config at: $configPath" -ForegroundColor Green
    } else {
        Write-Host "Could not find mongod.cfg. Please edit it manually." -ForegroundColor Red
        exit 1
    }
}

# Read content
$content = Get-Content $configPath

# Check if replication is already configured
if ($content -match "replSetName") {
    Write-Host "Replication already configured in mongod.cfg" -ForegroundColor Green
} else {
    Write-Host "Configuring Replication in mongod.cfg..."
    
    # Create Backup
    Copy-Item $configPath "$configPath.bak"
    Write-Host "Backup created at $configPath.bak" -ForegroundColor Gray

    # Append config
    Add-Content $configPath "`nreplication:`n  replSetName: rs0"
    Write-Host "Configuration added." -ForegroundColor Green
}

# Restart Service
Write-Host "Restarting MongoDB Service..."
try {
    Restart-Service MongoDB -Force
    Write-Host "MongoDB Service Restarted!" -ForegroundColor Green
} catch {
    Write-Host "Failed to restart service. Please manually restart MongoDB service." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "STEP 1 COMPLETE: MongoDB is running in Replica Set mode." -ForegroundColor Cyan
Write-Host "Now run: node src/scripts/init-replica.js" -ForegroundColor Cyan
