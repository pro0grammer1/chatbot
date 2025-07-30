'use client'

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';

interface Message {
  _id?: string;
  question: string;
  answer: string;
  timeStamp: Date;
}

export default function Home() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [first, setFirst] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { signedIn, userInfo } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages when user signs in
  // Load existing messages when user signs in
  useEffect(() => {
    if (signedIn) {
      console.log('User signed in, loading messages...'); // Debug log
      loadMessages();
    } else {
      setMessages([]); // Clear messages when signed out
      setFirst(true); // Reset to show welcome message
    }
  }, [signedIn]);

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/app-info');
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded messages:', data.qna); // Debug log
        setMessages(data.qna || []);
        setFirst(true); // Hide welcome message if there are existing messages
      } else {
        console.error('Failed to load messages:', response.status);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!inputRef.current) return;
    const msg = inputRef.current.value.trim();
    if (!msg) return;

    setLoading(true);
    setFirst(true);

    // Clear input immediately
    inputRef.current.value = '';
    setValue('');

    try {
      // Get chatbot response
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();

      if (data.error) {
        // Handle error response
        const errorMessage: Message = {
          question: msg,
          answer: `Error: ${data.error}`,
          timeStamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      // Create complete message with bot response
      const completeMessage: Message = {
        question: msg,
        answer: typeof data === 'string' ? data : JSON.stringify(data),
        timeStamp: new Date()
      };

      // Update UI immediately
      setMessages(prev => [...prev, completeMessage]);

      // Save to database if user is signed in
      if (signedIn) {
        const store = await fetch('/api/app-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: msg,
            answer: completeMessage.answer
          }),
        });

        if (!store.ok) {
          console.error('Failed to save message:', await store.text());
        }
      }

    } catch (err) {
      console.error('Request failed:', err);
      const errorMessage: Message = {
        question: msg,
        answer: 'Failed to get response. Please try again.',
        timeStamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center ">
      {/* Header */}
      <div className={`flex-shrink-0 p-4 text-center ${first ? '' : 'hidden'}`}>
        <h2 className={`text-4xl font-nunito ${signedIn ? 'pb-4' : ''}`}>
          {!signedIn ? 'Get started on the go with AI' : `Welcome back ${userInfo?.name}!`}
        </h2>
        {!signedIn && (
          <h3 className="text-xl pb-4">
            Login to <u className="underline">Explore</u> more features and save your chats!
          </h3>
        )}
      </div>

      {/* Messages Container */}
      <div className={"flex-1 w-full overflow-y-auto px-4 pb-4 " + first ? '' : 'hidden'}>
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-lg lg:max-w-xl break-words">
                  <p className="break-words whitespace-pre-wrap overflow-wrap-anywhere">{message.question}</p>
                  <span className="text-xs opacity-75">
                    {new Date(message.timeStamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Bot Response */}
              {message.answer && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-black rounded-lg px-4 py-2 max-w-lg lg:max-w-xl break-words">
                    <p className="break-words whitespace-pre-wrap overflow-wrap-anywhere">{message.answer}</p>
                    <span className="text-xs opacity-75">
                      {new Date(message.timeStamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-black rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-black rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Container */}
      <div className="flex-shrink-0 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <span className="p-[0.2rem] relative rounded-[1.75rem] bg-gradient-to-r from-[#ff1b6b] to-[#45caff] animate-gradient block">
              <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                className="w-full disabled:bg-white text-black resize-none rounded-3xl p-3 pr-16 border-none outline-none scrollbar-thin"
                placeholder="Type your message..."
                rows={2}
                cols={50}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !value.trim()}
                className="absolute top-[0.2rem] right-4 h-[3rem] w-12 rounded-xl bg-white shadow-[-4px_0_3px_#fff] flex items-center justify-center disabled:opacity-50"
              >
                <Image
                  className={`${value.length >= 1 && !loading ? 'invert-[.7] hover:cursor-pointer' : 'invert-[.4]'}`}
                  src="/send.svg"
                  width={35}
                  height={35}
                  alt="Send"
                />
              </button>
            </span>
          </form>
        </div>
      </div>

      {/* Sign in/up buttons for non-authenticated users */}
      {!signedIn && (
        <div className="flex-shrink-0 flex justify-center gap-4 p-4">
          <button
            className="bg-transparent hover:bg-white/30 text-white border border-white px-6 py-2 rounded-lg"
            onClick={() => router.push('/login')}
          >
            Sign in
          </button>
          <button
            className="bg-transparent hover:bg-white/30 text-white border border-white px-6 py-2 rounded-lg"
            onClick={() => router.push('/signup')}
          >
            Sign up
          </button>
        </div>
      )}
    </div>
  );
}