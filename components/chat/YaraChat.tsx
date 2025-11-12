import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Star } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Subscription, YaraUsage } from '../../types';
import { supabase } from '@/src/integrations/supabase/client';

interface Message {
  text: string;
  sender: 'user' | 'yara';
  isAction?: boolean;
}

interface YaraChatProps {
    subscription: Subscription;
    yaraUsage: YaraUsage;
    incrementYaraUsage: () => void;
    onUpgradeClick: () => void;
}

const YARA_FREE_LIMIT = 5;

const YaraChat: React.FC<YaraChatProps> = ({ subscription, yaraUsage, incrementYaraUsage, onUpgradeClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { text: "Olá! Sou a Yara, sua assistente financeira. Como posso te ajudar hoje?", sender: 'yara' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = inputValue.trim();
        if (!trimmedInput) return;
        
        if (subscription.plan === 'free' && yaraUsage.count >= YARA_FREE_LIMIT) {
             const limitMessage: Message = { 
                text: "Você atingiu seu limite de 5 interações gratuitas com a Yara este mês. Para continuar usando sem limites, faça o upgrade.", 
                sender: 'yara',
                isAction: true,
            };
            setMessages(prev => [...prev, limitMessage]);
            setInputValue('');
            return;
        }

        const userMessage: Message = { text: trimmedInput, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        incrementYaraUsage();

        // Add typing indicator
        const typingMessage: Message = { text: "Yara está digitando...", sender: 'yara' };
        setMessages(prev => [...prev, typingMessage]);

        try {
            // Send all messages to maintain context
            const conversationHistory = [...messages, userMessage].map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));

            const { data: { session } } = await supabase.auth.getSession();
            
            const { data, error } = await supabase.functions.invoke('yara-chat', {
                body: { messages: conversationHistory },
                headers: {
                    Authorization: `Bearer ${session?.access_token}`
                }
            });

            // Remove typing indicator
            setMessages(prev => prev.filter(msg => msg.text !== "Yara está digitando..."));

            if (error) {
                console.error('Error calling yara-chat:', error);
                const errorMessage: Message = { 
                    text: "Desculpe, tive um problema ao processar sua mensagem. Tente novamente.", 
                    sender: 'yara' 
                };
                setMessages(prev => [...prev, errorMessage]);
                return;
            }

            const yaraResponse: Message = { 
                text: data.message || "Desculpe, não consegui processar sua mensagem.", 
                sender: 'yara' 
            };
            setMessages(prev => [...prev, yaraResponse]);
        } catch (error) {
            console.error('Error in handleSendMessage:', error);
            // Remove typing indicator
            setMessages(prev => prev.filter(msg => msg.text !== "Yara está digitando..."));
            
            const errorMessage: Message = { 
                text: "Desculpe, tive um problema ao processar sua mensagem. Tente novamente.", 
                sender: 'yara' 
            };
            setMessages(prev => [...prev, errorMessage]);
        }
    };

    return (
        <>
            {/* Floating Input when chat is closed */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-lg px-4">
                 <div 
                    className={cn(
                        "relative transition-all duration-300 ease-in-out",
                        isOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                    )}
                    data-tour-id="yara-chat-button"
                 >
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 w-full">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Converse com a Yara... (Ex: Paguei R$50 no iFood)"
                            className="h-14 rounded-full shadow-lg text-base"
                            onClick={() => setIsOpen(true)}
                        />
                         <Button type="submit" size="icon" className="h-12 w-12 rounded-full flex-shrink-0 shadow-lg" disabled={!inputValue}>
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </div>

            {/* Chat Window */}
            <div className={cn(
                "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] sm:w-full max-w-lg h-[calc(100vh-5rem)] max-h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out origin-bottom",
                isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}>
                {/* Header */}
                <header className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bot className="w-6 h-6 text-indigo-500" />
                        <h3 className="font-semibold">Converse com a Yara</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                        <X className="w-5 h-5" />
                    </Button>
                </header>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={cn("flex gap-3 items-end", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                             {msg.sender === 'yara' && <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0 self-start"><Bot className="w-5 h-5 text-indigo-500" /></div>}
                            <div className={cn(
                                "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                                msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-800 rounded-bl-none'
                            )}>
                                {msg.text}
                                {msg.isAction && (
                                    <Button size="sm" className="w-full mt-3" onClick={onUpgradeClick}>
                                        <Star className="w-4 h-4 mr-2"/>
                                        Ver Planos Premium
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                     <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <footer className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            autoComplete="off"
                            className="h-12"
                        />
                        <Button type="submit" size="icon" className="h-12 w-12 flex-shrink-0" disabled={!inputValue}>
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                     {subscription.plan === 'free' && (
                        <p className="text-xs text-center text-slate-400 mt-2">
                            Você usou {yaraUsage.count} de {YARA_FREE_LIMIT} interações gratuitas este mês.
                        </p>
                    )}
                </footer>
            </div>
        </>
    );
};

export default YaraChat;
