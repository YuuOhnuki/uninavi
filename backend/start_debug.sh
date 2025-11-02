#!/bin/bash
# UniNavi Backend Debug Start Script
# Bash script for macOS/Linux

echo "🚀 Starting UniNavi Backend with Debug Logging..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Install dependencies if needed
echo "📚 Checking dependencies..."
pip install -r requirements.txt --quiet

echo ""
echo "🔑 Environment Variables Status:"
echo "  OPENAI_API_KEY: $([ -n "$OPENAI_API_KEY" ] && echo '✅ Configured' || echo '❌ Not set')"
echo "  TAVILY_API_KEY: $([ -n "$TAVILY_API_KEY" ] && echo '✅ Configured' || echo '⚠️  Not set (optional)')"
echo "  SERPER_API_KEY: $([ -n "$SERPER_API_KEY" ] && echo '✅ Configured' || echo '⚠️  Not set (optional)')"
echo ""

# Load .env file if exists
if [ -f ".env" ]; then
    echo "📄 Loading .env file..."
    export $(grep -v '^#' .env | xargs)
fi

echo "🔍 Debug logging is enabled!"
echo "📝 Watch for detailed logs below..."
echo ""
echo "═══════════════════════════════════════════════════"
echo ""

# Start the server
python main.py
