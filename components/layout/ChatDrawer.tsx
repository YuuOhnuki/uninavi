'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, MessageSquare, Send, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Chat drawer component for career counseling.
 * Allows students to ask questions about university selection.
 */
export function ChatDrawer(): React.ReactElement {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('chatHistory');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeController, setActiveController] = useState<AbortController | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('chatHistory', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        return () => {
            activeController?.abort();
        };
    }, [activeController]);

    useEffect(() => {
        if (!isOpen) return;
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    async function handleSend(): Promise<void> {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        const baseMessages = [...messages, userMessage];
        const assistantIndex = baseMessages.length;
        const placeholder: Message = { role: 'assistant', content: '' };

        setMessages([...baseMessages, placeholder]);
        setInput('');
        setIsLoading(true);

        const controller = new AbortController();
        setActiveController(controller);

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/chat/stream`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: baseMessages,
                }),
                signal: controller.signal,
            });

            if (!response.ok || !response.body) {
                throw new Error('Failed to start streaming response');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let assistantContent = '';
            let buffer = '';
            let isComplete = false;

            const updateAssistantContent = (content: string) => {
                setMessages((prev) => {
                    if (assistantIndex >= prev.length) {
                        return prev;
                    }
                    const next = [...prev];
                    next[assistantIndex] = { role: 'assistant', content };
                    return next;
                });
            };

            const appendAssistantContent = (chunk: string) => {
                if (!chunk) {
                    return;
                }
                assistantContent += chunk;
                updateAssistantContent(assistantContent);
            };

            const pickString = (value: unknown): string => {
                if (typeof value === 'string') {
                    return value;
                }
                if (Array.isArray(value)) {
                    return value.map((item) => pickString(item)).join('');
                }
                if (value && typeof value === 'object') {
                    const record = value as Record<string, unknown>;
                    return (
                        pickString(record['content']) ||
                        pickString(record['text']) ||
                        pickString(record['message']) ||
                        pickString(record['delta']) ||
                        pickString(record['value'])
                    );
                }
                return '';
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                let boundary = buffer.indexOf('\n\n');

                while (boundary !== -1) {
                    const rawEvent = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 2);
                    boundary = buffer.indexOf('\n\n');

                    const lines = rawEvent.split('\n');
                    let eventType = 'message';
                    let dataPayload = '';

                    lines.forEach((line) => {
                        if (line.startsWith('event:')) {
                            eventType = line.slice('event:'.length).trim();
                        } else if (line.startsWith('data:')) {
                            dataPayload += `${line.slice('data:'.length).trim()}`;
                        }
                    });

                    if (!dataPayload) {
                        continue;
                    }

                    if (eventType === 'delta' || eventType === 'message') {
                        try {
                            const parsed = JSON.parse(dataPayload) as Record<string, unknown>;
                            let chunk =
                                pickString(parsed['content']) ||
                                pickString(parsed['message']) ||
                                pickString(parsed['text']);

                            if (!chunk && Array.isArray(parsed['choices'])) {
                                const firstChoice = parsed['choices'][0] as Record<string, unknown> | undefined;
                                if (firstChoice) {
                                    chunk = pickString(firstChoice['delta']) || pickString(firstChoice['message']);
                                }
                            }

                            if (!chunk) {
                                chunk = pickString(parsed);
                            }

                            if (chunk) {
                                appendAssistantContent(chunk);
                            }
                        } catch (error) {
                            console.warn('Failed to parse streaming chunk', error);
                            appendAssistantContent(dataPayload);
                        }
                    } else if (eventType === 'complete' || eventType === 'done') {
                        isComplete = true;
                        break;
                    } else if (eventType === 'error') {
                        try {
                            const parsed = JSON.parse(dataPayload) as { message?: string };
                            assistantContent =
                                parsed.message ??
                                '申し訳ありません。AI応答のストリーミング中にエラーが発生しました。しばらくしてから再度お試しください。';
                        } catch (error) {
                            assistantContent =
                                '申し訳ありません。AI応答のストリーミング中にエラーが発生しました。しばらくしてから再度お試しください。';
                        }
                        updateAssistantContent(assistantContent);
                        isComplete = true;
                        break;
                    }
                }

                if (isComplete) {
                    break;
                }
            }

            if (!isComplete) {
                updateAssistantContent(assistantContent);
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }

            try {
                const fallbackResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: userMessage.content,
                        history: messages,
                    }),
                });
                if (fallbackResponse.ok) {
                    const data = (await fallbackResponse.json()) as { message: string };
                    setMessages((prev) => {
                        const next = [...prev];
                        if (assistantIndex < next.length) {
                            next[assistantIndex] = { role: 'assistant', content: data.message };
                        }
                        return next;
                    });
                } else {
                    throw new Error('Fallback chat request failed');
                }
            } catch (fallbackError) {
                const fallbackMessage =
                    'AIアシスタントへの接続に失敗しました。バックエンドAPIを設定してください。例：「プログラミングに興味がある場合、情報科学や工学部のコンピュータサイエンス学科がおすすめです。」';
                setMessages((prev) => {
                    const next = [...prev];
                    if (assistantIndex < next.length) {
                        next[assistantIndex] = { role: 'assistant', content: fallbackMessage };
                    }
                    return next;
                });
            }
        } finally {
            setIsLoading(false);
            setActiveController(null);
        }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void handleSend();
        }
    }

    function clearHistory(): void {
        activeController?.abort();
        setMessages([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('chatHistory');
        }
    }

    return (
        <>
            <Button
                type="button"
                className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg sm:h-16 sm:w-16"
                onClick={() => setIsOpen(true)}
                aria-label="チャット相談を開く"
                size="icon"
            >
                <MessageSquare className="size-6" aria-hidden="true" />
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent
                    side="right"
                    className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md lg:max-w-2xl"
                    aria-describedby="chat-description"
                >
                    <SheetHeader className="border-border flex flex-row items-center justify-between border-b px-5 py-4">
                        <div className="space-y-1 text-left">
                            <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
                                <span aria-hidden="true">💬</span> 進路相談チャット
                            </SheetTitle>
                            <p id="chat-description" className="text-muted-foreground text-sm">
                                UniNaviに進路や大学選びについて質問できます。
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={clearHistory}
                            aria-label="履歴をクリア"
                        >
                            <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                    </SheetHeader>

                    <ScrollArea className="max-h-[calc(100vh-14rem)] flex-1 p-2 px-6" aria-live="polite">
                        <div className="space-y-3">
                            {messages.length === 0 ? (
                                <div className="border-border/70 bg-muted/30 text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                                    <p className="text-foreground font-medium">進路について何でも質問してください。</p>
                                    <p className="text-muted-foreground/80 mt-1 text-xs">
                                        例: 「プログラミングが得意な人に向いている大学は?」
                                    </p>
                                </div>
                            ) : null}

                            {messages.map((message, index) => (
                                <div
                                    key={`${message.role}-${index}`}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm sm:max-w-[80%] ${
                                            message.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-accent text-foreground'
                                        }`}
                                    >
                                        {message.role === 'assistant' ? (
                                            <div className="max-w-full overflow-x-auto">
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    className="prose prose-sm text-foreground prose-headings:mb-2 prose-headings:text-base prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2"
                                                    components={{
                                                        table: ({ node, ...props }) => (
                                                            <table
                                                                className="border-border w-full border-collapse overflow-hidden rounded-lg border text-left"
                                                                {...props}
                                                            />
                                                        ),
                                                        thead: ({ node, ...props }) => (
                                                            <thead className="bg-muted" {...props} />
                                                        ),
                                                        th: ({ node, ...props }) => (
                                                            <th
                                                                className="border-border border font-semibold"
                                                                {...props}
                                                            />
                                                        ),
                                                        td: ({ node, ...props }) => (
                                                            <td className="border-border border align-top" {...props} />
                                                        ),
                                                        ul: ({ node, ...props }) => (
                                                            <ul className="list-disc pl-5" {...props} />
                                                        ),
                                                        ol: ({ node, ...props }) => (
                                                            <ol className="list-decimal pl-5" {...props} />
                                                        ),
                                                        li: ({ node, ...props }) => <li className="ms-0" {...props} />,
                                                    }}
                                                >
                                                    {message.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            message.content
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading ? (
                                <div className="flex justify-start">
                                    <div className="bg-accent text-foreground flex items-center gap-2 rounded-2xl px-4 py-2 text-sm">
                                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                                        回答を生成しています...
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <div ref={messagesEndRef} />
                    </ScrollArea>

                    <Separator className="mt-auto" />

                    <SheetFooter className="flex flex-col gap-3 px-5 py-4">
                        <Textarea
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="質問を入力してください (Shift + Enterで改行)"
                            aria-label="質問内容"
                            rows={3}
                            disabled={isLoading}
                        />
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-muted-foreground text-xs">
                                送信するとチャット履歴がブラウザに保存されます。
                            </p>
                            <Button
                                type="button"
                                onClick={() => void handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="min-w-[110px]"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Send className="mr-2 size-4" aria-hidden="true" />
                                )}
                                送信
                            </Button>
                        </div>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
}
