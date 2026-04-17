import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Send, X, Bot, Zap, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { sendMessageToCoach, AICoachResponse } from '../services/aiCoachService';
import { useWorkout } from '../contexts/WorkoutContext';
import { useSettings } from '../contexts/SettingsContext';

interface Message {
  role: 'user' | 'coach';
  text: string;
}

export const AICoach = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { currentSession, updateCurrentSession, recoveryHistory } = useWorkout();
  const { isVoiceActive, t, experimentalFeatures, profile } = useSettings();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'coach', text: t('coach.greeting') }
  ]);
  
  // Tactical Alert Logic
  useEffect(() => {
    if (!profile || profile.trainingGoal !== 'pure_strength') return;

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const highIntensitySessions = recoveryHistory.filter(r => 
      r.timestamp > oneWeekAgo && r.rpe >= 7
    );

    if (highIntensitySessions.length > 3) {
      const alertMsg = "TACTICAL ALERT: Heavy aerobic load detected. This may interfere with neurological force production for your upcoming block. Consider reducing cardio frequency to preserve Peaking effectiveness.";
      // Check if alert was already sent recently (to avoid spamming)
      setMessages(prev => {
        if (prev.some(m => m.text.includes("TACTICAL ALERT"))) return prev;
        return [...prev, { role: 'coach', text: alertMsg }];
      });
    }
  }, [profile, recoveryHistory]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingAction, setPendingAction] = useState<AICoachResponse['action'] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInputText(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const isPositiveIntent = (text: string) => {
    const normalized = text.toLowerCase().trim();
    const positiveWords = ['yes', 'yeah', 'sure', 'do it', 'ok', 'confirm', 'yep', 'affirmative', 'please', 'go ahead', 'replace', 'add it'];
    // Check for exact matches or word inclusion with boundaries
    return positiveWords.some(word => 
      normalized === word || 
      normalized.startsWith(word + ' ') || 
      normalized.endsWith(' ' + word) || 
      normalized.includes(' ' + word + ' ') ||
      normalized.replace(/[.,!?]/g, '') === word
    );
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !currentSession) return;

    const userMessage = text.trim();
    const isSurpriseRequest = userMessage.toLowerCase().includes('surprise');

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputText('');

    // Handle confirmation for pending action
    if (pendingAction) {
      if (isPositiveIntent(userMessage)) {
        const routineExercises = (currentSession.exercises || []).filter(ex => !ex.isAdditional);
        const updatedSession = {
          ...currentSession,
          exercises: [...routineExercises, ...(pendingAction.exercises || [])]
        };
        updateCurrentSession(updatedSession);
        setMessages(prev => [...prev, { role: 'coach', text: t('coach.overrideComplete') }]);
        setPendingAction(null);
        return;
      } else if (!isSurpriseRequest) {
        // Only abort if it's not a new surprise request
        setMessages(prev => [...prev, { role: 'coach', text: t('coach.overrideAborted') }]);
        setPendingAction(null);
        return;
      }
      // If it IS a surprise request, we clear pending and continue to get a new one
      setPendingAction(null);
    }

    setIsTyping(true);

    try {
      const exerciseNames = (currentSession.exercises || []).map(ex => ex.name);
      const response = await sendMessageToCoach(userMessage, currentSession.title, exerciseNames, experimentalFeatures);

      if (userMessage.toLowerCase().includes('surprise') && response.action) {
        setMessages(prev => [...prev, { 
          role: 'coach', 
          text: `${response.text}\n\n${t('coach.surprisePrompt')}` 
        }]);
        setPendingAction(response.action);
      } else {
        setMessages(prev => [...prev, { role: 'coach', text: response.text }]);
        if (response.action) {
          // For non-surprise actions, we can still add them directly or handle them
          // But the requirement specifically mentioned "Surprise Me"
          // Let's keep ADD_EXERCISE as is for other cases
          if (response.action.type === 'ADD_EXERCISE') {
            const updatedSession = {
              ...currentSession,
              exercises: [...(currentSession.exercises || []), ...(response.action.exercises || [])]
            };
            updateCurrentSession(updatedSession);
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'coach', text: t('coach.error') }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-24 right-4 md:right-8 w-[calc(100vw-2rem)] md:w-96 z-[100] flex flex-col"
        >
          <div className="glass-panel border-volt/30 shadow-2xl overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-4 bg-volt/10 border-b border-volt/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-volt flex items-center justify-center text-void">
                  <Bot size={18} />
                </div>
                <div>
                  <h4 className="font-headline text-xs font-black uppercase tracking-widest text-white">{t('coach.title')}</h4>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-volt">{t('coach.active')}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-void/40"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === 'user' ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "px-4 py-3 text-xs font-medium leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-volt text-void" 
                      : "bg-surface-container-highest text-white border-l-2 border-volt"
                  )}>
                    {msg.text}
                    {msg.role === 'coach' && pendingAction && i === messages.length - 1 && (
                      <div className="mt-3 flex gap-2">
                        <button 
                          onClick={() => handleSend("Yes")}
                          className="px-3 py-1 bg-volt text-void text-[8px] font-black uppercase tracking-widest hover:bg-white transition-all"
                        >
                          {t('coach.confirm')}
                        </button>
                        <button 
                          onClick={() => handleSend("No")}
                          className="px-3 py-1 bg-white/10 text-white text-[8px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                        >
                          {t('coach.cancel')}
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mt-1">
                    {msg.role === 'user' ? t('coach.athlete') : t('coach.coach')}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-2">
                  <div className="bg-surface-container-highest px-4 py-3 flex gap-1">
                    <div className="w-1 h-1 bg-volt animate-bounce" />
                    <div className="w-1 h-1 bg-volt animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 bg-volt animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-surface-container-lowest border-t border-white/5">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
                    placeholder={t('coach.awaiting')}
                    className="w-full bg-void border border-white/10 px-4 py-3 pr-10 text-xs text-white placeholder:text-zinc-700 focus:border-volt outline-none transition-all"
                  />
                  <button 
                    onClick={toggleListening}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-all",
                      isListening ? "text-volt animate-pulse" : "text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                  </button>
                </div>
                <button 
                  onClick={() => handleSend(inputText)}
                  disabled={isTyping || !inputText.trim()}
                  className="p-3 bg-volt text-void hover:bg-white transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSend("Surprise me")}
                    className="px-3 py-1.5 bg-volt/10 border border-volt/30 text-volt text-[8px] font-black uppercase tracking-widest hover:bg-volt hover:text-void transition-all"
                  >
                    {t('coach.surpriseMe')}
                  </button>
                  <button 
                    onClick={() => handleSend("How is my form?")}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 text-zinc-400 text-[8px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
                  >
                    {t('coach.formCheck')}
                  </button>
                </div>
                {isVoiceActive && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-volt animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-volt">{t('coach.voiceActive')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
