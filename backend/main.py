"""
UniNavi FastAPI Backend
Main application entry point
"""

import asyncio
import contextlib
import json

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import logging
import traceback
# .envから環境変数をロードするためにdotenvライブラリを追加
from dotenv import load_dotenv # 追加

# 環境変数ロード
load_dotenv() # 追加: .envファイルから環境変数を読み込む

# インポートは前回の修正のまま（ファイル名がservices/ai_search.pyの場合）
from services.ai_search import chat_with_ai, chat_with_ai_stream 
from services.summarize import search_universities

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="UniNavi API", version="1.0.0")

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://*.vercel.app", "https://uninavi.vercel.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions with detailed logging"""
    logger.error(f"Unhandled exception: {str(exc)}")
    logger.error(f"Request path: {request.url.path}")
    logger.error(f"Request method: {request.method}")
    logger.error(f"Traceback:\n{traceback.format_exc()}")
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "type": type(exc).__name__,
            "traceback": traceback.format_exc() if os.getenv("DEBUG") else None
        }
    )


class SearchRequest(BaseModel):
    """University search request model"""

    region: Optional[str] = ""
    faculty: Optional[str] = ""
    examType: Optional[str] = ""
    useCommonTest: Optional[str] = ""
    deviationScore: Optional[str] = ""
    institutionType: Optional[str] = ""
    prefecture: Optional[str] = ""
    nameKeyword: Optional[str] = ""
    commonTestScore: Optional[str] = ""
    externalEnglish: Optional[str] = ""
    requiredSubjects: Optional[str] = ""
    tuitionMax: Optional[str] = ""
    scholarship: Optional[str] = ""
    qualification: Optional[str] = ""
    examSchedule: Optional[str] = ""


class ChatMessage(BaseModel):
    """Chat message model"""

    role: str 
    content: str


class ChatRequest(BaseModel):
    """Chat request model"""

    message: str
    history: List[ChatMessage] = []


class University(BaseModel):
    """University information model"""

    id: str
    name: str
    officialUrl: str
    faculty: str
    department: str
    deviationScore: str
    commonTestScore: str
    examType: str
    requiredSubjects: List[str]
    examDate: str
    aiSummary: str
    sources: List[str]
    examSchedules: List[str] = Field(default_factory=list)
    admissionMethods: List[str] = Field(default_factory=list)
    subjectHighlights: List[str] = Field(default_factory=list)
    commonTestRatio: Optional[str] = ""
    selectionNotes: Optional[str] = ""
    applicationDeadline: Optional[str] = ""


class SearchResponse(BaseModel):
    """Search response model"""

    universities: List[University]
    count: int


class ChatResponse(BaseModel):
    """Chat response model"""

    message: str


@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "Welcome to UniNavi API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


