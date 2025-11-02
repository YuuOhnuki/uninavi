# UniNavi Backend API

FastAPI backend for UniNavi university search application.

## Setup

1. Create virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables:

```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Run the server:

```bash
# Development
python main.py

# Production with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### GET /

Root endpoint with API information

### GET /health

Health check endpoint

### POST /api/search

Search universities with filters

**Request Body:**

```json
{
    "region": "関東",
    "faculty": "工学部",
    "examType": "一般選抜",
    "useCommonTest": "あり",
    "deviationScore": "60-65"
}
```

**Response:**

```json
{
  "universities": [...],
  "count": 3
}
```

### POST /api/chat

Career counseling chat

**Request Body:**

```json
{
    "message": "プログラミングが好きです",
    "history": []
}
```

**Response:**

```json
{
    "message": "情報工学部がおすすめです..."
}
```

## Environment Variables

- `OPENAI_API_KEY`: OpenAI API key (required)
- `TAVILY_API_KEY`: Tavily search API key (optional)
- `SERPER_API_KEY`: Serper search API key (optional)

## Development

The API uses:

- FastAPI for the web framework
- OpenAI GPT-3.5 for AI responses
- Tavily/Serper for web search
- Pydantic for data validation
