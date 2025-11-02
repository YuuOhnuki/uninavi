"""
AI Chat Service
Provides career counseling using Hugging Face Chat Completions API
"""

import os
import logging
import json
import asyncio
from typing import AsyncIterator, Dict, List
import httpx

# 💡 .envから環境変数をロードするためにdotenvライブラリを追加
from dotenv import load_dotenv # 👈 追加

# 🚨 【修正】環境変数ロード
load_dotenv() # 👈 追加: .envファイルから環境変数を読み込む

# ロギング設定
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO) # 必要に応じてDEBUGに変更

# 🚨 【修正箇所】Hugging Face Chat Completions API configuration
# 📝 サンプルコードに合わせてURLとモデルを更新
HF_API_KEY = os.getenv("HF_API_KEY", "")
# Chat Completions APIのURL
HUGGINGFACE_API_URL = "https://router.huggingface.co/v1/chat/completions"
# Chat Completions APIで利用可能な日本語に強いInstructモデル
HUGGINGFACE_MODEL_ID = os.getenv("HF_MODEL_ID", "MiniMaxAI/MiniMax-M2:novita") # サンプルコードと同じモデル名を使用

logger.info(f"Chat service initialized, using model: {HUGGINGFACE_MODEL_ID}")

# --- API呼び出し関数 ---
# 🚨 【修正箇所】Hugging Face Chat Completions APIのクエリ関数
async def query_hf_inference_chat(messages: List[Dict[str, str]]) -> str:
    """
    Send chat messages to Hugging Face Chat Completions API and get response
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
        "model": HUGGINGFACE_MODEL_ID,
        "temperature": 0.7,
        "max_tokens": 1000, # Chat Completionsではmax_new_tokensではなくmax_tokensを使用
        "top_p": 0.9,
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                HUGGINGFACE_API_URL, # 修正されたURLを使用
                headers=headers,
                json=payload,
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'choices' in result and result['choices'] and 'message' in result['choices'][0]:
                    # 応答からメッセージの内容を抽出して返却
                    return result['choices'][0]['message']['content'].strip()
                else:
                    logger.error(f"Unexpected response format: {result}")
                    raise ValueError("Unexpected response format from Hugging Face API")
            else:
                logger.error(f"HF Chat API error: {response.status_code} - {response.text}")
                response.raise_for_status()
                
        except Exception as e:
            logger.error(f"Error querying HF Chat API: {str(e)}")
            raise

# --- ユーザーとのチャットロジック関数 ---
def _build_chat_messages(message: str, history: List[dict]) -> List[Dict[str, str]]:
    """Create chat completion payload messages shared across streaming and non-streaming flows."""
    messages: List[Dict[str, str]] = [
        {
            "role": "system",
            "content": """あなたは日本の高校生向けの進路相談アドバイザーです。
以下のガイドラインに従って、親しみやすく、かつ検索最適化された提案を行ってください：

