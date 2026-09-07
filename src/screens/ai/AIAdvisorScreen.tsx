import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useHydrationStore } from '@/store/useHydrationStore';
import { useBodyStore } from '@/store/useBodyStore';
import { useModalBehavior } from '@/hooks/useModalBehavior';
import { getToday } from '@/utils/date';
import { selectCurrentWorkoutStreak } from '@/utils/streak';
import { calculateExerciseRecommendation } from '@/features/ai/recommendationEngine';
import { 
  processAgentQuery, 
  calculateTodayMacroBudget, 
  calculateMuscleRecoveryMap, 
  AgentMessage, 
  AgentContext 
} from '@/features/ai/fitnessAgentEngine';
import { 
  Sparkles, 
  X, 
  Dumbbell, 
  Utensils, 
  Activity, 
  Send, 
  Play, 
  Flame, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  Zap,
  Bot,
  User,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ShieldCheck,
  Info
} from 'lucide-react';

interface AIAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSuggestedWorkout: (name: string, exerciseIds?: string[]) => void;
  initialQuery?: string;
}

export const AIAdvisorScreen: React.FC<AIAdvisorProps> = ({
  isOpen,
  onClose,
  onStartSuggestedWorkout,
  initialQuery
}) => {
  const { handleBackdropClick } = useModalBehavior({ isOpen, onClose });
  const { user } = useAuthStore();
  const { workouts, prs, weeklySplit, getExerciseById, startWorkout } = useWorkoutStore();
  const { meals, quickAddMacros } = useNutritionStore();
  const { logs: hydroLogs } = useHydrationStore();
  const { measurements, sleepLogs, recoveryLogs, getRecoveryForDate } = useBodyStore();

  const [activeTab, setActiveTab] = useState<'chat' | 'workout' | 'nutrition' | 'recovery'>('chat');
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loggedMealToast, setLoggedMealToast] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const todayStr = getToday();
  const todayRecovery = getRecoveryForDate(todayStr);
  const currentStreak = selectCurrentWorkoutStreak(workouts);
  const macroBudget = calculateTodayMacroBudget(meals, user.goals);
  const muscleRecovery = calculateMuscleRecoveryMap(workouts);

  // Build context for AI reasoning
  const agentContext: AgentContext = {
    user,
    workouts,
    meals,
    hydration: hydroLogs,
    measurements,
    sleepLogs,
    recoveryLogs,
    weeklySplit
  };

  // Determine scheduled workout
  const todayDayIndex = new Date().getDay();
  const scheduledSplit = weeklySplit.find(s => s.dayIndex === todayDayIndex)
    || weeklySplit.find(s => !s.isRest && s.exerciseIds.length > 0)
    || weeklySplit[0];

  const exerciseRecommendations = (scheduledSplit.exerciseIds || []).map(exId => {
    const exercise = getExerciseById(exId);
    const name = exercise ? exercise.name : exId;
    return calculateExerciseRecommendation(exId, name, workouts);
  });

  // Re-generate message when opened, query provided, or split updated
  useEffect(() => {
    if (isOpen) {
      setIsThinking(true);
      processAgentQuery(initialQuery || '', agentContext).then(initialMsg => {
        setMessages([initialMsg]);
        setIsThinking(false);
      });
    }
  }, [isOpen, initialQuery, weeklySplit]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, activeTab]);

  if (!isOpen) return null;

  const handleRefreshAnalysis = () => {
    setIsThinking(true);
    processAgentQuery(initialQuery || '', agentContext).then(initialMsg => {
      setMessages([initialMsg]);
      setIsThinking(false);
    });
  };

  const handleSendMessage = async (queryToSend?: string) => {
    const query = (queryToSend || inputQuery).trim();
    if (!query || isThinking) return;

    const userMessage: AgentMessage = {
      id: `user-msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: query
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsThinking(true);

    try {
      // Simulate intelligent neural reasoning with natural pacing
      await new Promise(resolve => setTimeout(resolve, 500));
      const response = await processAgentQuery(query, agentContext);
      setMessages(prev => [...prev, response]);

      // Voice synthesis simulation if unmuted
      if (!voiceMuted && 'speechSynthesis' in window) {
        try {
          const plainText = response.content.replace(/[*#`_>•]/g, '').slice(0, 160);
          const utterance = new SpeechSynthesisUtterance(plainText);
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          // ignore speech synthesis errors
        }
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleActionExecute = (action: AgentMessage['action']) => {
    if (!action) return;
    if (action.type === 'START_WORKOUT') {
      const payload = action.payload;
      onStartSuggestedWorkout(payload.title, payload.exerciseIds);
      onClose();
    } else if (action.type === 'QUICK_ADD_MACROS') {
      const p = action.payload;
      quickAddMacros(todayStr, 'snack', p.calories, p.protein, p.carbs, p.fat, p.fiber, p.name);
      setLoggedMealToast(`Logged ${p.protein}g Protein (${p.calories} kcal) to today's macros!`);
      setTimeout(() => setLoggedMealToast(null), 3000);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-black text-white mt-2 mb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="text-xs font-bold text-purple-300 mt-2 mb-1">{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('> ')) {
        return (
          <div key={idx} className="my-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200">
            {line.replace('> ', '')}
          </div>
        );
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300 ml-1 my-0.5">
            <span className="text-purple-400 font-bold">•</span>
            <span>{renderFormattedInline(line.replace(/^[•-]\s*/, ''))}</span>
          </div>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="text-xs text-slate-300 ml-1 my-1">
            {renderFormattedInline(line)}
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1" />;
      }
      return <p key={idx} className="text-xs text-slate-300 leading-relaxed my-0.5">{renderFormattedInline(line)}</p>;
    });
  };

  const renderFormattedInline = (inlineText: string) => {
    // Process **bold** and `code` tags
    const parts = inlineText.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-white font-black">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <span key={index} className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
            {part.slice(1, -1)}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full h-full sm:h-[90vh] sm:max-h-[760px] sm:max-w-2xl bg-[#090D1A] border-0 sm:border sm:border-purple-500/40 rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-slide-up relative"
      >
        {/* Glow Accents */}
        <div className="absolute top-0 right-1/4 w-72 h-36 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-30 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER with Safe Area padding */}
        <div className="px-4 py-3.5 pt-safe sm:pt-4 border-b border-white/10 bg-gradient-to-r from-purple-950/50 via-[#0F1424] to-[#0A0E1A] flex items-center justify-between relative z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 relative shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090D1A] absolute -bottom-0.5 -right-0.5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight truncate">FitForge AI Coach</h2>
                <span className="px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold tracking-wider uppercase border border-purple-500/30 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                  Apex v3.2
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] text-slate-400 font-mono truncate">
                <span className="text-emerald-400 font-bold">ONLINE</span>
                <span>•</span>
                <span>{currentStreak}d Streak</span>
                <span>•</span>
                <span className="text-cyan-400">{todayRecovery ? `${todayRecovery.calculatedScore}% Recovery` : '88% Recovery'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleRefreshAnalysis}
              title="Re-analyze Telemetry & Sync Routine"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-purple-300 transition-all pressable"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setVoiceMuted(!voiceMuted)}
              title={voiceMuted ? "Unmute Coach Voice" : "Mute Coach Voice"}
              className={`p-2 rounded-xl border transition-all pressable ${
                voiceMuted 
                  ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' 
                  : 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-sm'
              }`}
            >
              {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 text-slate-400 transition-all pressable"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 INTERACTIVE NAVIGATION TABS */}
        <div className="px-3 sm:px-4 py-2 bg-[#0C101E] border-b border-white/10 flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 pressable ${
              activeTab === 'chat'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI Coach Chat
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workout')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 pressable ${
              activeTab === 'workout'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Calibrated Routine
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nutrition')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 pressable ${
              activeTab === 'nutrition'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Macro Fuel
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recovery')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 pressable ${
              activeTab === 'recovery'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Fatigue Radar
          </button>
        </div>

        {/* NOTIFICATION TOAST FOR QUICK LOGGED MEAL */}
        {loggedMealToast && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-slide-down">
            <CheckCircle2 className="w-4 h-4" />
            {loggedMealToast}
          </div>
        )}

        {/* TAB 1: AI COACH CHAT STREAM */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 relative z-10">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-start gap-2.5 max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                        : 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                    }`}>
                      {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    {/* Bubble */}
                    <div className={`p-3.5 rounded-2xl border shadow-lg relative group ${
                      msg.sender === 'user'
                        ? 'bg-cyan-950/40 border-cyan-500/30 text-slate-100 rounded-tr-none'
                        : 'bg-[#121829] border-white/10 text-slate-200 rounded-tl-none'
                    }`}>
                      {formatMarkdown(msg.content)}

                      {/* Executable Action Button */}
                      {msg.action && (
                        <div className="mt-3 pt-2.5 border-t border-white/10">
                          <button
                            onClick={() => handleActionExecute(msg.action)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all pressable"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            {msg.action.buttonLabel}
                          </button>
                        </div>
                      )}

                      {/* Message Footer: Timestamp & Copy */}
                      <div className="flex items-center justify-between gap-3 mt-2 text-[10px] text-slate-500 font-mono">
                        <span>{msg.timestamp}</span>
                        {msg.sender === 'agent' && (
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="hover:text-purple-300 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Suggested Quick Prompt Pills underneath agent message */}
                  {msg.sender === 'agent' && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pl-9 max-w-full">
                      {msg.suggestedPrompts.map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSendMessage(prompt)}
                          className="px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-300 hover:text-purple-200 text-[11px] transition-all pressable flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking Indicator */}
              {isThinking && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="p-3 rounded-2xl bg-[#121829] border border-white/10 text-xs text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    <span>Analyzing performance telemetry & synthesizing answer...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Interactive Prompt Chips */}
            <div className="px-3 pt-2 pb-1 bg-[#090D1A] flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-white/5 shrink-0">
              <button
                type="button"
                onClick={() => handleSendMessage("What should I train today based on my recovery?")}
                className="px-2.5 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-purple-300 hover:text-white text-[11px] font-mono whitespace-nowrap transition-all pressable flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-2.5 h-2.5" />
                Workout Focus
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("How many macros and protein do I have left today?")}
                className="px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-300 hover:text-white text-[11px] font-mono whitespace-nowrap transition-all pressable flex items-center gap-1 shrink-0"
              >
                <Utensils className="w-2.5 h-2.5" />
                Remaining Fuel
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Analyze my muscle fatigue and readiness score")}
                className="px-2.5 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 hover:text-white text-[11px] font-mono whitespace-nowrap transition-all pressable flex items-center gap-1 shrink-0"
              >
                <Activity className="w-2.5 h-2.5" />
                Fatigue Analysis
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage("Suggest high protein Indian meal options for dinner")}
                className="px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 hover:text-white text-[11px] font-mono whitespace-nowrap transition-all pressable flex items-center gap-1 shrink-0"
              >
                <Flame className="w-2.5 h-2.5" />
                High Protein Meals
              </button>
            </div>

            {/* Input Bar with Safe Area Bottom Padding */}
            <div className="p-3 pb-safe bg-[#0C101E] border-t border-white/10 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask Coach about workouts, ghost weights, Indian meals..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[#080C16] border border-white/15 focus:border-purple-500 focus:outline-none text-xs text-white placeholder:text-slate-500 transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isThinking}
                  className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 text-white shadow-md shadow-purple-600/30 transition-all pressable shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: ADAPTIVE WORKOUT GENERATOR */}
        {activeTab === 'workout' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-[#121829] border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider">Scheduled Split</span>
                <h3 className="text-base font-black text-white">{scheduledSplit.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{exerciseRecommendations.length} movements calibrated for progressive overload</p>
              </div>
              <button
                onClick={() => {
                  onStartSuggestedWorkout(scheduledSplit.title, scheduledSplit.exerciseIds);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all pressable shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                Start Session
              </button>
            </div>

            <div className="space-y-2.5">
              {exerciseRecommendations.map((rec, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#121829] border border-white/10 hover:border-emerald-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-white/5 text-slate-400 font-mono text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-white">{rec.exerciseName}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/20">
                      {rec.badgeText}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/5 text-center font-mono">
                    <div className="p-1.5 rounded-xl bg-black/40">
                      <span className="text-[9px] text-slate-500 block uppercase">Target Load</span>
                      <span className="text-xs font-black text-emerald-400">{rec.recommendedWeightKg} kg</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-black/40">
                      <span className="text-[9px] text-slate-500 block uppercase">Sets × Reps</span>
                      <span className="text-xs font-black text-white">{rec.targetSets} × {rec.targetReps}</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-black/40">
                      <span className="text-[9px] text-slate-500 block uppercase">Target RPE</span>
                      <span className="text-xs font-black text-purple-300">RPE 8.0</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 italic flex items-center gap-1">
                    <Info className="w-3 h-3 text-slate-500 shrink-0" />
                    {rec.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SMART MACRO FUEL SYNTHESIZER */}
        {activeTab === 'nutrition' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {/* Macro Budget Overview */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-[#121829] border border-cyan-500/30">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-wider">Today's Fuel Status</span>
              <div className="flex items-baseline justify-between mt-1">
                <h3 className="text-base font-black text-white">
                  {macroBudget.consumed.calories} <span className="text-xs text-slate-400 font-normal">/ {macroBudget.targets.calories} kcal consumed</span>
                </h3>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {macroBudget.remaining.calories} kcal remaining
                </span>
              </div>

              {/* Progress Bars */}
              <div className="grid grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-white/10 text-center font-mono">
                <div className="p-2 rounded-xl bg-black/40">
                  <span className="text-[9px] text-slate-400 block uppercase">Protein</span>
                  <span className="text-xs font-black text-cyan-400">{macroBudget.consumed.protein}g / {macroBudget.targets.protein}g</span>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-cyan-400 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (macroBudget.consumed.protein / macroBudget.targets.protein) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-black/40">
                  <span className="text-[9px] text-slate-400 block uppercase">Carbs</span>
                  <span className="text-xs font-black text-amber-400">{macroBudget.consumed.carbs}g / {macroBudget.targets.carbs}g</span>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (macroBudget.consumed.carbs / macroBudget.targets.carbs) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-black/40">
                  <span className="text-[9px] text-slate-400 block uppercase">Fat</span>
                  <span className="text-xs font-black text-purple-400">{macroBudget.consumed.fat}g / {macroBudget.targets.fat}g</span>
                  <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-purple-400 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (macroBudget.consumed.fat / macroBudget.targets.fat) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick-Log Fuel Presets */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                High-Protein Fuel Recommendations (One-Click Log)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { name: 'Soya Chunks Bhurji + Roti', pro: 42, cal: 380, carb: 35, fat: 8, fiber: 4 },
                  { name: 'Paneer / Greek Yogurt Bowl', pro: 32, cal: 310, carb: 20, fat: 12, fiber: 2 },
                  { name: 'Whey Isolate + Oats Shake', pro: 34, cal: 290, carb: 32, fat: 4, fiber: 4 },
                  { name: 'Spiced Grilled Chicken Breast', pro: 46, cal: 245, carb: 2, fat: 5, fiber: 1 }
                ].map((meal, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-[#121829] border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{meal.name}</div>
                      <div className="text-[10px] font-mono text-cyan-400 mt-0.5">
                        {meal.pro}g Protein • {meal.cal} kcal
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        quickAddMacros(todayStr, 'snack', meal.cal, meal.pro, meal.carb, meal.fat, meal.fiber, meal.name);
                        setLoggedMealToast(`Logged ${meal.name} (${meal.pro}g Protein)!`);
                        setTimeout(() => setLoggedMealToast(null), 3000);
                      }}
                      className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all pressable flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Log
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RECOVERY RADAR & MUSCLE FATIGUE */}
        {activeTab === 'recovery' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-[#121829] border border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-purple-400 uppercase font-bold tracking-wider">Physiological Readiness</span>
                <h3 className="text-lg font-black text-white">
                  {todayRecovery ? `${todayRecovery.calculatedScore}% Recovery Score` : '88% Optimal Readiness'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {todayRecovery && todayRecovery.calculatedScore >= 80 
                    ? '🟢 Prime window for heavy compound overload.'
                    : '🟡 High performance ready. Maintain good set pacing.'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-mono font-black text-base shadow-inner">
                {todayRecovery ? `${todayRecovery.calculatedScore}%` : '88%'}
              </div>
            </div>

            {/* Muscle Groups Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                Muscle Fatigue & Recovery Status
              </h4>

              {Object.entries(muscleRecovery).map(([muscle, data]) => {
                const statusColor = data.status === 'ready' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : data.status === 'recovering' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                const barColor = data.status === 'ready' ? 'bg-emerald-400' : data.status === 'recovering' ? 'bg-amber-400' : 'bg-rose-500';

                return (
                  <div key={muscle} className="p-3 rounded-2xl bg-[#121829] border border-white/10 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{muscle}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({data.daysSince === 0 ? 'Trained today' : data.daysSince === 99 ? 'Fresh' : `${data.daysSince}d ago`})
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${statusColor}`}>
                        {data.recoveryPct}% {data.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${barColor}`} 
                        style={{ width: `${data.recoveryPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