def _format_sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.post("/api/search", response_model=SearchResponse)
async def search_endpoint(request: SearchRequest):
    """
    Search universities based on filters
    Uses AI to search web and summarize results
    """
    logger.info(f"Received search request: {request.model_dump()}")
    
    try:
        logger.debug(f"Calling search_universities with params: region={request.region}, faculty={request.faculty}")
        universities = await search_universities(
            region=request.region,
            faculty=request.faculty,
            exam_type=request.examType,
            use_common_test=request.useCommonTest,
            deviation_score=request.deviationScore,
            institution_type=request.institutionType,
            prefecture=request.prefecture,
            name_keyword=request.nameKeyword,
            common_test_score=request.commonTestScore,
            external_english=request.externalEnglish,
            required_subjects=request.requiredSubjects,
            tuition_max=request.tuitionMax,
            scholarship=request.scholarship,
            qualification=request.qualification,
            exam_schedule=request.examSchedule,
        )

        logger.info(f"Search completed successfully, found {len(universities)} universities")
        return SearchResponse(universities=universities, count=len(universities))

    except Exception as e:
        logger.error(f"Search failed: {str(e)}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@app.post("/api/search/stream")
async def search_stream_endpoint(request: Request, search_request: SearchRequest):
    """Stream university search results with progress updates via Server-Sent Events."""

    queue: asyncio.Queue[tuple[str, dict]] = asyncio.Queue()

    async def progress_callback(payload: dict) -> None:
        await queue.put(("progress", payload))

    async def university_callback(university: dict) -> None:
        """Callback to stream individual university results as they are filtered."""
        await queue.put(("university", {"university": university}))

    async def run_search() -> None:
        try:
            universities = await search_universities(
                region=search_request.region,
                faculty=search_request.faculty,
                exam_type=search_request.examType,
                use_common_test=search_request.useCommonTest,
                deviation_score=search_request.deviationScore,
                institution_type=search_request.institutionType,
                prefecture=search_request.prefecture,
                name_keyword=search_request.nameKeyword,
                common_test_score=search_request.commonTestScore,
                external_english=search_request.externalEnglish,
                required_subjects=search_request.requiredSubjects,
                tuition_max=search_request.tuitionMax,
                scholarship=search_request.scholarship,
                qualification=search_request.qualification,
                exam_schedule=search_request.examSchedule,
                progress_callback=progress_callback,
                university_callback=university_callback,
            )
            await queue.put(("results", {"universities": universities}))
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Streaming search failed: {exc}")
            await queue.put(("error", {"message": str(exc)}))
        finally:
            await queue.put(("done", {}))

    async def event_generator(request_obj: Request):
        search_task = asyncio.create_task(run_search())
        try:
            while True:
                event_type, payload = await queue.get()

                if event_type == "progress":
                    yield _format_sse("progress", payload)
                elif event_type == "university":
                    # Stream individual university results as they are filtered
                    university_data = payload.get("university", {})
                    yield _format_sse("university", {"university": university_data})
                elif event_type == "results":
                    universities = payload.get("universities") or []
                    total = len(universities)
                    if total == 0:
                        yield _format_sse("complete", {"total": 0})
                    else:
                        for index, university in enumerate(universities, start=1):
                            yield _format_sse(
                                "result",
                                {"index": index, "total": total, "university": university},
                            )
                            if await request_obj.is_disconnected():
                                logger.info("Client disconnected during results streaming")
                                return
                        yield _format_sse("complete", {"total": total})
                elif event_type == "error":
                    yield _format_sse("error", payload)
                    return
                elif event_type == "done":
                    return

                if await request_obj.is_disconnected():
                    logger.info("Client disconnected from search stream")
                    return
        finally:
            if not search_task.done():
                search_task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await search_task

    response = StreamingResponse(event_generator(request), media_type="text/event-stream")
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Accept"
    return response


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat with AI for career counseling
    """
    logger.info(f"Received chat request: {request.message[:50]}...")
    
    # 履歴変換ロジックを修正
    # ChatMessage (role/content) のリストを、
    # chat_with_aiが期待する `{"question": "...", "answer": "..."}` 形式のリストに変換
    history_dicts = []
    
    # historyは role/content のペアが連続する可能性があり、
    # chat_with_aiは質問/回答のペアを期待するため、変換ロジックをペアベースに修正
    # 偶数番目が user (question)、奇数番目が assistant (answer)と仮定
    for i in range(0, len(request.history) - 1, 2):
        user_message = request.history[i]
        assistant_message = request.history[i+1]
        
        # ロールが一致するか確認しつつ、ペアを作成
        if user_message.role == "user" and assistant_message.role == "assistant":
             history_dicts.append({
                "question": user_message.content,
                "answer": assistant_message.content
            })

    try:
        # Call AI chat service
        logger.debug(f"Calling chat_with_ai with message length: {len(request.message)}")
        response_message = await chat_with_ai(
            message=request.message, 
            history=history_dicts # 変換した辞書リストを渡す
        )

        logger.info("Chat completed successfully")
        return ChatResponse(message=response_message)

    except Exception as e:
        logger.error(f"Chat failed: {str(e)}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@app.post("/api/chat/stream")
async def chat_stream_endpoint(request: Request, payload: ChatRequest):
    """Stream chat responses over Server-Sent Events for real-time UI updates."""
    logger.info(f"Received streaming chat request: {payload.message[:50]}...")

    history_dicts = []
    for i in range(0, len(payload.history) - 1, 2):
        user_message = payload.history[i]
        assistant_message = payload.history[i + 1]

        if user_message.role == "user" and assistant_message.role == "assistant":
            history_dicts.append(
                {
                    "question": user_message.content,
                    "answer": assistant_message.content,
                }
            )

    async def event_generator(request_obj: Request):
        try:
            async for chunk in chat_with_ai_stream(payload.message, history_dicts):
                yield _format_sse("delta", {"content": chunk})
                if await request_obj.is_disconnected():
                    logger.info("Client disconnected from chat stream during delta transmission")
                    return

            yield _format_sse("complete", {})

        except Exception as exc:  # noqa: BLE001
            logger.error(f"Chat streaming failed: {exc}")
            yield _format_sse("error", {"message": str(exc)})

    response = StreamingResponse(event_generator(request), media_type="text/event-stream")
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Accept"
    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)