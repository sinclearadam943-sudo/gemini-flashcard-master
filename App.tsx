
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, BookOpen, Brain, Library, Trash2, Search, Loader2, Sparkles, AlertCircle, History, GraduationCap, Flame, FileImage, X, Camera, FileText, File as FileIcon, BarChart, Info, ArrowRight, CheckCircle, XCircle, Database, Download, Upload, RefreshCw } from 'lucide-react';
import { Deck, Flashcard, ViewMode, Difficulty, GlobalStats, SessionStats } from './types';
import { generateFlashcards, FileInput } from './services/qwenService';
import { StudyView } from './components/StudyView';
import { memoryService, autoSave, loadData } from './services/memoryService';

const App: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIBRARY);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileInput[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalReviewed: 0,
    totalKnown: 0,
    totalUnknown: 0,
    sessions: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const historySuggestions = [
    "冷战时期的地缘政治与核威慑理论",
    "奥斯曼帝国衰落的深层经济原因",
    "美索不达米亚的楔形文字与早期官僚体系",
    "工业革命时期的劳工阶级意识形态演变",
    "文艺复兴时期的佛罗伦萨银行家族与权力机制"
  ];

  // Load Data
  useEffect(() => {
    const fetchData = async () => {
      const { decks: loadedDecks, stats: loadedStats } = await loadData.all();
      setDecks(loadedDecks);
      setGlobalStats(loadedStats);
    };
    fetchData();
  }, []);

  // Save Data
  useEffect(() => {
    autoSave.decks(decks);
    autoSave.stats(globalStats);
  }, [decks, globalStats]);

  // Mistakes Collection Logic
  const mistakeCards = useMemo(() => {
    const allCards = decks.flatMap(d => d.cards);
    // Find unique card IDs from unknownIds in all sessions
    const unknownIds = new Set(globalStats.sessions.flatMap(s => s.unknownIds));
    // Known IDs in *any* session might override if we want "current" mistakes, 
    // but usually "Mistake Collection" is all-time fails until mastered.
    const knownIds = new Set(globalStats.sessions.flatMap(s => s.knownIds));
    
    // Cards that have been failed at least once AND are not currently "Known" (optional logic)
    // Let's go with cards that are in unknownIds list.
    return allCards.filter(c => unknownIds.has(c.id));
  }, [decks, globalStats]);

  const handleFinishSession = (stats: SessionStats) => {
    const sessionWithTimestamp = {
      ...stats,
      timestamp: Date.now()
    };
    
    setGlobalStats(prev => ({
      ...prev,
      totalReviewed: prev.totalReviewed + stats.knownIds.length + stats.unknownIds.length,
      totalKnown: prev.totalKnown + stats.knownIds.length,
      totalUnknown: prev.totalUnknown + stats.unknownIds.length,
      sessions: [sessionWithTimestamp, ...prev.sessions].slice(0, 50) // Keep last 50 sessions
    }));
    
    // 自动保存学习会话
    autoSave.session(sessionWithTimestamp);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setSelectedFiles(prev => [...prev, {
          name: file.name,
          data: base64String,
          mimeType: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && selectedFiles.length === 0) return;
    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateFlashcards(prompt, difficulty, selectedFiles);
      const newDeck: Deck = {
        id: crypto.randomUUID(),
        title: data.title || '未命名闪卡集',
        description: data.description || '',
        difficulty: difficulty,
        createdAt: Date.now(),
        cards: (data.cards || []).map(c => ({
          id: crypto.randomUUID(),
          question: c.question || '',
          options: c.options,
          answer: c.answer || '',
          explanation: c.explanation,
          sourceName: c.sourceName
        }))
      };
      if (newDeck.cards.length === 0) throw new Error("AI 未能生成有效的闪卡，请检查上传内容的清晰度。");
      setDecks(prev => [newDeck, ...prev]);
      setPrompt('');
      setSelectedFiles([]);
      setViewMode(ViewMode.LIBRARY);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成过程中发生未知错误。');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteDeck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个闪卡集吗？')) {
      try {
        // 从数据库中删除
        await memoryService.deleteDeck(id);
        // 更新UI状态
        setDecks(prev => prev.filter(d => d.id !== id));
      } catch (error) {
        console.error('删除闪卡集失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const startStudy = (deck: Deck) => {
    setSelectedDeck(deck);
    setViewMode(ViewMode.STUDY);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="w-8 h-8 text-indigo-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('officedocument')) return <FileIcon className="w-8 h-8 text-blue-500" />;
    return <FileIcon className="w-8 h-8 text-slate-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100">
      <nav className="bg-white border-b sticky top-0 z-40 px-8 py-5 flex items-center justify-between shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setViewMode(ViewMode.LIBRARY)}>
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-indigo-100 shadow-xl ring-4 ring-indigo-50">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            Gemini<span className="text-indigo-600 font-medium">Cards</span>
          </span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button onClick={() => setViewMode(ViewMode.LIBRARY)} className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-black transition-all ${viewMode === ViewMode.LIBRARY ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>
            <Library className="w-4 h-4" /><span className="hidden sm:inline uppercase tracking-widest">库</span>
          </button>
          <button onClick={() => setViewMode(ViewMode.STATS)} className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-black transition-all ${viewMode === ViewMode.STATS ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>
            <BarChart className="w-4 h-4" /><span className="hidden sm:inline uppercase tracking-widest">总结</span>
          </button>
          <a href="http://localhost:4000/" target="_blank" rel="noopener noreferrer" className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-black transition-all ${'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
            <BookOpen className="w-4 h-4" /><span className="hidden sm:inline uppercase tracking-widest">知识库</span>
          </a>
          <div className="relative group">
            <button className={`flex items-center space-x-2 px-4 py-2.5 rounded-full text-sm font-black transition-all ${'bg-slate-50 text-slate-600'}`}>
              <Database className="w-4 h-4" /><span className="hidden sm:inline uppercase tracking-widest">数据</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
              <button onClick={async () => {
                const data = await memoryService.exportAllData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gemini-flashcard-data-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }} className="flex items-center w-full px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                <Download className="w-4 h-4 mr-2 text-indigo-500" /> 导出数据
              </button>
              <button onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    setIsLoading(true);
                    setLoadingProgress(0);
                    setLoadingMessage('正在读取文件...');
                    
                    try {
                      // 模拟进度更新
                      setTimeout(() => setLoadingProgress(25), 100);
                      setTimeout(() => setLoadingProgress(50), 200);
                      
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        try {
                          setLoadingMessage('正在解析数据...');
                          setTimeout(() => setLoadingProgress(75), 300);
                          
                          const rawData = JSON.parse(event.target?.result as string);
                          const data = JSON.parse(JSON.stringify(rawData)); // 深拷贝数据
                          
                          // 检查是否有重复标题
                          const existingTitles = new Set(decks.map(deck => deck.title.toLowerCase()));
                          const duplicateDecks = data.decks?.filter((importedDeck: any) => 
                            existingTitles.has(importedDeck.title.toLowerCase())
                          ) || [];
                          
                          if (duplicateDecks.length > 0) {
                            const shouldRemoveDuplicates = window.confirm(
                              `发现 ${duplicateDecks.length} 个重复标题的卡片集，是否删除重复项？\n\n` +
                              duplicateDecks.map((deck: any) => `- ${deck.title}`).join('\n')
                            );
                            
                            if (shouldRemoveDuplicates) {
                              data.decks = data.decks.filter((importedDeck: any) => 
                                !existingTitles.has(importedDeck.title.toLowerCase())
                              );
                            }
                          }
                          
                          await memoryService.importData(data);
                          
                          setLoadingMessage('正在加载数据...');
                          setTimeout(() => setLoadingProgress(90), 400);
                          
                          setTimeout(() => {
                            setLoadingProgress(100);
                            setTimeout(async () => {
                              // 导入完成后重新加载所有数据
                              const { decks: loadedDecks, stats: loadedStats } = await loadData.all();
                              setDecks(loadedDecks);
                              setGlobalStats(loadedStats);
                              setIsLoading(false);
                            }, 300);
                          }, 500);
                        } catch (error) {
                          setIsLoading(false);
                          alert('数据导入失败，请检查文件格式');
                        }
                      };
                      reader.readAsText(file);
                    } catch (error) {
                      setIsLoading(false);
                      alert('数据导入失败，请检查文件格式');
                    }
                  }
                };
                input.click();
              }} className="flex items-center w-full px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                <Upload className="w-4 h-4 mr-2 text-green-500" /> 导入数据
              </button>
              <button onClick={async () => {
                if (window.confirm('确定要清除所有数据吗？此操作不可恢复。')) {
                  await memoryService.clearAllData();
                  setDecks([]);
                  setGlobalStats({
                    totalReviewed: 0,
                    totalKnown: 0,
                    totalUnknown: 0,
                    sessions: []
                  });
                  alert('所有数据已清除');
                }
              }} className="flex items-center w-full px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                <RefreshCw className="w-4 h-4 mr-2 text-red-500" /> 清除数据
              </button>
            </div>
          </div>
          <button onClick={() => { setViewMode(ViewMode.CREATE); setSelectedFiles([]); setPrompt(''); }} className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-black transition-all shadow-xl shadow-indigo-200 active:scale-95 hover:-translate-y-0.5">
            <Plus className="w-5 h-5" /><span className="hidden sm:inline uppercase tracking-widest">创建</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-12">
        {viewMode === ViewMode.LIBRARY && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter">资源库</h1>
                <p className="text-slate-400 mt-3 font-bold uppercase tracking-[0.2em] text-[10px]">智能学术研究与考试提分助手</p>
              </div>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input type="text" placeholder="搜索你的学习集..." className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all w-full sm:w-80 shadow-sm" />
              </div>
            </div>
            {decks.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[4rem] py-32 px-10 flex flex-col items-center text-center shadow-inner">
                <div className="bg-slate-50 p-8 rounded-[3rem] mb-8 border border-slate-100 shadow-xl shadow-slate-100/50">
                  <BookOpen className="w-20 h-20 text-slate-300" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4">开启你的智慧之旅</h3>
                <p className="text-slate-400 max-w-md mb-12 font-medium leading-relaxed">上传历史文献、生物教材 PDF 或任何学术考卷。Gemini 将自动提取精华知识点并生成带有解析的闪卡。</p>
                <button onClick={() => setViewMode(ViewMode.CREATE)} className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-95 hover:-translate-y-1">立即上传资料</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {decks.map((deck) => (
                  <div key={deck.id} onClick={() => startStudy(deck)} className="group bg-white border border-slate-100 rounded-[2.5rem] p-10 hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.15)] hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/30 rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-125 duration-700" />
                    <div className="flex items-start justify-between mb-8 relative">
                      <div className={`p-5 rounded-3xl transition-all duration-500 shadow-sm ${deck.difficulty === Difficulty.EXPERT ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white shadow-amber-50' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white shadow-indigo-50'}`}>
                        {deck.difficulty === Difficulty.EXPERT ? <Flame className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                      </div>
                      <button onClick={(e) => deleteDeck(deck.id, e)} className="p-3 text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"><Trash2 className="w-6 h-6" /></button>
                    </div>
                    <div className="relative">
                      <div className="flex items-center space-x-3 mb-3">
                        {deck.difficulty === Difficulty.EXPERT && <span className="text-[10px] font-black bg-amber-500 text-white px-3 py-1 rounded-full shadow-lg shadow-amber-100 uppercase tracking-widest">Expert</span>}
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{deck.title}</h3>
                      </div>
                      <p className="text-slate-400 text-sm font-bold line-clamp-2 leading-loose h-12">{deck.description}</p>
                    </div>
                    <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between relative">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">{deck.cards.length} Cards</div>
                      <div className="text-[11px] text-slate-300 font-bold italic">{new Date(deck.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === ViewMode.STATS && (
          <div className="animate-in slide-in-from-bottom-6 duration-700 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter">学习总结</h1>
                <p className="text-slate-400 mt-3 font-bold uppercase tracking-[0.2em] text-[10px]">实时追踪你的学术成长与知识盲区</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Overall Progress Card */}
              <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-2xl font-black text-slate-900">核心统计</h3>
                   <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Global Stats</div>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">总复习次数</span>
                    <div className="text-4xl font-black text-slate-900">{globalStats.totalReviewed}</div>
                  </div>
                  <div className="space-y-1 text-green-600">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已掌握</span>
                    <div className="text-4xl font-black">{globalStats.totalKnown}</div>
                  </div>
                  <div className="space-y-1 text-red-600">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">待加强</span>
                    <div className="text-4xl font-black">{globalStats.totalUnknown}</div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-black text-slate-700">整体正确率</span>
                    <span className="text-2xl font-black text-indigo-600">
                      {globalStats.totalReviewed > 0 ? Math.round((globalStats.totalKnown / globalStats.totalReviewed) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex ring-4 ring-slate-50">
                    <div 
                      className="bg-indigo-500 h-full transition-all duration-1000" 
                      style={{ width: `${globalStats.totalReviewed > 0 ? (globalStats.totalKnown / globalStats.totalReviewed) * 100 : 0}%` }} 
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="p-6 bg-slate-50 rounded-[2rem] flex items-center space-x-4">
                      <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600"><Library className="w-5 h-5" /></div>
                      <div>
                        <div className="text-sm font-black text-slate-900">{decks.length} 个</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">学习集总数</div>
                      </div>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-[2rem] flex items-center space-x-4">
                      <div className="bg-amber-100 p-3 rounded-2xl text-amber-600"><Flame className="w-5 h-5" /></div>
                      <div>
                        <div className="text-sm font-black text-slate-900">{globalStats.sessions.length} 次</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">总计学习环节</div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Mistake Collection Side Panel */}
              <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-slate-900">错题本</h3>
                  <div className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {mistakeCards.length} Mistake Cards
                  </div>
                </div>

                {mistakeCards.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <CheckCircle className="w-12 h-12 text-green-300" />
                    <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-wider">暂无错题，继续保持完美发挥！</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                    {mistakeCards.slice(0, 10).map((card, idx) => (
                      <div key={card.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all group">
                        <div className="flex items-start justify-between mb-2">
                           <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Card #{idx + 1}</span>
                           <XCircle className="w-3 h-3 text-red-400" />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-relaxed mb-3">{card.question}</h4>
                        <div className="text-[9px] font-bold text-slate-400 italic flex items-center">
                          <Info className="w-2 h-2 mr-1" /> 点击下方进入专门复习
                        </div>
                      </div>
                    ))}
                    {mistakeCards.length > 10 && (
                      <div className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">还有 {mistakeCards.length - 10} 道错题...</div>
                    )}
                  </div>
                )}
                
                <button 
                  disabled={mistakeCards.length === 0}
                  onClick={() => {
                    const mistakeDeck: Deck = {
                      id: 'mistake-collection',
                      title: '错题精选集',
                      description: '根据历史学习情况自动生成的薄弱知识点集合',
                      cards: mistakeCards,
                      createdAt: Date.now(),
                      difficulty: Difficulty.EXPERT
                    };
                    startStudy(mistakeDeck);
                  }}
                  className="mt-8 w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-100 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none flex items-center justify-center space-x-3"
                >
                  <span>专项复习错题集</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recent Sessions List */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
               <h3 className="text-2xl font-black text-slate-900 mb-8">最近复习轨迹</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="border-b border-slate-100">
                      <tr>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">学习日期</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">掌握 (Known)</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">薄弱 (Unknown)</th>
                        <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">表现评估</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {globalStats.sessions.length === 0 ? (
                        <tr><td colSpan={4} className="py-10 text-center text-sm font-bold text-slate-300 italic">尚未记录任何学习环节</td></tr>
                      ) : (
                        globalStats.sessions.map((session, idx) => {
                          const acc = Math.round((session.knownIds.length / (session.knownIds.length + session.unknownIds.length)) * 100);
                          return (
                            <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                              <td className="py-4 text-xs font-bold text-slate-600">{new Date(session.timestamp).toLocaleString()}</td>
                              <td className="py-4 text-xs font-black text-green-600">+{session.knownIds.length}</td>
                              <td className="py-4 text-xs font-black text-red-500">-{session.unknownIds.length}</td>
                              <td className="py-4">
                                <div className="flex items-center space-x-2">
                                  <div className="h-2 w-20 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${acc}%` }} />
                                  </div>
                                  <span className="text-[10px] font-black text-indigo-600">{acc}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {viewMode === ViewMode.CREATE && (
          <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
            <div className="bg-white border border-slate-200 rounded-[3rem] p-10 sm:p-20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />
              <div className="text-center mb-16 relative">
                <div className="inline-flex bg-slate-50 text-indigo-600 p-6 rounded-[2.5rem] mb-8 shadow-inner ring-8 ring-slate-50/50"><GraduationCap className="w-12 h-12" /></div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">智能资料解析</h1>
                <p className="text-slate-400 font-bold text-lg uppercase tracking-widest">Gemini 会自动提取 <span className="text-indigo-600 underline decoration-4 underline-offset-8">原题、选项及详细解析</span></p>
              </div>
              <form onSubmit={handleGenerate} className="space-y-12">
                <div className="space-y-6">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center"><Camera className="w-5 h-5 mr-3 text-indigo-500" /> 资料上传 (支持 PDF/WORD/图像)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-6">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden border-2 border-slate-50 group flex items-center justify-center bg-slate-50 shadow-xl shadow-slate-200/50 hover:border-indigo-100 transition-all">
                        {file.mimeType.startsWith('image/') ? (<img src={`data:${file.mimeType};base64,${file.data}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />) : (
                          <div className="flex flex-col items-center p-4">{getFileIcon(file.mimeType)}<span className="text-[8px] mt-3 font-black text-slate-500 uppercase truncate px-2 max-w-full text-center tracking-tighter">{file.name}</span></div>
                        )}
                        <button type="button" onClick={() => removeFile(idx)} className="absolute top-3 right-3 p-2 bg-white/90 shadow-xl hover:bg-red-500 hover:text-white rounded-full transition-all active:scale-90"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-[2rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 hover:border-indigo-400 hover:text-indigo-400 transition-all bg-slate-50 group active:scale-95 hover:bg-white"><Plus className="w-10 h-10 mb-2 group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest text-center px-4">添加文件</span></button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple />
                </div>
                <div className="space-y-6">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">挑战级别设定</label>
                  <div className="grid grid-cols-3 gap-6">
                    {[{ id: Difficulty.SIMPLE, label: '基础', icon: BookOpen, color: 'peer-checked:bg-green-600 peer-checked:shadow-green-100' }, { id: Difficulty.MEDIUM, label: '进阶', icon: Sparkles, color: 'peer-checked:bg-indigo-600 peer-checked:shadow-indigo-100' }, { id: Difficulty.EXPERT, label: '专家', icon: Flame, color: 'peer-checked:bg-amber-600 peer-checked:shadow-amber-100' }].map((opt) => (
                      <label key={opt.id} className="cursor-pointer">
                        <input type="radio" name="difficulty" className="sr-only peer" checked={difficulty === opt.id} onChange={() => setDifficulty(opt.id)} />
                        <div className={`flex flex-col items-center justify-center p-6 border-2 border-slate-50 rounded-[2rem] transition-all hover:bg-slate-50 peer-checked:text-white peer-checked:ring-0 peer-checked:shadow-2xl hover:shadow-lg ${opt.color}`}><opt.icon className="w-8 h-8 mb-3" /><span className="text-sm font-black uppercase tracking-widest">{opt.label}</span></div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">话题或特定要求</label>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="输入你想学习的核心概念，或对文档解析的特别吩咐..." className="w-full h-44 px-8 py-6 bg-slate-50 border-2 border-slate-50 rounded-[2.5rem] text-slate-900 font-bold placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all resize-none shadow-inner" disabled={isGenerating} />
                  <div className="mt-8">
                    <p className="text-[10px] font-black text-slate-300 mb-4 flex items-center uppercase tracking-widest"><History className="w-4 h-4 mr-2 text-indigo-400" /> 热门学术挑战：</p>
                    <div className="flex flex-wrap gap-3">{historySuggestions.map((suggestion) => (<button key={suggestion} type="button" onClick={() => { setPrompt(suggestion); setDifficulty(Difficulty.EXPERT); }} className="text-[11px] px-5 py-2.5 bg-white hover:bg-indigo-600 hover:text-white text-slate-500 rounded-2xl transition-all border border-slate-100 shadow-sm font-black hover:shadow-indigo-100">{suggestion}</button>))}</div>
                  </div>
                </div>
                {error && (<div className="flex items-start space-x-4 text-red-600 bg-red-50 p-6 rounded-[2rem] text-sm font-black animate-in slide-in-from-top-4 border border-red-100"><AlertCircle className="w-6 h-6 shrink-0 mt-0.5" /><span>{error}</span></div>)}
                <button type="submit" disabled={isGenerating || (!prompt.trim() && selectedFiles.length === 0)} className={`w-full py-6 rounded-[2.5rem] font-black text-2xl transition-all shadow-2xl flex items-center justify-center space-x-4 active:scale-95 group ${difficulty === Difficulty.EXPERT ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200 text-white' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-300 text-white'} disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed disabled:shadow-none`}>
                  {isGenerating ? (<><Loader2 className="w-8 h-8 animate-spin" /><span className="uppercase tracking-widest">正在深度分析资料...</span></>) : (<><Sparkles className="w-8 h-8 group-hover:scale-125 transition-transform" /><span className="uppercase tracking-widest">AI 智能解析并生成</span></>)}
                </button>
              </form>
            </div>
            <button onClick={() => setViewMode(ViewMode.LIBRARY)} className="mt-12 mx-auto block text-slate-400 font-black hover:text-indigo-600 transition-colors tracking-[0.3em] uppercase text-xs">取消创作</button>
          </div>
        )}
      </main>

      {viewMode === ViewMode.STUDY && selectedDeck && (
        <StudyView 
          deck={selectedDeck} 
          onClose={() => setViewMode(ViewMode.LIBRARY)}
          onFinishSession={handleFinishSession}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-md w-full animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex bg-indigo-50 p-6 rounded-[2rem] mb-6">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">处理中</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">{loadingMessage}</p>
            </div>
            <div className="space-y-4">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-300 ease-out" 
                  style={{ width: `${loadingProgress}%` }} 
                />
              </div>
              <p className="text-right text-xs font-black text-slate-500">{loadingProgress}%</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
