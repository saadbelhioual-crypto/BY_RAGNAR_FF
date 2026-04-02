"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RagnarManager() {
  const [phase, setPhase] = useState('LOCK'); // LOCK, PANEL, CONSOLE
  const [password, setPassword] = useState('');
  const [guestId, setGuestId] = useState('');
  const [guestPass, setGuestPass] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleLogin = () => {
    if (password === "RAGNAR-FF10-FREE") {
      setPhase('PANEL');
      if (audioRef.current) audioRef.current.play();
    } else {
      alert("WRONG PASSWORD!");
    }
  };

  const startBot = async () => {
    setPhase('CONSOLE');
    addLog("Initializing Ragnar Core...");
    
    try {
      const res = await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: guestId, pass: guestPass }),
      });
      const data = await res.json();
      addLog(data.message || "Process started...");
    } catch (err) {
      addLog("Error connecting to Python backend.");
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  return (
    <main className="relative h-screen w-screen flex items-center justify-center overflow-hidden bg-black">
      <audio ref={audioRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" loop />

      <AnimatePresence mode="wait">
        {/* Phase 1: Security Lock */}
        {phase === 'LOCK' && (
          <motion.div 
            key="lock"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative p-[2px] rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#ff003c,#00f2ff,#ff003c)] animate-conic-rotate" />
            <div className="relative bg-black p-8 rounded-2xl w-80 flex flex-col gap-4 text-center">
              <h1 className="text-2xl font-black tracking-widest text-ragnar-neon-red">SECURITY LOCK</h1>
              <input 
                type="password" 
                placeholder="ACCESS KEY"
                className="bg-zinc-900 border border-zinc-700 p-2 rounded text-center focus:border-ragnar-neon-blue outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                onClick={handleLogin}
                className="bg-white text-black font-bold py-2 rounded hover:bg-ragnar-neon-blue transition-colors"
              >
                UNLOCK
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase 2: Data Entry */}
        {phase === 'PANEL' && (
          <motion.div 
            key="panel"
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}
            className="w-96 p-8 border border-ragnar-neon-blue rounded-lg bg-zinc-950 shadow-[0_0_20px_rgba(0,242,255,0.2)]"
          >
            <h2 className="text-xl font-bold mb-6 text-center border-b border-zinc-800 pb-2">BOT CONFIGURATION</h2>
            <div className="flex flex-col gap-4">
              <input 
                placeholder="YOUR GUEST ID"
                className="bg-transparent border-b border-zinc-700 p-2 outline-none focus:border-ragnar-neon-red transition-all"
                onChange={(e) => setGuestId(e.target.value)}
              />
              <input 
                placeholder="YOUR GUEST PASSWORD"
                className="bg-transparent border-b border-zinc-700 p-2 outline-none focus:border-ragnar-neon-red transition-all"
                type="password"
                onChange={(e) => setGuestPass(e.target.value)}
              />
              <button 
                onClick={startBot}
                className="mt-4 border border-ragnar-neon-red py-3 font-bold hover:bg-ragnar-neon-red transition-all"
              >
                START BOT
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase 3: Console */}
        {phase === 'CONSOLE' && (
          <motion.div 
            key="console"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="w-[90%] max-w-2xl h-96 bg-zinc-950 border border-zinc-800 rounded p-4 font-mono text-sm overflow-y-auto"
          >
            <div className="flex justify-between mb-4 border-b border-zinc-800 pb-2">
              <span className="text-green-500 underline">LIVE_LOGS.EXE</span>
              <span className="text-ragnar-neon-blue">SYSTEM ACTIVE</span>
            </div>
            {logs.map((log, i) => (
              <div key={i} className="mb-1 text-zinc-400">
                <span className="text-ragnar-neon-red mr-2">{">"}</span> {log}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}