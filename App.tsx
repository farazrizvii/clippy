import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, X, Minimize2, Terminal, Sparkles, Download, Clipboard, ArrowDownRight } from 'lucide-react';

// --- CONFIGURATION ---


const DEMO_MODE_API_KEY = ""; 

// --- Types ---

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface AppSettings {
  provider: 'openai' | 'gemini';
  apiKey: string;
  systemPrompt: string;
  userContext: string;
  theme: 'motate' | 'light'; 
}

// --- Constants ---

const DEFAULT_SYSTEM_PROMPT = "You are Clippy, a helpful, witty, and slightly sarcastic desktop assistant. Keep answers concise.";

const INITIAL_SETTINGS: AppSettings = {
  provider: 'openai',
  apiKey: DEMO_MODE_API_KEY, 
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  userContext: "I am a Software Engineer intern applicant. I like efficient code.",
  theme: 'motate', 
};

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substring(2, 9);

// --- Background Component (Interactive Motate Grid) ---

const MotateBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    let mouse = { x: -1000, y: -1000 };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Particles - MAXIMIZED DENSITY FOR SMALLER GRID
    const particles: {x: number, y: number, vx: number, vy: number}[] = [];
    const particleCount = 250; 

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; 
      ctx.lineWidth = 1;

      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;

        // Bounce & Clamp
        if (p.x < 0 || p.x > width) { p.vx *= -1; if(p.x<0)p.x=0; if(p.x>width)p.x=width; }
        if (p.y < 0 || p.y > height) { p.vy *= -1; if(p.y<0)p.y=0; if(p.y>height)p.y=height; }

        ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();

        // Connect to mouse
        const dxMouse = p.x - mouse.x;
        const dyMouse = p.y - mouse.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distMouse < 100) { 
           ctx.beginPath();
           ctx.strokeStyle = `rgba(212, 175, 55, ${1 - distMouse/100})`;
           ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }

        // Connect to neighbors
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 50) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - dist/50)})`;
            ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
          }
        }
      });
      requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 bg-black pointer-events-none" />;
};

// --- Main Component ---

export default function ClippyApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [viewState, setViewState] = useState<'open' | 'minimized'>('open');
  
  // Position & Size State
  const [position, setPosition] = useState({ x: 50, y: 50 }); 
  const [size, setSize] = useState({ w: 340, h: 420 }); 
  
  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false); 
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Load/Save
  useEffect(() => {
    const savedSettings = localStorage.getItem('clippy_settings');
    const savedHistory = localStorage.getItem('clippy_history');
    if (savedSettings && !DEMO_MODE_API_KEY) setSettings(JSON.parse(savedSettings));
    if (savedHistory) setMessages(JSON.parse(savedHistory));
  }, []);

  useEffect(() => { localStorage.setItem('clippy_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('clippy_history', JSON.stringify(messages)); scrollToBottom(); }, [messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof Element && e.target.closest('.resize-handle')) {
        setIsResizing(true); e.stopPropagation(); return;
    }
    if (chatWindowRef.current && e.target instanceof Element && (e.target.closest('.drag-handle') || viewState === 'minimized')) {
      setIsDragging(true); setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault(); setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
      }
      if (isResizing) {
        e.preventDefault();
        const newWidth = Math.max(300, e.clientX - position.x);
        const newHeight = Math.max(300, e.clientY - position.y); 
        setSize({ w: newWidth, h: newHeight });
      }
    };
    const handleGlobalMouseUp = () => { setIsDragging(false); setIsResizing(false); };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position]);

  // File Drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        setIsLoading(true);
        setTimeout(() => { addMessage('assistant', `I've analyzed ${files[0].name}. Ready for commands.`); setIsLoading(false); }, 1500);
    }
  };

  // Commands
  const handleCommand = (text: string): boolean => {
    const lower = text.toLowerCase().trim();
    if (lower.startsWith('open ')) { window.open('https://' + lower.replace('open ', ''), '_blank'); return true; }
    if (lower === 'clear') { setMessages([]); return true; }
    if (lower.match(/^[\d\s+\-*/().]+$/)) {
        try { const res = Function(`return ${lower}`)(); addMessage('assistant', `Result: ${res}`); return true; } catch { return false; }
    }
    return false;
  };

  const exportChat = () => {
    const text = messages.map(m => `[${m.role}]: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'chat-history.txt'; a.click();
  };

  // API
  const callAI = async (text: string) => {
    if (!settings.apiKey) { setTimeout(() => { addMessage('system', "Please enter API Key in Settings."); setIsLoading(false); }, 500); return; }
    try {
        const endpoint = settings.provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.apiKey}`;
        const body = settings.provider === 'openai'
            ? JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{role:'system', content: settings.systemPrompt}, {role:'user', content: text}] })
            : JSON.stringify({ contents: [{ parts: [{ text: settings.systemPrompt + "\nUser: " + text }] }] });

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: settings.provider === 'openai' ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` } : {'Content-Type': 'application/json'},
            body
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message || "API Error");
        const reply = settings.provider === 'openai' ? data.choices[0].message.content : data.candidates[0].content.parts[0].text;
        addMessage('assistant', reply);
    } catch (e: any) { addMessage('system', e.message); }
  };

  const addMessage = (role: 'user'|'assistant'|'system', content: string) => {
    setMessages(p => [...p, { id: generateId(), role, content, timestamp: Date.now() }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const txt = input; setInput(''); addMessage('user', txt);
    if (!handleCommand(txt)) { setIsLoading(true); await callAI(txt); setIsLoading(false); }
  };

  // Clipboard
  const handleClipboard = async () => {
    let text = "";
    try { text = await navigator.clipboard.readText(); } catch (e) {}
    if (!text) {
         const manualPaste = prompt("Clipboard access blocked. Paste text here:");
         if (manualPaste) text = manualPaste;
    }
    if (!text) { addMessage('system', "No text provided."); return; }
    addMessage('user', `[Clipboard]: ${text.substring(0, 50)}...`);
    setIsLoading(true);
    await callAI(`Summarize this text concisely:\n${text}`);
    setIsLoading(false);
  };

  // Styles
  const isMotate = settings.theme === 'motate';
  const containerStyle = viewState === 'minimized' 
    ? (isMotate ? 'rounded-full w-14 h-14 bg-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.6)] border-2 border-white/20' : 'rounded-full w-14 h-14 bg-white shadow-xl border-2 border-gray-200')
    : (isMotate ? 'bg-[#0a0a0a] text-[#e0e0e0] border border-[#d4af37]/50 shadow-[0_0_40px_rgba(212,175,55,0.1)]' : 'bg-white text-gray-800 border-gray-200 shadow-xl');

  return (
    <div className={`min-h-screen w-full relative font-sans text-sm overflow-hidden ${isMotate ? 'bg-black' : 'bg-slate-100'}`}>
        {isMotate && <MotateBackground />}
        <div className="relative z-10 max-w-md mx-auto mt-20 text-center space-y-4">
            <h1 className={`text-5xl font-bold tracking-tighter ${isMotate ? 'text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500' : 'text-gray-800'}`}>MOTATE</h1>
            <p className={isMotate ? 'text-[#d4af37] tracking-widest uppercase text-xs font-semibold' : 'text-gray-500'}>Rapid Innovation • Assessment</p>
        </div>

        <div 
            ref={chatWindowRef}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            onMouseDown={handleMouseDown}
            onDoubleClick={() => viewState === 'minimized' && setViewState('open')}
            style={{ 
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                position: 'fixed', top: 0, left: 0,
                width: viewState === 'open' ? `${size.w}px` : '56px',
                height: viewState === 'open' ? `${size.h}px` : '56px',
                zIndex: 50,
                transition: (isDragging || isResizing) ? 'none' : 'width 0.2s, height 0.2s, transform 0.1s',
            }}
            className={`flex flex-col overflow-hidden ${containerStyle} ${isDragOver ? 'ring-4 ring-green-500' : ''} backdrop-blur-md`}
        >
            {viewState === 'minimized' && (
                <div onClick={() => setViewState('open')} className="w-full h-full flex items-center justify-center cursor-pointer hover:scale-110 transition">
                    <Sparkles size={24} className={isMotate ? 'text-black' : 'text-gray-600'} />
                </div>
            )}
            {viewState === 'open' && (
            <>
                <div className={`drag-handle p-3 flex items-center justify-between cursor-move select-none ${isMotate ? 'bg-gradient-to-r from-[#111] to-black border-b border-[#d4af37]/30' : 'bg-gray-50 border-b border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${isMotate ? 'bg-[#d4af37] text-black' : 'bg-blue-600 text-white'}`}><Terminal size={12}/></div>
                        <span className={`font-bold ${isMotate ? 'text-[#d4af37]' : ''}`}>CLIPPY</span>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-1 opacity-50 hover:opacity-100"><Settings size={14}/></button>
                        <button onClick={() => setViewState('minimized')} className="p-1 opacity-50 hover:opacity-100"><Minimize2 size={14}/></button>
                    </div>
                </div>

                {isSettingsOpen && (
                    <div className="absolute inset-0 z-20 bg-black/90 flex items-center justify-center p-6 animate-in fade-in">
                        <div className="w-full space-y-4">
                            <div className="flex justify-between text-[#d4af37] font-bold"><span>SYSTEM CONFIG</span><X size={16} onClick={()=>setIsSettingsOpen(false)} className="cursor-pointer"/></div>
                            <input type="password" placeholder="API Key" value={settings.apiKey} onChange={e=>setSettings({...settings, apiKey:e.target.value})} className="w-full bg-[#222] border border-[#444] text-white p-2 rounded text-xs"/>
                            <div><label className="text-[#d4af37] text-[10px] font-bold">SYSTEM PROMPT</label><textarea value={settings.systemPrompt} onChange={e=>setSettings({...settings, systemPrompt:e.target.value})} className="w-full bg-[#222] border border-[#444] text-white p-2 rounded text-xs h-16 resize-none"/></div>
                            <div className="flex gap-2">{(['motate', 'light'] as const).map(t => (<button key={t} onClick={()=>setSettings({...settings, theme:t})} className={`px-3 py-1 rounded text-xs border ${settings.theme===t ? 'bg-[#d4af37] text-black' : 'text-gray-500 border-gray-700'}`}>{t.toUpperCase()}</button>))}</div>
                            <button onClick={exportChat} className="w-full border border-[#d4af37] text-[#d4af37] p-2 rounded text-xs hover:bg-[#d4af37]/10 flex justify-center gap-2"><Download size={12}/> EXPORT LOGS</button>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                     {messages.map(m => (<div key={m.id} className={`flex ${m.role==='user'?'justify-end':'justify-start'} animate-in slide-in-from-bottom-2`}><div className={`max-w-[85%] p-3 rounded-lg text-xs ${m.role==='user' ? (isMotate?'bg-[#d4af37] text-black font-bold':'bg-blue-600 text-white') : (isMotate?'bg-[#1a1a1a] border border-[#333] text-gray-300':'bg-gray-100 text-gray-800')}`}>{m.content}</div></div>))}
                     {isLoading && <div className="text-[#d4af37] text-xs animate-pulse">Processing...</div>}
                     <div ref={messagesEndRef}/>
                </div>

                <div className={`p-3 border-t flex gap-2 ${isMotate ? 'bg-[#0a0a0a] border-[#d4af37]/20' : 'bg-white border-gray-200'}`}>
                    <button onClick={handleClipboard} title="Summarize Clipboard" className={`p-2 rounded hover:bg-white/10 ${isMotate ? 'text-[#d4af37]' : 'text-gray-500'}`}><Clipboard size={16} /></button>
                    <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()} placeholder="Execute command..." className={`flex-1 bg-transparent border-none focus:ring-0 text-xs ${isMotate?'text-white placeholder-gray-600':''}`}/>
                    <button onClick={handleSend}><Send size={14} className={isMotate?'text-[#d4af37]':'text-gray-400'}/></button>
                </div>

                <div className="resize-handle absolute bottom-0 right-0 p-1 cursor-se-resize opacity-50 hover:opacity-100 z-50"><ArrowDownRight size={16} className={isMotate ? 'text-[#d4af37]' : 'text-gray-400'} /></div>
            </>
            )}
        </div>
    </div>
  );
}