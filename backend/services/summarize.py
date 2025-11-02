"""
AI Search Service
Uses Tavily/Serper API to search for university information
and Hugging Face Chat Completions API for summarization
"""

import os
import json
import logging
import time
import asyncio
import contextlib
from textwrap import dedent
from typing import Awaitable, Callable, Dict, Any, AsyncIterator, List, Optional
import httpx

from dotenv import load_dotenv # 👈 追加

# 🚨 【修正】環境変数ロード
load_dotenv() # 👈 追加: .envファイルから環境変数を読み込む

# ロギング設定
logger = logging.getLogger(__name__)

IS_DEV = os.getenv("UNINAVI_ENV") == "development" or os.getenv("NODE_ENV") == "development"


def _debug_log(message: str) -> None:
    if IS_DEV:
        logger.debug(message)

# 🚨 【修正箇所】Hugging Face Chat Completions API configuration
# 📝 サンプルコードに合わせてURLとモデルを更新
HF_API_KEY = os.getenv("HF_API_KEY", "")
# Chat Completions APIのURL
HUGGINGFACE_API_URL = "https://router.huggingface.co/v1/chat/completions"
# Chat Completions APIで利用可能な日本語に強いInstructモデル
# 優先順位: 無料/低コストモデルを優先
PREFERRED_MODELS = [
    "MiniMaxAI/MiniMax-M2:novita",  # デフォルト、低コスト
    "Qwen/Qwen2.5-7B-Instruct:together",  # 代替
    "microsoft/WizardLM-2-8x22B",  # 高性能
]

HUGGINGFACE_MODEL_ID = os.getenv("HF_MODEL_ID", "")

async def select_optimal_model() -> str:
    """
    Automatically select the optimal HuggingFace model based on availability and priority.
    Tests each model by making a small API call and returns the first working one.
    """
    if not HF_API_KEY:
        logger.warning("No HF API key configured")
        return PREFERRED_MODELS[0]  # Return default if no key

    # If explicitly set in env, use that
    if HUGGINGFACE_MODEL_ID:
        logger.info(f"Using explicitly set model: {HUGGINGFACE_MODEL_ID}")
        return HUGGINGFACE_MODEL_ID

    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }

    test_payload = {
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 10,
        "temperature": 0.1,
    }

    for model in PREFERRED_MODELS:
        try:
            logger.debug(f"Testing model: {model}")
            test_payload["model"] = model
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    HUGGINGFACE_API_URL,
                    headers=headers,
                    json=test_payload,
                )
                if response.status_code == 200:
                    result = response.json()
                    if 'choices' in result and result['choices']:
                        logger.info(f"Selected optimal model: {model}")
                        return model
                else:
                    logger.debug(f"Model {model} failed with status {response.status_code}")
        except Exception as e:
            logger.debug(f"Model {model} test failed: {str(e)}")
            continue

    # Fallback to first model if all fail
    logger.warning("All models failed, using fallback")
    return PREFERRED_MODELS[0]

# グローバル変数として選択されたモデルを保持
SELECTED_MODEL = None

async def initialize_model():
    global SELECTED_MODEL
    if SELECTED_MODEL is None:
        SELECTED_MODEL = await select_optimal_model()
    return SELECTED_MODEL

# Tavily API (alternative: Serper.dev)
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")

logger.info(f"Hugging Face Model ID: {HUGGINGFACE_MODEL_ID}")
logger.info(f"Tavily API Key configured: {bool(TAVILY_API_KEY)}")
logger.info(f"Serper API Key configured: {bool(SERPER_API_KEY)}")


JSON_OUTPUT_EXAMPLE = dedent(
    """
    [
      {
        "id": "unique-id",
        "name": "大学名",
        "officialUrl": "公式サイトURL",
        "faculty": "学部名",
        "department": "学科名",
        "deviationScore": "偏差値（例: 60-65）",
        "commonTestScore": "共テ得点率（例: 75-80%）",
        "examType": "入試形態",
        "requiredSubjects": ["科目1", "科目2"],
        "examDate": "試験日",
        "examSchedules": ["願書受付: YYYY年MM月DD日", "試験日: YYYY年MM月DD日"],
        "admissionMethods": ["一般選抜: 前期日程 2科目型", "共通テスト利用型: 英語重視"],
        "subjectHighlights": ["数学: 200点（共通テスト換算）", "理科: 150点（化学/物理から選択)"],
        "commonTestRatio": "共通テスト 60% / 個別試験 40%",
        "selectionNotes": "指定校推薦枠あり。共テ利用型は英語外部試験得点換算可。",
        "applicationDeadline": "2025年1月15日",
        "institutionType": "国立",
        "aiSummary": "大学・学部の特徴や強みを100文字程度で具体的に要約（複数ソースからの要素を統合）",
        "sources": ["出典URL1", "出典URL2"]
      }
    ]
    """
)


