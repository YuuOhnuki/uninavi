# UniNavi Backend Debug Start Script
# PowerShell script for Windows

Write-Host "🚀 Starting UniNavi Backend with Debug Logging..." -ForegroundColor Green
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "⚠️  Virtual environment not found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "📦 Activating virtual environment..." -ForegroundColor Cyan
& ".\venv\Scripts\Activate.ps1"

# Install dependencies if needed
Write-Host "📚 Checking dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt --quiet

Write-Host ""
Write-Host "🔑 Environment Variables Status:" -ForegroundColor Magenta
Write-Host "  OPENAI_API_KEY: $(if ($env:OPENAI_API_KEY) { '✅ Configured' } else { '❌ Not set' })"
Write-Host "  TAVILY_API_KEY: $(if ($env:TAVILY_API_KEY) { '✅ Configured' } else { '⚠️  Not set (optional)' })"
Write-Host "  SERPER_API_KEY: $(if ($env:SERPER_API_KEY) { '✅ Configured' } else { '⚠️  Not set (optional)' })"
Write-Host ""

# Check .env file
if (Test-Path ".env") {
    Write-Host "📄 Loading .env file..." -ForegroundColor Cyan
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

Write-Host "🔍 Debug logging is enabled!" -ForegroundColor Green
Write-Host "📝 Watch for detailed logs below..." -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# Start the server
python main.py
