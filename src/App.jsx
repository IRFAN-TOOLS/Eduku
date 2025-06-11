import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { 
    School, BrainCircuit, Lightbulb, FileText, ArrowLeft, Loader, Sparkles, 
    History, UploadCloud, Youtube, Check, X, MessageSquarePlus, FlaskConical, Globe, 
    Atom, Calculator, Dna, BarChart2, Drama, Computer, BookHeart, Landmark
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- App Context for Centralized State Management ---
const AppContext = createContext(null);

// --- Curriculum Data ---
const curriculum = {
  'SD': { subjects: [ { name: 'Matematika', icon: <Calculator size={48} className="text-blue-500"/> }, { name: 'IPA', icon: <Atom size={48} className="text-green-500"/> }, { name: 'IPS', icon: <Globe size={48} className="text-orange-500"/> }, { name: 'Bahasa Indonesia', icon: <BookHeart size={48} className="text-red-500"/> }, { name: 'PPKn', icon: <Landmark size={48} className="text-yellow-500"/> } ] },
  'SMP': { subjects: [ { name: 'Matematika', icon: <Calculator size={48} className="text-blue-500"/> }, { name: 'IPA Terpadu', icon: <FlaskConical size={48} className="text-green-500"/> }, { name: 'IPS Terpadu', icon: <Globe size={48} className="text-orange-500"/> }, { name: 'Bahasa Indonesia', icon: <BookHeart size={48} className="text-red-500"/> }, { name: 'Bahasa Inggris', icon: <Drama size={48} className="text-purple-500"/> }, { name: 'Informatika', icon: <Computer size={48} className="text-gray-600"/> } ] },
  'SMA': { tracks: { 'IPA': [ { name: 'Matematika Peminatan', icon: <Calculator size={48} className="text-blue-500"/> }, { name: 'Fisika', icon: <Atom size={48} className="text-sky-500"/> }, { name: 'Kimia', icon: <FlaskConical size={48} className="text-green-500"/> }, { name: 'Biologi', icon: <Dna size={48} className="text-teal-500"/> } ], 'IPS': [ { name: 'Ekonomi', icon: <BarChart2 size={48} className="text-indigo-500"/> }, { name: 'Geografi', icon: <Globe size={48} className="text-orange-500"/> }, { name: 'Sosiologi', icon: <School size={48} className="text-rose-500"/> }, { name: 'Sejarah', icon: <History size={48} className="text-amber-700"/> } ] } }
};

// --- API Helper Functions ---
const callGeminiAPI = async (prompt, isJson = false) => {
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    if (isJson) payload.generationConfig = { responseMimeType: "application/json" };
    const apiKey = "AIzaSyArJ1P8HanSQ_XVWX9m4kUlsIVXrBRInik";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`Gemini API call failed: ${response.status}`);
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Invalid Gemini API response");
    return text;
};

// --- NEW IMAGE API FUNCTION ---
const callDeepImgAPI = async (prompt) => {
    const apiUrl = 'https://api-preview.chatgot.io/api/v1/deepimg/flux-1-dev';
    const payload = { prompt };
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        throw new Error(`DeepImg API call failed: ${response.status}`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};

// --- Custom Hook for Local Storage ---
function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) { return initialValue; }
    });
    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) { console.error(error); }
    };
    return [storedValue, setValue];
}