1. 生徒の興味・関心や得意科目から、適した学部・学科を提案する
2. 具体的な大学名を挙げる場合は、有名大学や地域を意識した候補を3-5校程度紹介する
3. **回答は100-200文字程度にまとめ、過度に短くしすぎない**
4. 必要に応じてMarkdownの見出し・箇条書き・番号付きリストを活用し、構造化して分かりやすく提示する
5. 生徒の質問内容に応じて、都道府県・地方・出願方式など検索エンジンに有益なキーワードを補い、意図を明確にした上で提案する
6. 回答は必ず日本語で行う
""",
        }
    ]

    for h in history[-3:]:
        messages.append({"role": "user", "content": h.get("question", "")})
        messages.append({"role": "assistant", "content": h.get("answer", "")})

    refined_prompt = (
        "以下の質問に答える前に、検索精度を高めるために必要な地名・大学区分・試験形態などを含むように意図を整理してください。"
        "箇条書きで検索向けキーワードを補足した上で、その後に回答を提示してください。\n\n"
        f"質問: {message}"
    )

    messages.append({"role": "user", "content": refined_prompt})
    return messages


async def chat_with_ai(message: str, history: List[dict]) -> str:
    """
    Chat with AI for career counseling
    Uses conversation history for context
    """
    logger.info(f"Received chat message: {message[:100]}...")

    if not HF_API_KEY:
        logger.warning("No Hugging Face API key configured")
        return (
            "申し訳ございません。現在AIサービスが利用できません。\n"
            "**HF_API_KEY** を設定してください。"
        )

    messages = _build_chat_messages(message, history)

    try:
        logger.debug(f"Sending messages to Hugging Face: {messages}")
        ai_response = await query_hf_inference_chat(messages)

        ai_response = ai_response.replace('<s>', '').replace('</s>', '').strip()
        if len(ai_response) > 1000:
            ai_response = ai_response[:1000] + "..."

        logger.info("AI response generated successfully")
        return ai_response

    except Exception as e:
        logger.error(f"AI chat failed: {str(e)}")
        return (
            "申し訳ありませんが、現在AIとの会話中にエラーが発生しました。\n"
            "しばらく経ってからもう一度お試しください。"
            f"\n\n（エラーの詳細: {str(e)}）"
        )


async def chat_with_ai_stream(message: str, history: List[dict]) -> AsyncIterator[str]:
    """Stream AI responses token-by-token for richer UX."""
    logger.info(f"Streaming chat message: {message[:100]}...")

    if not HF_API_KEY:
        logger.warning("No Hugging Face API key configured for streaming")
        yield (
            "申し訳ございません。現在AIサービスが利用できません。\n"
            "**HF_API_KEY** を設定してください。"
        )
        return

    payload = {
        "messages": _build_chat_messages(message, history),
        "model": HUGGINGFACE_MODEL_ID,
        "temperature": 0.7,
        "max_tokens": 1000,
        "top_p": 0.9,
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=None) as client:
        try:
            async with client.stream(
                "POST",
                HUGGINGFACE_API_URL,
                headers={
                    "Authorization": f"Bearer {HF_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            ) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line.removeprefix("data: ").strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                        except json.JSONDecodeError:
                            logger.debug(f"Skipping non-JSON streaming line: {data_str}")
                            continue

                        delta = (
                            data.get("choices", [{}])[0]
                            .get("delta", {})
                            .get("content", "")
                        )
                        if delta:
                            yield delta

        except Exception as exc:  # noqa: BLE001
            logger.error(f"Streaming chat failed: {exc}")
            raise

# --- 実行例 ---
async def main():
    """
    デモンストレーションのための実行関数
    """
    print("--- Hugging Face AIキャリアアドバイザー 実行デモ ---")
    
    # 🚨 【修正箇所】環境変数のチェックはそのまま
    if not os.getenv("HF_API_KEY"):
        print("\n🚨 **警告:** 環境変数 'HF_API_KEY' が設定されていません。AI応答はモックデータになります。")
        return
        
    # 会話履歴の例
    history = [
        {"question": "私は理系科目が得意で、特に物理と数学が好きです。", "answer": "それは素晴らしいですね！物理と数学が得意なら、理工学部の機械工学科や電気電子工学科、または情報科学部などが特におすすめです。"},
    ]
    
    user_message = "機械工学に興味があります。有名な大学を教えてください。"
    
    print("-" * 30)
    print(f"ユーザー: **{user_message}**")
    print("-" * 30)
    
    try:
        response = await chat_with_ai(user_message, history)
        print(f"\nAIアドバイザー:\n{response}")
    except Exception as e:
        print(f"\n実行エラー: {e}")

if __name__ == "__main__":
    # 非同期実行
    # 実際のアプリケーションでは、この部分はウェブフレームワークに組み込まれます。
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n実行を中断しました。")
    except Exception as e:
        print(f"メイン実行中に予期せぬエラーが発生しました: {e}")