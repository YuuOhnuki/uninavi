'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
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
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('chatHistory', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (!isOpen) return;
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    async function handleSend(): Promise<void> {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
                message: userMessage.content,
                history: messages,
            });

            const assistantMessage: Message = {
                role: 'assistant',
                content: response.data.message,
            };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const mockResponse: Message = {
                role: 'assistant',
                content:
                    'AIアシスタントへの接続に失敗しました。バックエンドAPIを設定してください。例：「プログラミングに興味がある場合、情報科学や工学部のコンピュータサイエンス学科がおすすめです。」',
            };
            setMessages((prev) => [...prev, mockResponse]);
        } finally {
            setIsLoading(false);
        }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            void handleSend();
        }
    }

    function clearHistory(): void {
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
                    className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md"
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

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={clearHistory}
                                aria-label="履歴をクリア"
                            >
                                <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setIsOpen(false)}
                                aria-label="チャットを閉じる"
                            >
                                <X className="size-4" aria-hidden="true" />
                            </Button>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-5 py-4" aria-live="polite">
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
                                        {message.content}
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