// --- App Provider Component ---
const AppProvider = ({ children }) => {
    const [screen, setScreen] = useState('levelSelection');
    const [level, setLevel] = useState('');
    const [track, setTrack] = useState('');
    const [subject, setSubject] = useState(null);
    const [topic, setTopic] = useState('');
    const [lessonContent, setLessonContent] = useState(null);
    const [bankSoalQuestions, setBankSoalQuestions] = useState([]);
    const [history, setHistory] = useLocalStorage('bdukasiHistory_v13', []);
    const [error, setError] = useState('');

    const updateHistory = useCallback((newEntry) => {
        setHistory(prev => [newEntry, ...prev.filter(h => h.topic !== newEntry.topic)].slice(0, 50));
    }, [setHistory]);
    
    const handleGlobalError = useCallback((message) => {
        setError(message || "Terjadi kesalahan yang tidak diketahui.");
    }, []);

    const value = { screen, setScreen, level, setLevel, track, setTrack, subject, setSubject, topic, setTopic, lessonContent, setLessonContent, bankSoalQuestions, setBankSoalQuestions, history, updateHistory, error, setError: handleGlobalError };
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- Main App Component ---
export default function App() {
    return <AppProvider><Main /></AppProvider>;
}

const Main = () => {
    const { screen, error, setError, setScreen } = useContext(AppContext);
    
    const renderScreen = () => {
        if (error) return <ErrorScreen message={error} onRetry={() => { setError(''); setScreen('levelSelection'); }} />;
        switch (screen) {
            case 'levelSelection': return <LevelSelectionScreen />;
            case 'trackSelection': return <TrackSelectionScreen />;
            case 'subjectSelection': return <SubjectSelectionScreen />;
            case 'subjectDashboard': return <SubjectDashboardScreen />;
            case 'lesson': return <LessonScreen />;
            case 'quiz': return <QuizPlayerScreen />;
            case 'bankSoalGenerator': return <BankSoalGeneratorScreen />;
            case 'bankSoalPlayer': return <BankSoalPlayerScreen />;
            default: return <LevelSelectionScreen />;
        }
    };
    return <div className="bg-gray-100 min-h-screen font-sans antialiased">{renderScreen()}</div>;
};

// --- Custom Renderer for Math using External Service ---
const ContentRenderer = ({ text }) => {
    if (!text) return <p className="text-gray-500">Materi tidak tersedia.</p>;
    const parts = text.split('$$');
    return (
        <div className="prose prose-lg max-w-none">
            {parts.map((part, index) => {
                if (index % 2 === 0) {
                    return <ReactMarkdown key={index}>{part}</ReactMarkdown>;
                } else {
                    if (part.trim() === '') return null;
                    const encodedLatex = encodeURIComponent(part);
                    return (<div key={index} className="flex justify-center my-4 overflow-x-auto p-2 bg-gray-100 rounded"><img src={`https://latex.codecogs.com/svg.latex?${encodedLatex}`} alt={`Rumus: ${part}`} className="max-w-full h-auto" /></div>);
                }
            })}
        </div>
    );
};

// --- Screens ---
const LevelSelectionScreen = () => {
    const { setScreen, setLevel } = useContext(AppContext);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-white">
            <Sparkles className="mx-auto text-blue-600 h-20 w-20" />
            <h1 className="text-4xl font-bold text-gray-800 mt-4 text-center">Bdukasi Expert</h1>
            <p className="text-gray-600 mt-2 mb-8 text-center max-w-md">Platform Belajar Cerdas Kurikulum Merdeka</p>
            <div className="w-full max-w-xs space-y-4">
                {Object.keys(curriculum).map(lvl => (<button key={lvl} onClick={() => { setLevel(lvl); setScreen(lvl === 'SMA' ? 'trackSelection' : 'subjectSelection'); }} className="w-full p-5 bg-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg flex items-center justify-center"> <School className="mr-3" /> {lvl} </button>))}
            </div>
        </div>
    );
};
const TrackSelectionScreen = () => {
    const { setScreen, setTrack } = useContext(AppContext);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Header onBack={() => setScreen('levelSelection')} title="Pilih Jurusan SMA" />
            <div className="w-full max-w-xs space-y-4">
                <button onClick={() => { setTrack('IPA'); setScreen('subjectSelection'); }} className="w-full p-5 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg flex items-center justify-center"> <FlaskConical className="mr-3" /> IPA </button>
                <button onClick={() => { setTrack('IPS'); setScreen('subjectSelection'); }} className="w-full p-5 bg-yellow-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg flex items-center justify-center"> <Globe className="mr-3" /> IPS </button>
            </div>
        </div>
    );
};
const SubjectSelectionScreen = () => {
    const { level, track, setScreen, setSubject } = useContext(AppContext);
    const subjects = level === 'SMA' ? curriculum.SMA.tracks[track] : curriculum[level].subjects;
    const backScreen = level === 'SMA' ? 'trackSelection' : 'levelSelection';

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <Header onBack={() => setScreen(backScreen)} title={`Pelajaran ${level} ${track || ''}`} />
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {subjects.map((s) => (<button key={s.name} onClick={() => { setSubject(s); setScreen('subjectDashboard'); }} className="p-4 bg-gray-50 hover:bg-blue-100 rounded-xl flex flex-col items-center justify-center text-center transition-transform transform hover:scale-105 aspect-square"> {s.icon} <span className="font-semibold text-gray-700 text-center mt-3">{s.name}</span> </button>))}
                </div>
            </div>
        </div>
    );
};
const SubjectDashboardScreen = () => {
    const { subject, setScreen } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('rekomendasi');
    return (
        <div className="p-4 max-w-3xl mx-auto">
            <Header onBack={() => setScreen('subjectSelection')} title={subject.name} icon={React.cloneElement(subject.icon, { size: 32 })} />
            <SearchTopic />
            <div className="bg-white rounded-2xl shadow-lg p-2">
                <div className="flex border-b">
                    <TabButton text="Rekomendasi" icon={<Lightbulb/>} active={activeTab==='rekomendasi'} onClick={() => setActiveTab('rekomendasi')} />
                    <TabButton text="Riwayat" icon={<History/>} active={activeTab==='riwayat'} onClick={() => setActiveTab('riwayat')} />
                    <TabButton text="Bank Soal" icon={<BrainCircuit/>} active={activeTab==='bank_soal'} onClick={() => setScreen('bankSoalGenerator')} />
                </div>
                <div className="p-4 min-h-[200px]">
                    {activeTab === 'rekomendasi' && <RecommendationTab />}
                    {activeTab === 'riwayat' && <HistoryTab />}
                </div>
            </div>
        </div>
    );
};

