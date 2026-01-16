
import React, { useState, useEffect } from 'react';
import { Flashcard } from '../types';
import { FileText, Lightbulb, CheckCircle2, XCircle } from 'lucide-react';

interface FlashcardProps {
  card: Flashcard;
  isFlipped: boolean;
  onToggleFlip: () => void;
  onSelectResult?: (isCorrect: boolean) => void;
}

export const FlashcardComponent: React.FC<FlashcardProps> = ({ card, isFlipped, onToggleFlip, onSelectResult }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Reset local state when card changes
  useEffect(() => {
    setSelectedIdx(null);
    setFeedback(null);
  }, [card.id]);

  const handleOptionClick = (e: React.MouseEvent, index: number, opt: string) => {
    e.stopPropagation(); // Prevent card flip
    if (feedback) return; // Already answered

    setSelectedIdx(index);
    
    // Logic to determine if correct:
    // Answer might be "A" or "A. Content" or just "Content"
    const letter = String.fromCharCode(65 + index);
    const isCorrect = 
      card.answer.trim().startsWith(letter) || 
      card.answer.trim() === opt.trim() ||
      opt.trim().includes(card.answer.trim());

    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    // Auto flip after a delay to show answer
    setTimeout(() => {
      onToggleFlip();
      if (onSelectResult) onSelectResult(isCorrect);
    }, 800);
  };

  return (
    <div 
      className="w-full max-w-2xl min-h-[480px] h-auto perspective-1000 cursor-pointer mx-auto group"
      onClick={() => !feedback && onToggleFlip()}
    >
      <div className={`relative w-full min-h-[480px] transition-all duration-700 preserve-3d shadow-2xl rounded-[2.5rem] ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front: Question & Options */}
        <div className="absolute inset-0 backface-hidden flex flex-col p-8 sm:p-10 bg-white border border-slate-100 rounded-[2.5rem]">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">题目 / 概念</span>
            {card.sourceName && (
              <div className="flex items-center text-[10px] text-slate-400 font-bold max-w-[150px] truncate">
                <FileText className="w-3 h-3 mr-1 shrink-0" />
                {card.sourceName}
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-center overflow-y-auto pr-2 scrollbar-hide">
            <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-relaxed mb-6 whitespace-pre-wrap">
              {card.question}
            </h3>
            
            {card.options && card.options.length > 0 && (
              <div className="grid grid-cols-1 gap-2.5 w-full">
                {card.options.map((opt, i) => {
                  const isSelected = selectedIdx === i;
                  const isWrongFeedback = isSelected && feedback === 'wrong';
                  const isCorrectFeedback = isSelected && feedback === 'correct';
                  
                  return (
                    <div 
                      key={i} 
                      onClick={(e) => handleOptionClick(e, i, opt)}
                      className={`p-4 border rounded-2xl text-sm font-bold flex items-start transition-all duration-300 ${
                        isWrongFeedback ? 'bg-red-50 border-red-200 text-red-700' :
                        isCorrectFeedback ? 'bg-green-50 border-green-200 text-green-700' :
                        isSelected ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                        'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-indigo-100'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center mr-3 text-xs shrink-0 mt-0.5 ${
                        isWrongFeedback ? 'bg-red-500 text-white' :
                        isCorrectFeedback ? 'bg-green-500 text-white' :
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-200'
                      }`}>
                        {isWrongFeedback ? <XCircle className="w-4 h-4" /> : 
                         isCorrectFeedback ? <CheckCircle2 className="w-4 h-4" /> : 
                         String.fromCharCode(65 + i)}
                      </span>
                      <span className="truncate whitespace-normal leading-relaxed">{opt.replace(/^[A-Z][\.\:\、\s]+/, '')}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center text-[10px] text-slate-300 font-black uppercase tracking-widest">
            {card.options?.length ? '选择选项自动比对' : '点击翻转查看答案'} &rarr;
          </div>
        </div>

        {/* Back: Answer & Explanation */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col p-8 sm:p-10 bg-indigo-600 rounded-[2.5rem] text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
          
          <div className="flex justify-between items-center mb-6 relative">
            <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest bg-indigo-500/30 px-3 py-1 rounded-full">正确答案</span>
            <Lightbulb className="w-5 h-5 text-indigo-200" />
          </div>

          <div className="flex-1 flex flex-col justify-center overflow-y-auto pr-2 scrollbar-hide relative">
            <div className="text-2xl sm:text-3xl font-black mb-6 leading-relaxed whitespace-pre-wrap">
              {card.answer}
            </div>
            
            {card.explanation && (
              <div className="p-6 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-sm">
                <p className="text-sm font-medium leading-relaxed text-indigo-50 whitespace-pre-wrap">
                  <span className="block font-black text-indigo-200 text-[10px] uppercase mb-2 tracking-[0.2em]">详细解析 / 背景资料</span>
                  {card.explanation}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-[10px] text-indigo-300 font-black uppercase tracking-widest relative">
            再次点击翻回正面
          </div>
        </div>
      </div>
    </div>
  );
};
