'use client';

import { useEffect, useRef, useState, use } from 'react';

type Business = {
  id: string;
  name: string;
  logo_url?: string | null;
  screenshot_path?: string | null;
  primary_color?: string | null;
  welcome_message?: string | null;
  suggested_messages?: string[] | null;
  status?: string;
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${slug}`);
        if (!res.ok) throw new Error('not found');
        const data = await res.json();
        setBusiness(data);
      } catch {
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [slug]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatOpen]);

  const handleToggleChat = () => {
    setChatOpen((prev) => {
      if (!prev && business && messages.length === 0) {
        const welcome = business.welcome_message?.trim() || 'Hi! How can I help you today?';
        setMessages([{ role: 'assistant', content: welcome }]);
      }
      return !prev;
    });
  };

  const sendMessage = async (contentOverride?: string) => {
    const content = (contentOverride ?? input).trim();
    if (!content || isStreaming || !business) return;

    const userMsg: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setIsStreaming(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content }],
          session_id: sessionId,
          current_page: window.location.href,
          business_id: slug,
        }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const { content: token } = JSON.parse(raw) as { content: string };
            if (token) {
              setMessages((prev) => {
                const copy = [...prev];
                const lastIndex = copy.length - 1;
                copy[lastIndex] = {
                  role: 'assistant',
                  content: copy[lastIndex].content + token,
                };
                return copy;
              });
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        const lastIndex = copy.length - 1;
        copy[lastIndex] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span>Loading demo...</span>
        </div>
      </div>
    );
  }

  if (!business || business.status !== 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-semibold">Demo not found</h1>
          <p className="mt-2 text-sm text-gray-300">This business demo is not available yet.</p>
        </div>
      </div>
    );
  }

  const accent = business.primary_color || '#2563eb';
  const screenshotUrl = business.screenshot_path?.startsWith('http') ? business.screenshot_path : null;
  const logoUrl = business.logo_url?.startsWith('http') ? business.logo_url : null;


  console.log("media: ", logoUrl, screenshotUrl );
  
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gray-950 text-white"
      style={screenshotUrl ? { backgroundImage: `url('${screenshotUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {screenshotUrl ? (
        <div className="absolute inset-0 bg-black/45" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />
      )}

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex justify-center pt-6 sm:pt-8">
          <div className="rounded-full border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md">
            {logoUrl ? (
              <img src={logoUrl} alt={business.name} className="h-12 w-auto max-w-[180px] object-contain" />
            ) : (
              <div className="text-lg font-semibold text-white">{business.name}</div>
            )}
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-2xl rounded-3xl border border-white/15 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/70">Live Demo</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Meet your AI assistant</h1>
            <p className="mt-4 text-lg text-white/80">
              Ask anything about {business.name} and discover how this experience feels on your own website.
            </p>
          </div>
        </main>
      </div>

      <button
        onClick={handleToggleChat}
        className="fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-2xl transition hover:scale-105"
        style={{ backgroundColor: accent }}
        aria-label="Toggle chat"
      >
        💬
      </button>

      {chatOpen ? (
        <div className="fixed bottom-24 right-6 z-20 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{business.name}</p>
              <p className="text-xs text-gray-500">Online now</p>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-sm text-gray-500 hover:text-gray-900">
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {messages.length === 0 ? (
              <div className="rounded-xl bg-white p-3 text-sm text-gray-600 shadow-sm">
                Hi! I’m the assistant for {business.name}. Ask me anything.
              </div>
            ) : null}
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 shadow-sm'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isStreaming ? (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.3s]" />
                  </span>
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 bg-white p-3">
            {(messages.length === 0 || messages.length === 1) && (business.suggested_messages?.length ? true : false) ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {business.suggested_messages?.filter(Boolean).map((suggestion, index) => (
                  <button
                    key={`${suggestion}-${index}`}
                    type="button"
                    onClick={() => {
                      setInput(suggestion);
                      sendMessage(suggestion);
                    }}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this business..."
                rows={1}
                className="min-h-[42px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming}
                className="rounded-xl px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: accent }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