def _to_string(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def _ensure_list_of_strings(value: Any) -> List[str]:
    if isinstance(value, list):
        return [item for item in (_to_string(v) for v in value) if item]
    string_value = _to_string(value)
    if not string_value:
        return []
    # Allow comma or newline separated strings
    separators = ["\n", ",", "・", "，", "、"]
    for separator in separators:
        if separator in string_value:
            return [item.strip() for item in string_value.split(separator) if item.strip()]
    return [string_value]


def _format_url(url: str) -> str:
    if not url:
        return ""
    cleaned = url.strip()
    if not cleaned:
        return ""
    if cleaned.startswith("http://") or cleaned.startswith("https://"):
        return cleaned
    if cleaned.startswith("//"):
        return f"https:{cleaned}"
    if cleaned.startswith("www."):
        return f"https://{cleaned}"
    return f"https://{cleaned}"


def _select_official_url(candidate: Any, sources: Any) -> str:
    candidates: List[str] = []
    candidate_str = _to_string(candidate)
    if candidate_str:
        candidates.append(candidate_str)

    for source in _ensure_list_of_strings(sources):
        candidates.append(source)

    seen: set[str] = set()
    prioritized: List[str] = []
    for value in candidates:
        formatted = _format_url(value)
        if not formatted or formatted in seen:
            continue
        seen.add(formatted)
        prioritized.append(formatted)

    if not prioritized:
        return ""

    prioritized.sort(key=lambda url: (-100 if ".ac.jp" in url else -50 if "admissions" in url else -10 if url.startswith("https://www.") else 0))
    return prioritized[0]


def _normalize_university_entry(entry: dict) -> dict:
    entry = dict(entry)
    entry.setdefault("requiredSubjects", [])
    entry.setdefault("sources", [])
    entry.setdefault("examSchedules", [])
    entry.setdefault("admissionMethods", [])
    entry.setdefault("subjectHighlights", [])

    entry["requiredSubjects"] = _ensure_list_of_strings(entry.get("requiredSubjects"))
    entry["sources"] = _ensure_list_of_strings(entry.get("sources"))
    entry["examSchedules"] = _ensure_list_of_strings(entry.get("examSchedules"))
    entry["admissionMethods"] = _ensure_list_of_strings(entry.get("admissionMethods"))
    entry["subjectHighlights"] = _ensure_list_of_strings(entry.get("subjectHighlights"))

    entry["officialUrl"] = _select_official_url(entry.get("officialUrl"), entry.get("sources"))
    entry["commonTestRatio"] = _to_string(entry.get("commonTestRatio"))
    entry["selectionNotes"] = _to_string(entry.get("selectionNotes"))
    entry["applicationDeadline"] = _to_string(entry.get("applicationDeadline"))
    entry["examDate"] = _to_string(entry.get("examDate"))
    entry["aiSummary"] = _to_string(entry.get("aiSummary"))
    entry["faculty"] = _to_string(entry.get("faculty"))
    entry["department"] = _to_string(entry.get("department"))
    entry["examType"] = _to_string(entry.get("examType"))
    entry["deviationScore"] = _to_string(entry.get("deviationScore"))
    entry["commonTestScore"] = _to_string(entry.get("commonTestScore"))
    entry["name"] = _to_string(entry.get("name"))

    return entry


# 🚨 【修正箇所】Hugging Face Chat Completions APIのクエリ関数
async def query_hf_inference(messages: List[Dict[str, str]], max_retries: int = 3, initial_delay: float = 1.0) -> Dict[str, Any]:
    """
    Send a query to Hugging Face Chat Completions API with retry logic
    """
    if not HF_API_KEY:
        raise ValueError("Hugging Face API key not configured")
        
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # 🚨 【修正箇所】ペイロードを Chat Completions API 形式に変更
    payload = {
        "messages": messages, # 'messages' 形式の入力をそのまま使用
        "model": SELECTED_MODEL or HUGGINGFACE_MODEL_ID or PREFERRED_MODELS[0],
        "temperature": 0.2, # 構造化されたJSON出力を得るため、温度を低めに設定
        "max_tokens": 2000, # 返却件数を増やすため少し拡大
        "top_p": 0.9,
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        delay = initial_delay
        for attempt in range(max_retries):
            try:
                response = await client.post(
                    HUGGINGFACE_API_URL,
                    headers=headers,
                    json=payload,
                )
                
                if response.status_code == 200:
                    result = response.json()
                    # 応答形式は {"choices": [{"message": {"role": "...", "content": "..."}}]}
                    if 'choices' in result and result['choices'] and 'message' in result['choices'][0]:
                        # 形式はそのまま返却 (summarize_with_aiで利用するため)
                        return result
                    else:
                        raise ValueError(f"Unexpected HF response format: {result}")
                
                elif response.status_code == 429 or response.status_code >= 500: # Rate limited or server error
                    retry_after = float(response.headers.get("Retry-After", delay * 2))
                    logger.warning(f"Rate limited/Server error. Retrying after {retry_after:.2f} seconds...")
                    await asyncio.sleep(retry_after)
                    delay *= 2
                    
                else:
                    logger.error(f"HF Chat API error: {response.status_code} - {response.text}")
                    response.raise_for_status() # 4xxエラーは即座に例外を発生させる

            except Exception as e:
                logger.error(f"Error querying HF Chat API: {str(e)}")
                if attempt == max_retries - 1:
                    raise
                await asyncio.sleep(delay)
                delay *= 2
    
    raise Exception("Failed to get response from HF Chat API after multiple retries")


# search_web 関数は変更なし

async def search_web(query: str) -> List[dict]:
    """
    Search the web using Tavily or Serper API
    Returns list of search results
    """
    logger.info(f"Searching web for query: {query}")
    
    _debug_log(f"[search_web] starting aggregated search for query='{query}'")

    async def _search_tavily() -> List[dict]:
        if not TAVILY_API_KEY:
            return []
        logger.debug("Attempting Tavily search...")
        try:
            async with httpx.AsyncClient(timeout=30.0) as http_client:
                response = await http_client.post(
                    "https://api.tavily.com/search",
                    json={"api_key": TAVILY_API_KEY, "query": query, "max_results": 20},
                )
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                logger.info(f"Tavily search successful, found {len(results)} results")
                _debug_log(f"[search_web] Tavily returned {len(results)} results")
                return results
            logger.warning(f"Tavily search returned status {response.status_code}: {response.text}")
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Tavily search failed: {exc}")
        return []

    async def _search_serper() -> List[dict]:
        if not SERPER_API_KEY:
            return []
        logger.debug("Attempting Serper search...")
        try:
            async with httpx.AsyncClient(timeout=30.0) as http_client:
                response = await http_client.post(
                    "https://google.serper.dev/search",
                    json={"q": query, "num": 20},
                    headers={"X-API-KEY": SERPER_API_KEY},
                )
            if response.status_code == 200:
                data = response.json()
                organic = data.get("organic", [])
                logger.info(f"Serper search successful, found {len(organic)} results")
                _debug_log(f"[search_web] Serper returned {len(organic)} results")
                return [
                    {
                        "title": item.get("title", ""),
                        "url": item.get("link", ""),
                        "content": item.get("snippet", ""),
                    }
                    for item in organic
                ]
            logger.warning(f"Serper search returned status {response.status_code}: {response.text}")
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Serper search failed: {exc}")
        return []

    tasks: List[tuple[str, asyncio.Task[List[dict]]]] = []
    if TAVILY_API_KEY:
        tasks.append(("tavily", asyncio.create_task(_search_tavily())))
    if SERPER_API_KEY:
        tasks.append(("serper", asyncio.create_task(_search_serper())))

    if not tasks:
        logger.warning("No search providers configured. Returning empty results.")
        return []

    results_by_priority: dict[str, List[dict]] = {label: [] for label, _ in tasks}
    responses = await asyncio.gather(*(task for _, task in tasks), return_exceptions=True)
    for (label, _), response in zip(tasks, responses, strict=True):
        if isinstance(response, Exception):
            logger.error(f"Search task '{label}' raised an exception: {response}")
            continue
        results_by_priority[label] = response

    merged_results: List[dict] = []
    seen_urls: set[str] = set()
    for label in ("tavily", "serper"):
        for item in results_by_priority.get(label, []):
            url = item.get("url") or item.get("link") or ""
            if url and url not in seen_urls:
                merged_results.append(item)
                seen_urls.add(url)

    if merged_results:
        logger.info(f"Search aggregation complete. Returning {len(merged_results)} merged results")
        _debug_log(f"[search_web] merged unique results={len(merged_results)}")
        return merged_results

    logger.warning("All search providers returned empty results")
    return []


# summarize_with_ai 関数はロジックをそのまま維持し、API呼び出しのみ変更

async def filter_universities_by_conditions(
    universities: List[dict],
    filters: Dict[str, str],
    progress_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
    university_callback: Optional[Callable[[dict], Awaitable[None]]] = None,
) -> List[dict]:
    """
    Filter universities based on search conditions using AI verification
    """
    if not HF_API_KEY:
        logger.warning("No Hugging Face API key configured for filtering")
        return universities

    if not universities:
        return universities

    logger.info(f"Filtering {len(universities)} universities with AI verification")

    async def _emit_progress(stage: str, detail: Optional[Dict[str, Any]] = None) -> None:
        if progress_callback is None:
            return
        payload = {"stage": stage}
        if detail:
            payload.update(detail)
        await progress_callback(payload)

    await _emit_progress("filtering", {"total": len(universities)})

    # Parallel filtering of universities
    semaphore = asyncio.Semaphore(5)  # Limit concurrent AI calls to avoid rate limits

    async def _filter_single_university(university: dict) -> Optional[dict]:
        async with semaphore:
            # Build verification prompt
            system_prompt = """あなたは日本の大学受験アドバイザーです。
与えられた大学情報と検索条件を比較し、この大学が条件に合っているかを判定してください。
回答は必ずJSON形式で、{"matches": true/false, "reason": "理由の説明"} の形式にしてください。"""

            university_info = f"""
大学名: {university.get('name', '')}
学部: {university.get('faculty', '')}
学科: {university.get('department', '')}
偏差値: {university.get('deviationScore', '')}
共テ得点率: {university.get('commonTestScore', '')}
入試形態: {university.get('examType', '')}
必要科目: {', '.join(university.get('requiredSubjects', []))}
地域: {university.get('region', '')}
都道府県: {university.get('prefecture', '')}
"""

            search_conditions = f"""
検索条件:
地域: {filters.get('region', '')}
学部: {filters.get('faculty', '')}
入試形態: {filters.get('exam_type', '')}
共通テスト利用: {filters.get('use_common_test', '')}
偏差値: {filters.get('deviation_score', '')}
機関種別: {filters.get('institution_type', '')}
都道府県: {filters.get('prefecture', '')}
大学名キーワード: {filters.get('name_keyword', '')}
共テ得点率: {filters.get('common_test_score', '')}
英語外部試験: {filters.get('external_english', '')}
必要科目: {filters.get('required_subjects', '')}
学費上限: {filters.get('tuition_max', '')}
奨学金: {filters.get('scholarship', '')}
資格取得: {filters.get('qualification', '')}
入試日程: {filters.get('exam_schedule', '')}
"""

            user_prompt = f"""以下の大学情報と検索条件を比較し、この大学が検索条件に合っているかを判定してください。

{university_info}

{search_conditions}

条件に合っている場合は true、合っていない場合は false を返してください。
判定理由も簡潔に説明してください。"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]

            try:
                response_data = await query_hf_inference(messages, max_retries=2, initial_delay=0.5)

                if not response_data or not response_data.get('choices'):
                    logger.warning(f"Invalid AI response for university {university.get('name', '')}")
                    return None

                content = response_data['choices'][0]['message']['content']

                # Extract JSON
                start_idx = content.find('{')
                end_idx = content.rfind('}') + 1

                if start_idx == -1 or end_idx == 0:
                    logger.warning(f"Could not find JSON in filtering response for {university.get('name', '')}")
                    return None

                json_str = content[start_idx:end_idx]
                result = json.loads(json_str)

                matches = result.get('matches', False)
                reason = result.get('reason', '')

                logger.debug(f"Filtering result for {university.get('name', '')}: matches={matches}, reason={reason}")

                if matches:
                    return university
                return None

            except Exception as e:
                logger.warning(f"Failed to filter university {university.get('name', '')}: {str(e)}")
                # If filtering fails, include the university to avoid losing data
                return university

    # Execute filtering in parallel and emit results as they complete
    filtering_tasks = [_filter_single_university(uni) for uni in universities]
    
    # Process results as they complete for streaming
    filtered_universities = []
    completed_count = 0
    
    for coro in asyncio.as_completed(filtering_tasks):
        try:
            result = await coro
            completed_count += 1
            
            if result is not None:
                filtered_universities.append(result)
                # Emit progress for each completed filtering
                await _emit_progress("filtering", {
                    "current": completed_count, 
                    "total": len(universities),
                    "filtered_count": len(filtered_universities)
                })
                # Send individual university result if callback provided
                if university_callback is not None:
                    await university_callback(result)
        except Exception as e:
            logger.warning(f"Exception in filtering task: {e}")
            completed_count += 1
            # On exception, we can't determine which university, so skip progress update

    return filtered_universities

async def summarize_with_ai(search_results: List[dict], query: str):
    """
    Use Hugging Face model to summarize search results into structured university data
    """
    
    # Format search results as text
    results_text = ""
    for i, result in enumerate(search_results[:25], 1):  # Use up to first 25 results for broader coverage
        title = result.get("title", "No title")
        url = result.get("url", "No URL")
        content = result.get("content", "No content")
        # 500文字制限
        results_text += f"Result {i}:\nTitle: {title}\nURL: {url}\nContent: {content[:500]}...\n\n" 

    _debug_log(f"[summarize_with_ai] results_text length={len(results_text)} characters")

    # Create prompt for the model
    system_prompt = """あなたは日本の大学受験に詳しいアドバイザーです。
与えられた検索結果から正確な情報を抽出
し、指定されたJSON形式で返してください。
情報が不足している場合は、推測せずに空文字列や空配列を使用してください。
回答には、JSON形式のデータ以外、余分なテキストは含めないでください。"""

    guidelines = dedent(
        """
        方針
        - 同一大学でも「学部が異なる」または「入試形態が異なる」場合は、別の要素として出力してください（学部バリエーション/方式バリエーションを可視化）。
        - 情報源は PassNavi（passnavi.obunsha.co.jp）と Kei-Net（keinet.ne.jp）を優先し、可能であれば sources にそれらのURLを1つ以上含めてください。
        - 公式サイト（*.ac.jp）の入試情報/要項/admissionsページも信頼できます。sources には必ず公式サイトURLを1件含めてください。
        - sources には信頼できる入試情報サイト（PassNavi: https://passnavi.obunsha.co.jp, Kei-Net: https://keinet.ne.jp）のURLを必ず含めてください。これらのサイトからの情報が使用された場合は、対応するURLをsourcesに追加してください。
        - 不明な項目は空文字列や空配列のままにしてください（推測禁止）。
        - "deviationScore"（偏差値）は信頼できる情報源（PassNavi、Kei-Net、公式サイト）からの情報のみを使用してください。信頼できないソースからの偏差値は記載しないでください。
        - "aiSummary" には、複数の情報源から得られた具体的な事実を最低でも2つ含めてください。（例: 学部の特色 + 入試方式/配点 + キャンパスの特徴）。単なる繰り返しや曖昧な表現は避け、実際の検索結果から得られた内容を簡潔に統合してください。
        - "examSchedules" には「願書受付」「出願締切」「試験日」「合格発表」などの日程を時系列で列挙してください。
        - "admissionMethods" には "一般選抜" や "総合型選抜" などの方式名を列挙し、必要であれば配点や特徴を併記してください。
        - "subjectHighlights" には各科目の配点比率や必須/選択区分などの入試に特化した情報を列挙してください。
        - "commonTestRatio" が判明している場合は百分率や「○割」といった形式で記載してください。
        - "selectionNotes" には特記事項（再受験可否、面接の有無、出願条件など）を記載してください。
        - "applicationDeadline" には願書提出の締切日を記載してください。
        - "institutionType" には大学の種類（国立/公立/私立）を必ず記載してください。公式サイトのドメイン（*.ac.jp）から判断し、国立大学は「国立」、公立大学は「公立」、それ以外は「私立」と設定してください。
        """
    ).strip()

    user_prompt = dedent(
        f"""以下の検索結果から、大学情報を抽出して構造化してください。

検索クエリ: {query}

検索結果:
{results_text}

{guidelines}

以下のJSON形式で、見つかった大学情報を配列で返してください（最大20件）。異なる大学を優先しつつ、同一大学内の学部/入試形態のバリエーションも含め、重複は避けてください。

出力はJSON配列のみとし、それ以外のテキストは一切含めないでください。JSONの前に説明文や```jsonは不要です。直接[で始まるJSON配列を返してください。"""
    ).strip()

    user_prompt = f"{user_prompt}\n\n{JSON_OUTPUT_EXAMPLE}"

    _debug_log("[summarize_with_ai] constructed user prompt for Hugging Face model")

    # Hugging FaceのChat Completions APIに渡すメッセージ形式
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        logger.debug("Calling Hugging Face Chat API for summarization...")
        _debug_log("[summarize_with_ai] requesting Hugging Face completion")
        
        # 呼び出し関数をquery_hf_inferenceに変更
        response_data = await query_hf_inference(messages)
        
        # Extract the generated text from the response
        if not response_data or not response_data.get('choices'):
            raise ValueError("Invalid response format from Hugging Face API")
            
        content = response_data['choices'][0]['message']['content']
        
        # Clean up the response - extract just the JSON part
        start_idx = content.find('[')
        end_idx = content.rfind(']') + 1
        
        # ... (JSONパースロジックは変更なし)
        if start_idx == -1 or end_idx == 0:
            # モデルによっては、JSONの前に説明文を追加することがあるため、柔軟に処理
            logger.warning("Could not find JSON array in response. Attempting to clean...")
            # もしJSONコードブロックとして返された場合（例: ```json[...]```）
            if content.strip().startswith('```') and content.strip().endswith('```'):
                content = content.strip()[content.strip().find('\n')+1 : content.strip().rfind('```')].strip()
                start_idx = content.find('[')
                end_idx = content.rfind(']') + 1
                if start_idx != -1 and end_idx != 0:
                    json_str = content[start_idx:end_idx]
                else:
                    # Try to find any JSON-like structure
                    import re
                    json_match = re.search(r'\[.*\]', content, re.DOTALL)
                    if json_match:
                        json_str = json_match.group()
                    else:
                        raise ValueError("Could not find JSON array in response even after code block cleaning")
            else:
                # Try to find any JSON-like structure
                import re
                json_match = re.search(r'\[.*\]', content, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                else:
                    raise ValueError("Could not find JSON array in response")

        else:
            json_str = content[start_idx:end_idx]
        
        logger.debug(f"Raw AI response: {json_str}")
        
        # Parse the JSON
        universities = json.loads(json_str)
        if not isinstance(universities, list):
            universities = [universities]
            
        logger.info(f"AI summarization successful, extracted {len(universities)} universities")
        _debug_log(f"[summarize_with_ai] extracted {len(universities)} universities from response")
        return universities
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {str(e)}")
        logger.debug(f"Problematic content: {content if 'content' in locals() else 'N/A'}")
        _debug_log(f"[summarize_with_ai] JSON decode error: {str(e)}")
    except Exception as e:
        logger.error(f"AI summarization failed: {str(e)}")
        _debug_log(f"[summarize_with_ai] summarization exception: {str(e)}")
        
    # Fall back to mock data if anything goes wrong
    return generate_mock_universities()


# generate_mock_universities 関数は変更なし

def generate_mock_universities() -> List[dict]:
    # ... (モックデータ生成関数は変更なし)
    """
    Generate mock university data for testing
    """
    return [
        {
            "id": "1",
            "name": "東京大学",
            "officialUrl": "https://www.u-tokyo.ac.jp/",
            "faculty": "工学部",
            "department": "情報工学科",
            "deviationScore": "70-75",
            "commonTestScore": "90-95%",
            "examType": "一般選抜",
            "requiredSubjects": ["数学", "理科", "英語"],
            "examDate": "2025年2月25日",
            "examSchedules": [
                "願書受付: 2024年12月1日",
                "出願締切: 2025年1月15日",
                "試験日: 2025年2月25日",
                "合格発表: 2025年3月10日",
            ],
            "admissionMethods": ["一般選抜: 前期日程 3教科型", "共通テスト利用型: 数学・英語重視"],
            "subjectHighlights": ["数学: 200点", "理科: 150点 (物理/化学)", "英語: 150点"],
            "commonTestRatio": "共通テスト60% / 個別試験40%",
            "selectionNotes": "共通テスト利用型は英語外部検定を換算可",
            "applicationDeadline": "2025年1月15日",
            "aiSummary": "日本最高峰の研究環境。世界的な研究者が多数在籍し、最先端の教育を受けられる。",
            "sources": ["https://www.u-tokyo.ac.jp/"]
        },
        {
            "id": "2",
            "name": "京都大学",
            "officialUrl": "https://www.kyoto-u.ac.jp/",
            "faculty": "工学部",
            "department": "情報学科",
            "deviationScore": "68-73",
            "commonTestScore": "88-93%",
            "examType": "一般選抜",
            "requiredSubjects": ["数学", "理科", "英語"],
            "examDate": "2025年2月25日",
            "examSchedules": [
                "願書受付: 2024年12月10日",
                "出願締切: 2025年1月20日",
                "試験日: 2025年2月25日",
            ],
            "admissionMethods": ["一般選抜: 前期日程", "共通テスト利用型: 5教科7科目"],
            "subjectHighlights": ["数学: 200点", "理科: 200点", "英語: 150点"],
            "commonTestRatio": "共通テスト70% / 個別試験30%",
            "selectionNotes": "第二段階選抜で面接あり",
            "applicationDeadline": "2025年1月20日",
            "aiSummary": "自由な学風と高い研究力。ノーベル賞受賞者も多数輩出している名門大学。",
            "sources": ["https://www.kyoto-u.ac.jp/"]
        },
        {
            "id": "3",
            "name": "大阪大学",
            "officialUrl": "https://www.osaka-u.ac.jp/",
            "faculty": "基礎工学部",
            "department": "情報科学科",
            "deviationScore": "65-70",
            "commonTestScore": "85-90%",
            "examType": "一般選抜",
            "requiredSubjects": ["数学", "理科", "英語"],
            "examDate": "2025年2月24日",
            "examSchedules": [
                "願書受付: 2024年12月5日",
                "出願締切: 2025年1月18日",
                "試験日: 2025年2月24日",
            ],
            "admissionMethods": ["一般選抜: 前期/後期", "共通テスト利用型: 5教科"],
            "subjectHighlights": ["数学: 180点", "理科: 180点", "英語: 140点"],
            "commonTestRatio": "共通テスト55% / 個別試験45%",
            "selectionNotes": "共通テスト利用型は出願資格に外部英語試験不要",
            "applicationDeadline": "2025年1月18日",
            "aiSummary": "情報科学分野で国内有数の研究環境と企業連携を有する。",
            "sources": ["https://www.osaka-u.ac.jp/"],
            "institutionType": "国立",
        },
        {
            "id": "4",
            "name": "東北大学",
            "officialUrl": "https://www.tohoku.ac.jp/",
            "faculty": "工学部",
            "department": "情報知能システム総合学科",
            "deviationScore": "62-67",
            "commonTestScore": "82-88%",
            "examType": "一般選抜",
            "requiredSubjects": ["数学", "理科", "英語"],
            "examDate": "2025年2月26日",
            "examSchedules": [
                "願書受付: 2024年12月8日",
                "出願締切: 2025年1月21日",
                "試験日: 2025年2月26日",
            ],
            "admissionMethods": ["一般選抜: 前期", "AO入試: 総合型選抜"],
            "subjectHighlights": ["数学: 150点", "理科: 150点", "英語: 120点"],
            "commonTestRatio": "共通テスト50% / 個別試験50%",
            "selectionNotes": "AO入試は志望理由書提出が必要",
            "applicationDeadline": "2025年1月21日",
            "aiSummary": "実学重視の研究で評価が高い。AI・ロボティクス分野も充実。",
            "sources": ["https://www.tohoku.ac.jp/"],
            "institutionType": "国立",
        },
        {
            "id": "5",
            "name": "早稲田大学",
            "officialUrl": "https://www.waseda.jp/",
            "faculty": "基幹理工学部",
            "department": "情報理工学科",
            "deviationScore": "60-65",
            "commonTestScore": "80-85%",
            "examType": "一般選抜",
            "requiredSubjects": ["数学", "理科", "英語"],
            "examDate": "2025年2月20日",
            "examSchedules": [
                "願書受付: 2024年12月15日",
                "出願締切: 2025年1月25日",
                "試験日: 2025年2月20日",
            ],
            "admissionMethods": ["一般選抜: 3教科型", "共通テスト利用型: ボーダーフリー方式"],
            "subjectHighlights": ["数学: 150点", "英語: 150点", "理科: 150点"],
            "commonTestRatio": "共通テスト40% / 個別試験60%",
            "selectionNotes": "共通テスト利用型はボーダーフリー方式あり",
            "applicationDeadline": "2025年1月25日",
            "aiSummary": "私学トップクラスの理工系。幅広い分野と国際連携が魅力。",
            "sources": ["https://www.waseda.jp/"],
            "institutionType": "私立",
        },
        {
            "id": "6",
            "name": "慶應義塾大学",
            "officialUrl": "https://www.keio.ac.jp/",
            "faculty": "理工学部",
            "department": "情報工学科",
            "deviationScore": "62-67",
            "commonTestScore": "82-87%",
            "examType": "一般選抜",
            "requiredSubjects": ["数学", "理科", "英語"],
            "examDate": "2025年2月18日",
            "examSchedules": [
                "願書受付: 2024年12月12日",
                "出願締切: 2025年1月22日",
                "試験日: 2025年2月18日",
            ],
            "admissionMethods": ["一般選抜: 前期・後期", "共通テスト利用型: 高得点科目重視"],
            "subjectHighlights": ["数学: 180点", "英語: 180点", "理科: 140点"],
            "commonTestRatio": "共通テスト50% / 個別試験50%",
            "selectionNotes": "共通テスト利用型は英語外部試験加点あり",
            "applicationDeadline": "2025年1月22日",
            "aiSummary": "産業界との結びつきが強く実践的。研究環境と就職に強み。",
            "sources": ["https://www.keio.ac.jp/"],
            "institutionType": "私立",
        },
        {
            "id": "1",
            "name": "東京工業大学",
            "officialUrl": "https://www.titech.ac.jp/",
            "faculty": "情報理工学院",
            "department": "情報工学系",
            "deviationScore": "65-70",
            "commonTestScore": "85-90%",
            "examType": "一般選抜",
            "requiredSubjects": ["数学", "理科", "英語"],
            "examDate": "2025年2月25日",
            "examSchedules": [
                "願書受付: 2024年12月1日",
                "出願締切: 2025年1月15日",
                "試験日: 2025年2月25日",
                "合格発表: 2025年3月10日",
            ],
            "admissionMethods": ["一般選抜: 前期日程 3教科型", "共通テスト利用型: 数学・英語重視"],
            "subjectHighlights": ["数学: 200点", "理科: 150点", "英語: 150点"],
            "commonTestRatio": "共通テスト60% / 個別試験40%",
            "selectionNotes": "共通テスト利用型は英語外部検定を換算可",
            "applicationDeadline": "2025年1月15日",
            "institutionType": "国立",
            "aiSummary": "情報工学分野で日本トップクラスの研究環境を誇る。AI・機械学習の研究が盛んで、産学連携も充実。",
            "sources": ["https://www.titech.ac.jp/", "https://admissions.titech.ac.jp/"],
        },
        {
            "id": "2",
            "name": "早稲田大学",
            "officialUrl": "https://www.waseda.jp/",
            "faculty": "基幹理工学部",
            "department": "情報理工学科",
            "deviationScore": "60-65",
            "commonTestScore": "80-85%",
            "examType": "一般選抜",
            "requiredSubjects": ["数学", "理科", "英語"],
            "examDate": "2025年2月20日",
            "examSchedules": [
                "願書受付: 2024年12月15日",
                "出願締切: 2025年1月25日",
                "試験日: 2025年2月20日",
            ],
            "admissionMethods": ["一般選抜: 3教科型", "共通テスト利用型: ボーダーフリー方式"],
            "subjectHighlights": ["数学: 150点", "英語: 150点", "理科: 150点"],
            "commonTestRatio": "共通テスト40% / 個別試験60%",
            "selectionNotes": "共通テスト利用型はボーダーフリー方式あり",
            "applicationDeadline": "2025年1月25日",
            "institutionType": "私立",
            "aiSummary": "伝統ある私立大学の理工学部。幅広い分野の研究が可能で、就職実績も良好。国際交流プログラムも充実。",
            "sources": ["https://www.waseda.jp/"],
        },
        {
            "id": "3",
            "name": "慶應義塾大学",
            "officialUrl": "https://www.keio.ac.jp/",
            "faculty": "理工学部",
            "department": "情報工学科",
            "deviationScore": "62-67",
            "commonTestScore": "82-87%",
            "examType": "一般選抜",
            "requiredSubjects": ["数学", "理科", "英語"],
            "examDate": "2025年2月18日",
            "examSchedules": [
                "願書受付: 2024年12月12日",
                "出願締切: 2025年1月22日",
                "試験日: 2025年2月18日",
            ],
            "admissionMethods": ["一般選抜: 前期・後期", "共通テスト利用型: 高得点科目重視"],
            "subjectHighlights": ["数学: 180点", "英語: 180点", "理科: 140点"],
            "commonTestRatio": "共通テスト50% / 個別試験50%",
            "selectionNotes": "共通テスト利用型は英語外部試験加点あり",
            "applicationDeadline": "2025年1月22日",
            "institutionType": "私立",
            "aiSummary": "総合力の高い理工学部。産業界とのつながりが強く、実践的な教育が特徴。キャンパス環境も優れている。",
            "sources": ["https://www.keio.ac.jp/"],
        },
    ]


# Regional university mappings for broader coverage
REGIONAL_UNIVERSITIES = {
    "北海道": [
        "北海道大学", "北海道教育大学", "室蘭工業大学", "小樽商科大学", "帯広畜産大学",
        "北見工業大学", "旭川医科大学", "札幌医科大学", "札幌市立大学", "北海道科学大学"
    ],
    "東北": [
        "東北大学", "弘前大学", "岩手大学", "秋田大学", "山形大学", "福島大学",
        "宮城教育大学", "東北工業大学", "東北学院大学", "仙台白百合女子大学"
    ],
    "関東": [
        "東京大学", "東京工業大学", "一橋大学", "東京医科歯科大学", "東京外国語大学",
        "東京農工大学", "電気通信大学", "東京海洋大学", "東京芸術大学", "政策研究大学院大学",
        "早稲田大学", "慶應義塾大学", "明治大学", "立教大学", "中央大学", "法政大学",
        "東京理科大学", "青山学院大学", "学習院大学", "明治学院大学", "獨協大学",
        "成城大学", "成蹊大学", "日本大学", "東洋大学", "駒澤大学", "専修大学",
        "國學院大學", "大東文化大学", "亜細亜大学", "東京経済大学", "武蔵大学",
        "東京都市大学", "東京電機大学", "工学院大学", "芝浦工業大学", "日本工業大学"
    ],
    "中部": [
        "名古屋大学", "岐阜大学", "静岡大学", "愛知教育大学", "豊橋技術科学大学",
        "名古屋工業大学", "豊田工業大学", "名古屋市立大学", "金沢大学", "富山大学",
        "福井大学", "新潟大学", "長岡技術科学大学", "山梨大学", "信州大学",
        "名古屋外国語大学", "中京大学", "南山大学", "名城大学", "愛知大学",
        "愛知工業大学", "愛知学院大学", "豊田工業大学", "日本福祉大学"
    ],
    "近畿": [
        "京都大学", "大阪大学", "神戸大学", "大阪市立大学", "大阪府立大学",
        "兵庫県立大学", "奈良女子大学", "滋賀大学", "和歌山大学", "京都府立大学",
        "京都工芸繊維大学", "京都教育大学", "大阪教育大学", "関西大学", "関西学院大学",
        "同志社大学", "立命館大学", "龍谷大学", "佛教大学", "京都産業大学",
        "近畿大学", "大阪工業大学", "大阪電気通信大学", "摂南大学", "甲南大学",
        "神戸学院大学", "大手前大学", "桃山学院大学", "追手門学院大学"
    ],
    "中国": [
        "広島大学", "岡山大学", "鳥取大学", "島根大学", "山口大学",
        "広島市立大学", "尾道市立大学", "岡山県立大学", "広島修道大学",
        "広島経済大学", "安田女子大学", "福山大学", "山陽女子短期大学"
    ],
    "四国": [
        "徳島大学", "香川大学", "愛媛大学", "高知大学", "鳴門教育大学",
        "四国大学", "松山大学", "高知工科大学", "徳島文理大学"
    ],
    "九州": [
        "九州大学", "北九州大学", "熊本大学", "鹿児島大学", "長崎大学",
        "大分大学", "佐賀大学", "琉球大学", "宮崎大学", "鹿屋体育大学",
        "九州工業大学", "福岡大学", "西南学院大学", "九州産業大学",
        "久留米大学", "長崎国際大学", "熊本県立大学", "宮崎産業経営大学"
    ],
    "沖縄": [
        "琉球大学", "沖縄国際大学", "沖縄大学", "名桜大学", "沖縄キリスト教学院大学"
    ]
}


async def search_universities(
    region: str = "",
    faculty: str = "",
    exam_type: str = "",
    use_common_test: str = "",
    deviation_score: str = "",
    institution_type: str = "",
    prefecture: str = "",
    name_keyword: str = "",
    common_test_score: str = "",
    external_english: str = "",
    required_subjects: str = "",
    tuition_max: str = "",
    scholarship: str = "",
    qualification: str = "",
    exam_schedule: str = "",
    progress_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
    university_callback: Optional[Callable[[dict], Awaitable[None]]] = None,
) -> List[dict]:
    # ... (メイン検索関数は変更なし)
    """
    Main search function
    Searches web and returns structured university data
    """
    logger.info(f"Starting university search with filters: region={region}, faculty={faculty}")

    async def _emit_progress(stage: str, detail: Optional[Dict[str, Any]] = None) -> None:
        if progress_callback is None:
            return
        payload = {"stage": stage}
        if detail:
            payload.update(detail)
        _debug_log(f"[search_universities] progress stage={stage} detail={detail}")
        await progress_callback(payload)

    # Initialize optimal model selection
    selected_model = await initialize_model()
    logger.info(f"Using AI model: {selected_model}")
    await _emit_progress("model_selected", {"model": selected_model})

    # Build search query
    query_parts = ["大学"]

    if region:
        query_parts.append(f"{region}地方 大学")
    if prefecture:
        query_parts.append(f"{prefecture} 大学")
    if faculty:
        query_parts.append(f"{faculty} 学部")
    else:
        query_parts.append("学部 入試情報")
    if institution_type:
        query_parts.append(f"{institution_type} 大学")
    if exam_type:
        query_parts.append(f"入試方式 {exam_type}")
    if use_common_test == "あり":
        query_parts.append("共通テスト利用")
    if use_common_test == "なし":
        query_parts.append("共通テスト非利用")
    if deviation_score:
        query_parts.append(f"偏差値 {deviation_score}")
    if common_test_score:
        query_parts.append(f"共通テスト得点率 {common_test_score}")
    if external_english == "あり":
        query_parts.append("英語外部試験 利用")
    if external_english == "不要":
        query_parts.append("英語外部試験 不要")
    if required_subjects:
        query_parts.append(f"必要科目 {required_subjects}")
    if tuition_max:
        query_parts.append(f"学費上限 {tuition_max}")
    if scholarship == "あり":
        query_parts.append("奨学金制度 あり")
    if qualification:
        query_parts.append(f"{qualification} 取得可能")
    if name_keyword:
        query_parts.append(f"{name_keyword} 公式")

    if exam_schedule:
        query_parts.append(f"入試日程 {exam_schedule}")

    query = " ".join(query_parts) + " 入試情報"
    logger.info(f"Generated search query: {query}")
    await _emit_progress("query_built", {"query": query})

    # Search web across multiple reputable sources
    site_domains = [
        "passnavi.evidus.com",   # 旺文社パスナビ
        "keinet.ne.jp",          # 河合塾 Kei-Net
        "manabi.benesse.ne.jp",  # ベネッセ マナビジョン
        "www.toshin.com",        # 東進
        "yozemi.ac.jp",          # 代々木ゼミナール
        "www.dnc.ac.jp",         # 大学入試センター
    ]

    queries = [query] + [f"{query} site:{domain}" for domain in site_domains]

    # Add official university domain patterns (generic) for entrance info
    official_patterns = [
        "入試情報",
        "admissions",
        "入試 要項",
        "入試案内",
        "entrance",
        "nyushi",
        "入学試験",
    ]
    for kw in official_patterns:
        queries.append(f"{query} site:*.ac.jp {kw}")

    # Add regional university specific queries for broader coverage
    if region and region in REGIONAL_UNIVERSITIES:
        regional_unis = REGIONAL_UNIVERSITIES[region][:15]  # Top 15 universities per region
        for uni_name in regional_unis:
            queries.append(f"{uni_name} {faculty if faculty else '学部'} 入試情報")
            if faculty:
                queries.append(f"{uni_name} {faculty} 入試情報 偏差値")
            queries.append(f"{uni_name} 入試方式 site:*.ac.jp")

    # If a specific university keyword is provided, bias towards official pages
    if name_keyword:
        for kw in official_patterns:
            queries.append(f"{name_keyword} site:*.ac.jp {kw}")
        # Also add a general official bias without site restriction
        queries.append(f"{name_keyword} 公式 入試情報")

    # Limit queries to prevent excessive API calls
    queries = queries[:50]  # Maximum 50 queries to balance coverage and efficiency

    aggregated_results: List[dict] = []
    seen_urls = set()

    async def _run_single_query(idx: int, q: str) -> None:
        try:
            await _emit_progress("searching", {"current": idx, "total": len(queries), "query": q})
            results = await search_web(q)
            for item in results:
                url = item.get("url") or item.get("link") or ""
                if url and url not in seen_urls:
                    aggregated_results.append(item)
                    seen_urls.add(url)
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"Search failed for query '{q}': {exc}")

    # Execute queries with controlled concurrency to improve throughput
    semaphore = asyncio.Semaphore(10)

    async def _bounded_query(idx: int, q: str) -> None:
        async with semaphore:
            await _run_single_query(idx, q)

    await asyncio.gather(*(_bounded_query(index, q) for index, q in enumerate(queries, start=1)))

    await _emit_progress("search_complete", {"results": len(aggregated_results)})

    # Prioritize trusted sources (PassNavi/Kei-Net), then official (*.ac.jp), then others
    def _priority(u: str) -> int:
        if not u:
            return 0
        if "passnavi.obunsha.co.jp" in u:
            return 200  # Increased priority for PassNavi
        if "keinet.ne.jp" in u:
            return 180  # Increased priority for Kei-Net
        if "www.dnc.ac.jp" in u:  # 大学入試センター（公式）
            return 150
        if u.endswith(".ac.jp") or ".ac.jp/" in u:
            return 120
        if "yozemi.ac.jp" in u:  # 代々木ゼミナール（信頼できる予備校）
            return 100
        return 10

    aggregated_results.sort(key=lambda r: _priority(r.get("url") or r.get("link") or ""), reverse=True)
    search_results = aggregated_results

    # Summarize with AI
    await _emit_progress("summarizing", {"sources": len(search_results)})
    joined_query = " | ".join(queries)
    raw_universities = await summarize_with_ai(search_results, joined_query)
    _debug_log(f"[search_universities] summarize_with_ai returned {len(raw_universities)} entries for '{joined_query[:80]}'")
    universities = [_normalize_university_entry(uni) for uni in raw_universities]
    for uni in universities:
        official = uni.get("officialUrl")
        if official and official not in uni["sources"]:
            uni["sources"].insert(0, official)
    await _emit_progress("summarize_complete", {"count": len(universities)})

    # Filter universities by search conditions using AI
    filters_dict = {
        "region": region,
        "faculty": faculty,
        "exam_type": exam_type,
        "use_common_test": use_common_test,
        "deviation_score": deviation_score,
        "institution_type": institution_type,
        "prefecture": prefecture,
        "name_keyword": name_keyword,
        "common_test_score": common_test_score,
        "external_english": external_english,
        "required_subjects": required_subjects,
        "tuition_max": tuition_max,
        "scholarship": scholarship,
        "qualification": qualification,
        "exam_schedule": exam_schedule,
    }
    universities = await filter_universities_by_conditions(universities, filters_dict, progress_callback, university_callback)

    # Deduplicate by (name, faculty, examType) keeping entries with preferred sources
    def _src_score(urls: list) -> int:
        score = 0
        for u in urls or []:
            if not isinstance(u, str):
                continue
            if "passnavi.obunsha.co.jp" in u:
                score += 100
            elif "keinet.ne.jp" in u:
                score += 90
            elif "www.dnc.ac.jp" in u:  # 大学入試センター（公式）
                score += 85
            elif u.endswith(".ac.jp") or ".ac.jp/" in u:
                score += 80
            elif "yozemi.ac.jp" in u:  # 代々木ゼミナール（信頼できる予備校）
                score += 75
            else:
                score += 10
        return score

    dedup: dict = {}
    for uni in universities:
        name = (uni.get("name") or "").strip()
        faculty_val = (uni.get("faculty") or "").strip()
        exam_val = (uni.get("examType") or "").strip()
        key = (name, faculty_val, exam_val)
        current_best = dedup.get(key)
        if current_best is None:
            dedup[key] = uni
        else:
            if _src_score(uni.get("sources")) > _src_score(current_best.get("sources")):
                dedup[key] = uni

    universities = list(dedup.values())

    # Sort by name, faculty, examType
    universities.sort(key=lambda x: ((x.get("name") or ""), (x.get("faculty") or ""), (x.get("examType") or "")))
    
    logger.info(f"University search completed, returning {len(universities)} results")
    await _emit_progress("completed", {"count": len(universities)})
    return universities


# --- 実行例 ---
async def main():
    # 🚨 【修正箇所】環境変数のチェックはそのまま
    if not os.getenv("HF_API_KEY"):
        print("環境変数 'HF_API_KEY' が設定されていません。")
        return
        
    if not os.getenv("TAVILY_API_KEY") and not os.getenv("SERPER_API_KEY"):
        print("環境変数 'TAVILY_API_KEY' または 'SERPER_API_KEY' のいずれかを設定してください。")
        return
        
    print("--- 大学情報検索サービスを実行中 ---")
    
    # 例として、特定の条件で検索
    try:
        results = await search_universities(
            region="関東",
            faculty="情報科学部",
            exam_type="一般選抜",
            deviation_score="65以上"
        )
        print("\n--- 検索結果 (JSON) ---")
        print(json.dumps(results, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"\nメイン実行エラー: {e}")

if __name__ == "__main__":
    # 非同期実行
    # 実際のアプリケーションでは、この部分はウェブフレームワークに組み込まれます。
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"最上位の実行エラー: {e}")