const SearchTopic = () => {
    const { setTopic, setScreen } = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState('');
    const handleSearch = () => { if (searchTerm.trim()) { setTopic(searchTerm); setScreen('lesson'); } };
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Mau belajar apa hari ini?</h2>
            <div className="flex">
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder="Cari topik spesifik..." className="w-full p-3 border-2 border-gray-200 rounded-l-lg"/>
                <button onClick={handleSearch} className="p-3 bg-blue-500 text-white rounded-r-lg font-semibold">Cari</button>
            </div>
        </div>
    );
};

const RecommendationTab = () => {
    const { level, track, subject, setTopic, setScreen } = useContext(AppContext);
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        setIsLoading(true);
        const prompt = `Berdasarkan Kurikulum Merdeka, buatkan 5 rekomendasi topik utama untuk mata pelajaran "${subject.name}" bagi siswa ${level} ${track ? `jurusan ${track}` : ''}. Jawab dalam format JSON array string.`;
        callGeminiAPI(prompt, true)
            .then(responseText => setTopics(JSON.parse(responseText)))
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [level, track, subject.name]);
    const openLesson = (topicStr) => { setTopic(topicStr); setScreen('lesson'); };
    if (isLoading) return <div className="text-center p-8"><Loader className="mx-auto animate-spin text-blue-500"/></div>;
    return <div className="space-y-3">{topics.map((topic, i) => <ListItem key={i} text={topic} onClick={() => openLesson(topic)} />)}</div>;
};
const HistoryTab = () => {
    const { level, track, subject, history, setTopic, setScreen } = useContext(AppContext);
    const filteredHistory = history.filter(h => h.subject === subject.name && h.level === level && h.track === track);
    const openLesson = (topicStr) => { setTopic(topicStr); setScreen('lesson'); };
    if (filteredHistory.length === 0) return <p className="text-center p-5 text-gray-500">Belum ada riwayat belajar.</p>;
    return <div className="space-y-3">{filteredHistory.map((h, i) => <ListItem key={i} text={h.topic} onClick={() => openLesson(h.topic)} />)}</div>;
};
const LessonScreen = () => {
    const { topic, level, track, subject, setScreen, setLessonContent, updateHistory, setError } = useContext(AppContext);
    const [content, setContent] = useState({ text: null, imageUrl: null, video: null });
    const [isChatOpen, setChatOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const stableUpdateHistory = useCallback(updateHistory, []);
    const stableSetLessonContent = useCallback(setLessonContent, []);
    const stableSetError = useCallback(setError, []);

    useEffect(() => {
        if(!topic) { setScreen('subjectDashboard'); return; }
        let isMounted = true;
        const fetchContent = async () => {
            if(!isMounted) return;
            setIsLoading(true);
            stableUpdateHistory({ level, track, subject: subject.name, topic, date: new Date().toISOString() });
            const fullContext = `${subject.name} untuk siswa ${level} ${track ? `jurusan ${track}` : ''}`;
            const textPrompt = `Sebagai guru ahli, buatkan materi lengkap tentang "${topic}" (${fullContext}) sesuai Kurikulum Merdeka. Gunakan format Markdown (heading, list, bold). Untuk RUMUS MATEMATIKA, WAJIB gunakan delimiter $$...$$ (contoh: $$L = \\pi r^2$$).`;
            const imagePrompt = `Educational illustration, simple colorful flat design style, topic: "${topic}" for ${fullContext}.`;
            const videoPrompt = `Cari satu video YouTube berbahasa Indonesia paling relevan untuk menjelaskan "${topic}" (${fullContext}). Jawab HANYA dalam format JSON dengan key "title" dan "youtubeId".`;
            try {
                const results = await Promise.allSettled([ callGeminiAPI(textPrompt), callDeepImgAPI(imagePrompt), callGeminiAPI(videoPrompt, true) ]);
                if(!isMounted) return;
                const lessonText = results[0].status === 'fulfilled' ? results[0].value : 'Gagal memuat materi teks.';
                const imageUrl = results[1].status === 'fulfilled' ? results[1].value : null;
                const videoJson = results[2].status === 'fulfilled' ? JSON.parse(results[2].value) : null;
                setContent({ text: lessonText, imageUrl, video: videoJson });
                stableSetLessonContent(lessonText);
            } catch (err) { stableSetError('Gagal memuat sebagian konten.'); } 
            finally { if(isMounted) setIsLoading(false); }
        };
        fetchContent();
        return () => { isMounted = false; };
    }, [topic, level, track, subject, stableSetLessonContent, stableUpdateHistory, stableSetError, setScreen]);

    return (
        <div className="relative min-h-screen">
            <div className="p-4 max-w-3xl mx-auto pb-24">
                <Header onBack={() => setScreen('subjectDashboard')} title={topic} />
                {isLoading ? <div className="bg-white rounded-2xl shadow-lg p-10 text-center"><Loader className="mx-auto animate-spin text-blue-500" size={48} /><p className="mt-4 font-semibold">Membuat materi lengkap...</p></div> : 
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <img src={content.imageUrl || `https://placehold.co/1200x600/e2e8f0/4a5568?text=Ilustrasi+Gagal+Dimuat`} alt={`Ilustrasi untuk ${topic}`} className="w-full h-48 md:h-64 object-cover bg-gray-200"/>
                    <div className="p-6">
                        <ContentRenderer text={content.text} />
                        {content.video && content.video.youtubeId && (<div className="mt-8"><h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><Youtube className="text-red-500 mr-2"/> Video Pembelajaran</h2><div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden shadow-lg"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${content.video.youtubeId}`} title={content.video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div></div>)}
                        <button onClick={() => setScreen('quiz')} className="mt-8 w-full p-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"> Uji Pemahaman </button>
                    </div>
                </div>}
            </div>
            <button onClick={() => setChatOpen(true)} className="fixed bottom-6 right-6 p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700"> <MessageSquarePlus /> </button>
            {isChatOpen && <ChatModal topic={topic} subject={subject.name} onClose={() => setChatOpen(false)} />}
        </div>
    );
};
const QuizPlayerScreen = () => {
    const { lessonContent, level, track, setScreen, setError } = useContext(AppContext);
    const [quiz, setQuiz] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if(!lessonContent) { setError("Konten materi tidak ditemukan untuk membuat kuis."); setScreen('subjectDashboard'); return; }
        setIsLoading(true);
        const prompt = `Buat 4 pertanyaan kuis pilihan ganda (A, B, C, D) dari materi ini, target siswa ${level} ${track||''}: "${lessonContent.substring(0,6000)}". Kembalikan dalam format JSON array. Objek: "question", "options" (array), dan "correctAnswer".`;
        callGeminiAPI(prompt, true)
            .then(quizText => setQuiz(JSON.parse(quizText)))
            .catch(() => setError('Gagal membuat kuis.'))
            .finally(() => setIsLoading(false));
    }, [lessonContent, level, track, setError, setScreen]);
    const score = quiz.reduce((acc, q, i) => acc + (userAnswers[i] === q.correctAnswer ? 1 : 0), 0);
    const scorePercentage = quiz.length > 0 ? Math.round(score/quiz.length * 100) : 0;
    if (isLoading) return <div className="p-4 max-w-2xl mx-auto"><Header onBack={() => setScreen('lesson')} title="Uji Pemahaman" /><div className="bg-white rounded-2xl shadow-lg p-10 text-center"><Loader className="mx-auto animate-spin text-blue-500" size={48} /><p className="mt-4 font-semibold">Membuat soal kuis...</p></div></div>;
    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Header onBack={() => setScreen('lesson')} title="Uji Pemahaman" />
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                {isSubmitted && <div className="text-center p-4 rounded-lg bg-blue-50"><h2 className="text-2xl font-bold">Skor Kamu</h2><p className="text-5xl font-bold text-blue-600 my-2">{scorePercentage}</p><p className="text-gray-600">Kamu benar {score} dari {quiz.length} pertanyaan.</p></div>}
                {quiz.map((q, qIndex) => (
                    <div key={qIndex}>
                        <p className="font-semibold text-gray-800 mb-3">{qIndex + 1}. {q.question}</p>
                        <div className="space-y-2">
                            {q.options.map((opt) => {
                                const isSelected = userAnswers[qIndex] === opt;
                                let c = 'bg-white hover:bg-gray-50 border-gray-200';
                                if(isSubmitted){ if(opt===q.correctAnswer) c='bg-green-100 border-green-500 text-green-800 font-bold'; else if(isSelected) c='bg-red-100 border-red-500 text-red-800';} 
                                else if(isSelected) c='bg-blue-100 border-blue-500';
                                return (<button key={opt} onClick={()=>!isSubmitted && setUserAnswers(p=>({...p,[qIndex]:opt}))} className={`w-full text-left p-3 rounded-lg border-2 transition ${c}`}> {opt} </button>);
                            })}
                        </div>
                    </div>
                ))}
            </div>
            {!isSubmitted && quiz.length > 0 && <button onClick={() => setSubmitted(true)} disabled={Object.keys(userAnswers).length !== quiz.length} className="mt-6 w-full p-4 bg-green-600 text-white font-bold rounded-lg disabled:bg-gray-400">Kumpulkan Jawaban</button>}
            {isSubmitted && <button onClick={() => setScreen('lesson')} className="mt-6 w-full p-4 bg-blue-600 text-white font-bold rounded-lg">Kembali ke Materi</button>}
        </div>
    );
};
const BankSoalGeneratorScreen = () => {
    const { level, track, setScreen, setError, setBankSoalQuestions } = useContext(AppContext);
    const [material, setMaterial] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const handleGenerate = async () => {
        if (!material.trim()) return;
        setIsLoading(true);
        try {
            const prompt = `Buat 5 pertanyaan (campuran esai & pilihan ganda 4 opsi) dari teks materi ini untuk siswa ${level} ${track||''}. Format JSON array, objek punya "question", "type" ("essay" atau "mcq"), jika mcq tambah "options" (array) & "correctAnswer". Materi: "${material.substring(0,6000)}"`;
            const soalText = await callGeminiAPI(prompt, true);
            setBankSoalQuestions(JSON.parse(soalText));
            setScreen('bankSoalPlayer');
        } catch (err) { setError('Gagal membuat soal. Coba materi yang lebih spesifik.'); } 
        finally { setIsLoading(false); }
    };
    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Header onBack={() => setScreen('subjectDashboard')} title="Bank Soal Pribadi" />
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Buat Soal dari Materimu</h2>
                <p className="text-gray-600 mb-4">Tempel materi dari catatanmu di sini, dan AI akan membuatkan soal latihan.</p>
                <textarea value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Contoh: Fotosintesis adalah proses tumbuhan mengubah cahaya matahari menjadi energi..." className="w-full h-64 p-3 border-2 border-gray-200 rounded-lg"/>
                <button onClick={handleGenerate} disabled={isLoading} className="mt-4 w-full p-4 bg-green-600 text-white font-bold rounded-lg flex items-center justify-center disabled:bg-green-300">
                    {isLoading ? <Loader className="animate-spin mr-2"/> : <UploadCloud className="mr-2"/>}
                    {isLoading ? 'Membuat Soal...' : 'Buatkan Soal'}
                </button>
            </div>
        </div>
    );
};
const BankSoalPlayerScreen = () => {
    const { bankSoalQuestions, setScreen } = useContext(AppContext);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setSubmitted] = useState(false);
    if(!bankSoalQuestions || bankSoalQuestions.length === 0) return <div className="p-4"><Header onBack={()=>setScreen('bankSoalGenerator')} title="Error"/><p>Tidak ada soal untuk ditampilkan.</p></div>
    const mcqQuestions = bankSoalQuestions.filter(q => q.type === 'mcq');
    const score = mcqQuestions.reduce((acc, q) => acc + (userAnswers[q.question] === q.correctAnswer ? 1 : 0), 0);
    const scorePercentage = mcqQuestions.length > 0 ? Math.round((score / mcqQuestions.length) * 100) : 0;
    return (
        <div className="p-4 max-w-2xl mx-auto">
            <Header onBack={() => setScreen('bankSoalGenerator')} title="Latihan Soal" />
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                {isSubmitted && <h2 className="text-2xl font-bold text-center">Skor Pilihan Ganda: {scorePercentage}</h2>}
                {bankSoalQuestions.map((q, qIndex) => (
                    <div key={qIndex}>
                        <p className="font-semibold text-gray-800 mb-3">{qIndex + 1}. {q.question}</p>
                        {q.type === 'mcq' ? (
                             <div className="space-y-2">
                                {q.options.map((opt) => {
                                    const isSelected = userAnswers[q.question] === opt;
                                    let c = 'bg-white hover:bg-gray-50 border-gray-200';
                                    if(isSubmitted){ if(opt===q.correctAnswer) c='bg-green-100 border-green-500 font-bold'; else if(isSelected) c='bg-red-100 border-red-500';} 
                                    else if(isSelected) c='bg-blue-100 border-blue-500';
                                    return (<button key={opt} onClick={()=>!isSubmitted && setUserAnswers(p=>({...p, [q.question]:opt}))} className={`w-full text-left p-3 rounded-lg border-2 transition ${c}`}> {opt} </button>);
                                })}
                            </div>
                        ) : ( <textarea placeholder="Ketik jawaban esaimu..." disabled={isSubmitted} className="w-full p-2 border-2 rounded-lg mt-2"/> )}
                        {isSubmitted && q.type === 'essay' && <p className="text-sm text-blue-700 italic mt-2">Periksa jawaban esaimu secara mandiri.</p>}
                    </div>
                ))}
            </div>
            {!isSubmitted && <button onClick={() => setSubmitted(true)} className="mt-6 w-full p-4 bg-green-600 text-white font-bold rounded-lg">Kumpulkan Jawaban</button>}
            {isSubmitted && <button onClick={() => setScreen('bankSoalGenerator')} className="mt-6 w-full p-4 bg-blue-600 text-white font-bold rounded-lg">Buat Soal Lain</button>}
        </div>
    )
}

