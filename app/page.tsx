'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [guestId, setGuestId] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioRef.current = new Audio('/ambient.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.log);
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'RAGNAR-FF10-FREE') {
      setIsAuthenticated(true);
      setError('');
      
      // Test API connection
      try {
        const res = await fetch('http://localhost:5000/api/bot');
        if (res.ok) {
          setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✓ Connected to API`]);
        }
      } catch (err) {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ⚠ API not running on port 5000`]);
      }
    } else {
      setError('Invalid access code');
    }
  };

  const startBot = async () => {
    if (!guestId || !guestPassword) {
      setError('Please enter GUEST ID and PASSWORD');
      return;
    }

    setIsBotRunning(true);
    setError('');

    try {
      // Save credentials
      const saveRes = await fetch('http://localhost:5000/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_credentials',
          guest_id: guestId,
          guest_password: guestPassword,
        }),
      });

      if (!saveRes.ok) {
        const errorData = await saveRes.json();
        throw new Error(errorData.error || 'Failed to save credentials');
      }

      // Start bot
      const startRes = await fetch('http://localhost:5000/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_bot' }),
      });

      if (!startRes.ok) {
        throw new Error('Failed to start bot');
      }

      // Connect to SSE for live logs
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('http://localhost:5000/api/bot?action=stream_logs');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.raw) {
          setLogs((prev) => [...prev, data.raw]);
        } else if (data.message) {
          setLogs((prev) => [...prev, `[${data.timestamp || new Date().toLocaleTimeString()}] ${data.message}`]);
        }
      };

      eventSource.onerror = () => {
        // Don't auto-stop on error, just log
        console.log('SSE connection issue');
      };
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start bot');
      setIsBotRunning(false);
    }
  };

  const stopBot = async () => {
    try {
      await fetch('http://localhost:5000/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop_bot' }),
      });
      setIsBotRunning(false);
    } catch (err) {
      console.error('Failed to stop bot:', err);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1a0a0a 0%, #0a0a1a 100%)',
      position: 'relative'
    }}>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              padding: '1rem'
            }}
          >
            <div style={{
              background: 'rgba(20, 20, 40, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '1rem',
              padding: '2.5rem',
              width: '100%',
              maxWidth: '26rem',
              border: '1px solid #ff6666'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  margin: '0 auto 1rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #ff6666, #6666ff)'
                }} />
                <h1 style={{
                  fontSize: '1.75rem',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #ff9999, #9999ff)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}>
                  RAGNAR SYSTEM
                </h1>
                <p style={{ color: '#888', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Enter access code to continue
                </p>
              </div>

              <form onSubmit={handleLogin}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0a0a0f',
                    border: '1px solid #ff6666',
                    borderRadius: '0.5rem',
                    padding: '0.875rem 1rem',
                    color: '#ff9999',
                    fontSize: '1rem',
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    outline: 'none'
                  }}
                  placeholder="••••••••••••••"
                />

                {error && (
                  <div style={{
                    color: '#ff6666',
                    textAlign: 'center',
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                  }}>
                    ⚠ {error}
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #ff6666, #6666ff)',
                    color: 'white',
                    fontWeight: '500',
                    padding: '0.875rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  VERIFY ACCESS
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              minHeight: '100vh',
              padding: '2rem'
            }}
          >
            <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
              {/* Header with Music Button */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '2rem',
                padding: '0 1rem'
              }}>
                <div>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #ff9999, #9999ff)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>
                    Bot Manager
                  </h1>
                  <p style={{ color: '#888', fontSize: '0.875rem' }}>
                    Free Fire Automation System
                  </p>
                </div>
                
                <button
                  onClick={toggleMusic}
                  style={{
                    background: isMusicPlaying ? '#ff6666' : '#6666ff',
                    border: 'none',
                    borderRadius: '2rem',
                    padding: '0.75rem 1.5rem',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '1.25rem'
                  }}
                >
                  {isMusicPlaying ? '🔊 MUSIC ON' : '🔇 MUSIC OFF'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left Panel */}
                <div style={{
                  background: 'rgba(20, 20, 40, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid #ff6666'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '500',
                    color: '#ff9999',
                    marginBottom: '1.5rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #ff6666'
                  }}>
                    GUEST CREDENTIALS
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#aaa', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        GUEST ID
                      </label>
                      <input
                        type="text"
                        value={guestId}
                        onChange={(e) => setGuestId(e.target.value)}
                        style={{
                          width: '100%',
                          background: '#0a0a0f',
                          border: '1px solid #ff6666',
                          borderRadius: '0.5rem',
                          padding: '0.75rem 1rem',
                          color: '#ff9999',
                          outline: 'none'
                        }}
                        disabled={isBotRunning}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#aaa', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        GUEST PASSWORD
                      </label>
                      <input
                        type="password"
                        value={guestPassword}
                        onChange={(e) => setGuestPassword(e.target.value)}
                        style={{
                          width: '100%',
                          background: '#0a0a0f',
                          border: '1px solid #ff6666',
                          borderRadius: '0.5rem',
                          padding: '0.75rem 1rem',
                          color: '#ff9999',
                          outline: 'none'
                        }}
                        disabled={isBotRunning}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
                      <button
                        onClick={startBot}
                        disabled={isBotRunning}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #ff6666, #ff8888)',
                          color: 'white',
                          fontWeight: '500',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: isBotRunning ? 0.6 : 1
                        }}
                      >
                        {isBotRunning ? 'RUNNING...' : '🚀 START BOT'}
                      </button>

                      <button
                        onClick={stopBot}
                        disabled={!isBotRunning}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #6666ff, #8888ff)',
                          color: 'white',
                          fontWeight: '500',
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: !isBotRunning ? 0.6 : 1
                        }}
                      >
                        ⏹️ STOP BOT
                      </button>
                    </div>

                    <button
                      onClick={clearLogs}
                      style={{
                        background: '#2a2a4a',
                        color: '#aaa',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #ff6666',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ CLEAR TERMINAL
                    </button>

                    {error && (
                      <div style={{
                        background: 'rgba(255, 102, 102, 0.1)',
                        border: '1px solid #ff6666',
                        borderRadius: '0.5rem',
                        padding: '0.75rem',
                        color: '#ff6666',
                        textAlign: 'center',
                        fontSize: '0.875rem'
                      }}>
                        ⚠ {error}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel - Terminal */}
                <div style={{
                  background: 'rgba(20, 20, 40, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  border: '1px solid #6666ff'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '500',
                    color: '#9999ff',
                    marginBottom: '1.5rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #6666ff'
                  }}>
                    LIVE TERMINAL
                  </h2>

                  <div
                    ref={terminalRef}
                    style={{
                      background: '#0a0a0f',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      height: '24rem',
                      overflowY: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.813rem'
                    }}
                  >
                    {logs.length === 0 ? (
                      <div style={{ color: '#555', textAlign: 'center', marginTop: '8rem' }}>
                        <p>┌─[ Waiting for bot to start ]</p>
                        <p>└─► System ready. Enter credentials and click START</p>
                      </div>
                    ) : (
                      logs.map((log, idx) => (
                        <div key={idx} style={{
                          color: log.includes('SUCCESS') ? '#99ff99' 
                                : log.includes('ERROR') ? '#ff6666'
                                : log.includes('BOT') ? '#ff9999'
                                : '#9999ff',
                          marginBottom: '0.5rem',
                          fontSize: '0.813rem',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {log}
                        </div>
                      ))
                    )}
                    {isBotRunning && (
                      <div style={{ color: '#99ff99', marginTop: '0.5rem', fontSize: '0.813rem' }}>
                        ⚡ Bot is processing...
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '0.5rem',
                      height: '0.5rem',
                      background: isBotRunning ? '#99ff99' : '#555',
                      borderRadius: '50%',
                      marginRight: '0.5rem',
                      animation: isBotRunning ? 'pulse 1s infinite' : 'none'
                    }} />
                    <span style={{ color: '#666', fontSize: '0.75rem' }}>
                      {isBotRunning ? '● LIVE CONNECTION ACTIVE' : '● STANDBY MODE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
