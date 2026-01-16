
import React, { useState, useEffect, useCallback } from 'react';
import { Deck, SessionStats } from '../types';
import { FlashcardComponent } from './FlashcardComponent';
import { ChevronLeft, ChevronRight, X, RotateCcw, CheckCircle2, XCircle, Trophy, BarChart3, Keyboard } from 'lucide-react';

interface StudyViewProps {
  deck: Deck;
  onClose: () => void;
  onFinishSession?: (stats: SessionStats) => void;
}

interface Stats {
  known: Set<string>;
  unknown: Set<string>;
}

export const StudyView: React.FC<StudyViewProps> = ({ deck, onClose, onFinishSession }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState<Stats>({ known: new Set(), unknown: new Set() });
  const [showSummary, setShowSummary] = useState(false);

  const handleFinish = useCallback(() => {
    if (onFinishSession) {
      onFinishSession({
        knownIds: Array.from(stats.known),
        unknownIds: Array.from(stats.unknown),
        timestamp: Date.now()
      });
    }
    setShowSummary(true);
  }, [onFinishSession, stats]);

  const handleKnown = useCallback(() => {
    setStats(prev => {
      const nextKnown = new Set(prev.known);
      const nextUnknown = new Set(prev.unknown);
      nextUnknown.delete(deck.cards[currentIndex].id);
      nextKnown.add(deck.cards[currentIndex].id);
      return { known: nextKnown, unknown: nextUnknown };
    });
    if (currentIndex < deck.cards.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      }, 300);
    } else {
      handleFinish();
    }
  }, [currentIndex, deck.cards, handleFinish]);

  const handleUnknown = useCallback(() => {
    setStats(prev => {
      const nextKnown = new Set(prev.known);
      const nextUnknown = new Set(prev.unknown);
      nextKnown.delete(deck.cards[currentIndex].id);
      nextUnknown.add(deck.cards[currentIndex].id);
      return { known: nextKnown, unknown: nextUnknown };
    });
    if (currentIndex < deck.cards.length - 1) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      }, 300);
    } else {
      handleFinish();
    }
  }, [currentIndex, deck.cards, handleFinish]);

  const toggleFlip = useCallback(() => setIsFlipped(prev => !prev), []);
  const nextCard = useCallback(() => {
    if (currentIndex < deck.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, deck.cards]);
  const prevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSummary) return;
      switch(e.code) {
        case 'Space': e.preventDefault(); toggleFlip(); break;
        case 'ArrowLeft': prevCard(); break;
        case 'ArrowRight': nextCard(); break;
        case 'Digit1': handleUnknown(); break;
        case 'Digit2': handleKnown(); break;
        case 'Escape': onClose(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFlip, nextCard, prevCard, handleKnown, handleUnknown, showSummary, onClose]);

  const progress = ((currentIndex + 1) / deck.cards.length) * 100;
  const knownCount = stats.known.size;
  const unknownCount = stats.unknown.size;
  const reviewedCount = stats.known.size + stats.unknown.size;

  if (showSummary) {
    const accuracy = reviewedCount > 0 ? Math.round((knownCount / reviewedCount) * 100) : 0;
    const total = deck.cards.length;
    const knownWidth = (knownCount / total) * 100;
    const unknownWidth = (unknownCount / total) * 100;
    const remainingWidth = 100 - knownWidth - unknownWidth;

    return (
      <div className="fixed inset-0 bg-slate-50 z-[60] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 overflow-y-auto">
        <div className="bg-white rounded-[3.5rem] shadow-2xl p-10 sm:p-14 max-w-2xl w-full text-center border border-slate-100 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <div className="mt-8 mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-2">学习回顾报告</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Deck: {deck.title}</p>
          </div>
          <div className="mb-12 space-y-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">掌握度分布</span>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600">{accuracy}%</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">综合正确率</span>
              </div>
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-2xl flex overflow-hidden p-1.5 ring-1 ring-slate-200/50">
              <div className="h-full bg-green-500 transition-all duration-1000 rounded-xl flex items-center justify-center overflow-hidden" style={{ width: `${knownWidth}%` }}>
                {knownWidth > 10 && <span className="text-[9px] font-black text-white">{knownCount}</span>}
              </div>
              <div className="h-full bg-red-500 transition-all duration-1000 rounded-xl flex items-center justify-center mx-1 overflow-hidden" style={{ width: `${unknownWidth}%` }}>
                {unknownWidth > 10 && <span className="text-[9px] font-black text-white">{unknownCount}</span>}
              </div>
              <div className="h-full bg-slate-200 transition-all duration-1000 rounded-xl flex items-center justify-center overflow-hidden" style={{ width: `${remainingWidth}%` }}>
                {remainingWidth > 10 && <span className="text-[9px] font-black text-slate-400">{total - reviewedCount}</span>}
              </div>
            </div>
            <div className="flex items-center justify-center space-x-6 text-[10px] font-black uppercase tracking-widest pt-2">
               <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2" /> 掌握 ({knownCount})</div>
               <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2" /> 需加强 ({unknownCount})</div>
               <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-slate-300 mr-2" /> 未完成 ({total - reviewedCount})</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-left">
               <BarChart3 className="w-5 h-5 text-indigo-500 mb-3" />
               <div className="text-2xl font-black text-slate-800">{reviewedCount}</div>
               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">已复习卡片</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-left">
               <Keyboard className="w-5 h-5 text-indigo-500 mb-3" />
               <div className="text-2xl font-black text-slate-800">{deck.cards.length}</div>
               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">总题量</div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={() => { setCurrentIndex(0); setIsFlipped(false); setStats({ known: new Set(), unknown: new Set() }); setShowSummary(false); }} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center group">
              <RotateCcw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" /> 重新开始学习
            </button>
            <button onClick={onClose} className="w-full py-5 bg-white text-slate-400 rounded-[1.5rem] font-black text-lg hover:text-slate-900 transition-all border border-slate-100">返回我的库</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col overflow-hidden animate-in fade-in duration-300">
      <div className="bg-white border-b px-8 py-5 flex items-center justify-between shadow-sm relative z-10">
        <div className="flex items-center space-x-5">
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"><X className="w-6 h-6 text-slate-500" /></button>
          <div>
            <h2 className="text-xl font-black text-slate-900 truncate max-w-[200px] sm:max-w-md">{deck.title}</h2>
            <div className="flex items-center space-x-2 mt-0.5">
               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">自测练习模式</p>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-6">
          <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-sm font-black text-slate-700">{knownCount}</span></div>
          <div className="flex items-center space-x-2"><XCircle className="w-4 h-4 text-red-500" /><span className="text-sm font-black text-slate-700">{unknownCount}</span></div>
          <div className="h-4 w-px bg-slate-200" /><div className="text-sm font-black text-slate-400">进度 {currentIndex + 1} / {deck.cards.length}</div>
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-100 relative overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(99,102,241,0.6)]" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-4xl relative">
          <FlashcardComponent key={deck.cards[currentIndex].id} card={deck.cards[currentIndex]} isFlipped={isFlipped} onToggleFlip={toggleFlip} onSelectResult={(isCorrect) => isCorrect ? handleKnown() : handleUnknown()} />
        </div>
        <div className={`mt-10 flex items-center space-x-6 transition-all duration-500 ${isFlipped ? 'opacity-100 transform translate-y-0 scale-100' : 'opacity-20 transform translate-y-4 scale-95 pointer-events-none grayscale'}`}>
          <button onClick={handleUnknown} className="group flex flex-col items-center space-y-2">
            <div className="p-6 rounded-[2.5rem] bg-white border border-slate-100 text-red-500 shadow-xl shadow-slate-200/50 hover:bg-red-500 hover:text-white transition-all hover:-translate-y-2 active:scale-90"><XCircle className="w-10 h-10" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest group-hover:text-red-500">记不清了 (1)</span>
          </button>
          <div className="h-16 w-px bg-slate-200 hidden sm:block mx-4" />
          <button onClick={handleKnown} className="group flex flex-col items-center space-y-2">
            <div className="p-6 rounded-[2.5rem] bg-white border border-slate-100 text-green-500 shadow-xl shadow-slate-200/50 hover:bg-green-500 hover:text-white transition-all hover:-translate-y-2 active:scale-90"><CheckCircle2 className="w-10 h-10" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest group-hover:text-green-500">完全掌握 (2)</span>
          </button>
        </div>
        <div className="absolute bottom-8 left-10 right-10 flex items-center justify-between">
           <div className="flex items-center space-x-4">
             <button onClick={prevCard} disabled={currentIndex === 0} className={`p-4 rounded-[1.25rem] border border-slate-200 transition-all ${currentIndex === 0 ? 'opacity-30 cursor-not-allowed bg-transparent border-transparent' : 'bg-white text-slate-600 hover:bg-slate-50 hover:shadow-xl hover:border-indigo-100 active:scale-90'}`}><ChevronLeft className="w-6 h-6" /></button>
             <button onClick={nextCard} disabled={currentIndex === deck.cards.length - 1} className={`p-4 rounded-[1.25rem] border border-slate-200 transition-all ${currentIndex === deck.cards.length - 1 ? 'opacity-30 cursor-not-allowed bg-transparent border-transparent' : 'bg-white text-slate-600 hover:bg-slate-50 hover:shadow-xl hover:border-indigo-100 active:scale-90'}`}><ChevronRight className="w-6 h-6" /></button>
           </div>
           <div className="hidden lg:flex items-center space-x-8 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-[1.5rem] border border-slate-100 shadow-sm ring-1 ring-slate-100">
             <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]"><Keyboard className="w-4 h-4 mr-3 text-indigo-400" /> 交互快捷键</div>
             <div className="flex items-center space-x-4">
               <span className="text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap uppercase">Space 翻转</span>
               <span className="text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap uppercase">&larr; &rarr; 切换</span>
               <span className="text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap uppercase">1/2 标记</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