// --- UTILITY COMPONENTS ---
const LoadingScreen = ({ message }) => (<div className="flex flex-col items-center justify-center min-h-screen bg-white"><Sparkles className="h-24 w-24 text-blue-500 animate-pulse" /><p className="mt-6 text-gray-700 font-semibold text-lg">{message || 'Memuat...'}</p></div>);
const ErrorScreen = ({ message, onRetry }) => (<div className="flex flex-col items-center justify-center min-h-screen p-4 text-center"><X className="h-12 w-12 text-red-500 mx-auto" /><h2 className="mt-4 text-xl font-semibold text-gray-800">Oops, Terjadi Kesalahan!</h2><p className="text-gray-600 mt-2 max-w-sm">{message}</p><button onClick={onRetry} className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg">Kembali</button></div>);
const Header = ({ onBack, title, icon }) => (<div className="flex items-center mb-6"><button onClick={onBack} className="p-2 rounded-full hover:bg-gray-200 mr-4"><ArrowLeft className="h-6 w-6 text-gray-600" /></button>{icon && <div className="mr-3">{icon}</div>}<div><h1 className="text-2xl font-bold text-gray-800">{title}</h1></div></div>);
const TabButton = ({ text, icon, active, onClick }) => (<button onClick={onClick} className={`flex-1 flex items-center justify-center p-3 font-semibold transition-colors ${active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>{React.cloneElement(icon, { className: "mr-2 h-5 w-5"})} {text}</button>);
const ListItem = ({text, onClick}) => (<button onClick={onClick} className="w-full text-left p-4 bg-gray-50 hover:bg-blue-100 rounded-lg transition-colors font-medium text-gray-800 flex justify-between items-center"><span>{text}</span></button>);
const ChatModal = ({ topic, subject, onClose }) => {
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const handleSend = async () => {
        if (!input.trim()) return;
        const newHistory = [...history, { role: 'user', text: input }];
        setHistory(newHistory); setInput(''); setIsLoading(true);
        try {
            const prompt = `Anda "Bdukasi Expert". Jawab pertanyaan ini dalam konteks topik "${topic}" (${subject}). Pertanyaan: "${input}"`;
            const aiResponse = await callGeminiAPI(prompt);
            setHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
        } catch (error) { setHistory(prev => [...prev, { role: 'ai', text: 'Maaf, ada gangguan.' }]);
        } finally { setIsLoading(false); }
    };
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}><div className="bg-white rounded-2xl shadow-xl w-full max-w-lg h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}><header className="p-4 border-b flex justify-between items-center"><h2 className="text-lg font-bold">Tanya Expert: {topic}</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X/></button></header><main className="flex-1 overflow-y-auto p-4 space-y-4">{history.map((msg, i) => (<div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>{msg.role === 'ai' && <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center"><Sparkles className="h-5 w-5 text-purple-600" /></div>}<div className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}><ContentRenderer text={msg.text}/></div></div>))}{isLoading && <div className="flex justify-start"><p>Mengetik...</p></div>}</main><footer className="p-4 border-t"><div className="relative"><input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Tanya tentang topik ini..." className="w-full p-3 pr-14 rounded-xl border-gray-300 border" /><button onClick={handleSend} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-purple-600 text-white"><Sparkles className="h-5 w-5" /></button></div></footer></div></div>)
};
