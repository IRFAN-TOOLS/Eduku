import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { 
    Search, Brain, BookOpen, Youtube, Lightbulb, FileText, ArrowLeft, Loader, Sparkles, 
    AlertTriangle, X, School, FlaskConical, Globe, Calculator, Dna, BarChart2, Drama, 
    Computer, BookHeart, Landmark, Languages, HelpCircle, Atom, CheckCircle, ChevronRight, 
    BrainCircuit, History, BookMarked
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- STYLING & ANIMASI ---
// Objek untuk varian animasi. Ini akan digunakan di seluruh aplikasi.
const motionVariants = {
    screen: {
        initial: { opacity: 0, x: 300 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -300 },
        transition: { type: "spring", stiffness: 260, damping: 20 }
    },
    item: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 }
    },
    button: {
        hover: { scale: 1.05 },
        tap: { scale: 0.95 }
    }
};

// --- KONFIGURASI PENTING ---
const GEMINI_API_KEY = "AIzaSyArJ1P8HanSQ_XVWX9m4kUlsIVXrBRInik";

// --- App Context ---
const AppContext = createContext(null);

// --- Custom Hook untuk LocalStorage ---
function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };
    return [storedValue, setValue];
}


// --- Data Kurikulum & Ikon ---
const curriculum = {
  'SD': { subjects: [{ name: 'Matematika', iconName: 'Calculator' }, { name: 'IPA', iconName: 'Atom' }, { name: 'IPS', iconName: 'Globe' }, { name: 'Bahasa Indonesia', iconName: 'BookHeart' }] },
  'SMP': { subjects: [{ name: 'Matematika', iconName: 'Calculator' }, { name: 'IPA Terpadu', iconName: 'FlaskConical' }, { name: 'IPS Terpadu', iconName: 'Globe' }, { name: 'Bahasa Inggris', iconName: 'Languages' }, { name: 'Informatika', iconName: 'Computer' }] },
  'SMA': { tracks: { 'IPA': [{ name: 'Matematika Peminatan', iconName: 'Calculator' }, { name: 'Fisika', iconName: 'Atom' }, { name: 'Kimia', iconName: 'FlaskConical' }, { name: 'Biologi', iconName: 'Dna' }], 'IPS': [{ name: 'Ekonomi', iconName: 'BarChart2' }, { name: 'Geografi', iconName: 'Globe' }, { name: 'Sosiologi', iconName: 'School' }], 'Bahasa': [{ name: 'Sastra Indonesia', iconName: 'BookHeart' }, { name: 'Sastra Inggris', iconName: 'Drama' }, { name: 'Antropologi', iconName: 'Globe' }, { name: 'Bahasa Asing', iconName: 'Languages' }] } }
};
const iconMap = { School, Brain, BookOpen, Youtube, Lightbulb, FileText, ArrowLeft, Loader, Sparkles, AlertTriangle, X, FlaskConical, Globe, Calculator, Dna, BarChart2, Drama, Computer, BookHeart, Landmark, Languages, HelpCircle, Atom, CheckCircle, ChevronRight, BrainCircuit, History, BookMarked };

// --- API Helper ---
const callGeminiAPI = async (prompt, isJson = true) => {
    if (!GEMINI_API_KEY) throw new Error("Kunci API Gemini belum diatur.");
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    if (isJson) payload.generationConfig = { response_mime_type: "application/json" };
    const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Permintaan API gagal: ${errorBody.error?.message || 'Error tidak diketahui'}`);
    }
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Respons API tidak valid.");
    return isJson ? JSON.parse(text) : text;
};

// --- App Provider ---
const AppProvider = ({ children }) => {
    const [screen, setScreen] = useState('levelSelection');
    const [level, setLevel] = useState('');
    const [track, setTrack] = useState('');
    const [subject, setSubject] = useState(null);
    const [learningData, setLearningData] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [bankSoal, setBankSoal] = useState([]);
    const [history, setHistory] = useLocalStorage('sinau-ai-history-v2', []);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState(null);

    const contextValue = useMemo(() => ({ level, track, subject }), [level, track, subject]);
    
    const addHistory = (item) => {
        setHistory(prev => [item, ...prev.filter(h => h.topic !== item.topic)].slice(0, 50));
    };

    const fetchLearningMaterial = useCallback(async (searchTopic, isFromHistory = false) => {
        if (!searchTopic || !contextValue.level || !contextValue.subject) return;
        setIsLoading(true); setLoadingMessage('AI sedang menyusun materi lengkap...'); setError(null);
        setLearningData(null); setScreen('lesson');

        const { level, track, subject } = contextValue;
        if (!isFromHistory) {
             addHistory({ topic: searchTopic, level, track, subjectName: subject.name, date: new Date().toISOString() });
        }

        const prompt = `
            Sebagai AI Tutor ahli Kurikulum Merdeka, buatkan paket materi pembelajaran untuk permintaan: "Carikan saya materi tentang '${searchTopic}' untuk siswa ${level} ${track ? `jurusan ${track}`: ''} mata pelajaran '${subject.name}', beserta video YouTube, dan latihan soal."
            Anda HARUS mengembalikan respons HANYA dalam format JSON yang valid.
            Struktur JSON:
            { "topic": "${searchTopic}", "summary": "Rangkuman singkat (2-3 paragraf).", "main_material": "Materi utama mendetail dalam format Markdown.", "key_terms": [{"term": "Istilah 1", "definition": "Definisi 1"}], "youtube_video": {"title": "Judul video YouTube relevan (B. Indonesia).", "youtubeId": "Ekstrak HANYA ID video."}, "practice_questions": [{"question": "Pertanyaan 1?", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "Penjelasan singkat."}] }
        `;
        
        try {
            const data = await callGeminiAPI(prompt);
            setLearningData(data);
        } catch (err) {
            setError(err.message); setScreen('subjectDashboard');
        } finally {
            setIsLoading(false);
        }
    }, [contextValue, addHistory]);

    const fetchRecommendations = useCallback(async () => {
        if (!contextValue.level || !contextValue.subject) return;
        const { level, track, subject } = contextValue;
        const prompt = `Berikan 5 rekomendasi topik belajar untuk mata pelajaran "${subject.name}" (${level} ${track}). Jawab HANYA dalam format JSON array string. Contoh: ["Topik 1", "Topik 2"]`;
        try {
            setRecommendations(await callGeminiAPI(prompt) || []);
        } catch (err) {
            console.error("Gagal mengambil rekomendasi:", err); setRecommendations([]);
        }
    }, [contextValue]);
    
    const fetchBankSoal = useCallback(async () => {
        if (!contextValue.level || !contextValue.subject) return;
        setIsLoading(true); setLoadingMessage('AI sedang mempersiapkan Bank Soal...'); setError(null);
        const { level, track, subject } = contextValue;
        const prompt = `Buat 10 pertanyaan pilihan ganda (A, B, C, D) dari berbagai topik di mapel "${subject.name}" untuk siswa ${level} ${track}. Sertakan jawaban dan penjelasan. Jawab HANYA dalam format JSON array dari objek: [{"question": "...", "options": [...], "correctAnswer": "...", "explanation": "..."}, ...]`;
        try {
            setBankSoal(await callGeminiAPI(prompt) || []); setScreen('bankSoal');
        } catch(err) { setError(err.message);
        } finally { setIsLoading(false); }
    }, [contextValue]);

    const value = { screen, setScreen, level, setLevel, track, setTrack, subject, setSubject, learningData, recommendations, fetchRecommendations, bankSoal, fetchBankSoal, isLoading, loadingMessage, error, setError, history, addHistory, fetchLearningMaterial };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// --- Komponen Utama & Layout ---
export default function App() {
    return (
        <AppProvider>
            <div className="bg-gray-900 min-h-screen text-gray-200 font-sans overflow-hidden relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                <ScreenContainer />
            </div>
        </AppProvider>
    );
}

const ScreenContainer = () => {
    const { screen, isLoading, loadingMessage } = useContext(AppContext);
    
    if (isLoading) return <LoadingSpinner message={loadingMessage} />;

    return (
        <div className="relative h-full">
            {screen === 'levelSelection' && <LevelSelectionScreen key="level" />}
            {screen === 'trackSelection' && <TrackSelectionScreen key="track" />}
            {screen === 'subjectSelection' && <SubjectSelectionScreen key="subject" />}
            {screen === 'subjectDashboard' && <SubjectDashboardScreen key="dashboard" />}
            {screen === 'lesson' && <LearningMaterialScreen key="lesson" />}
            {screen === 'bankSoal' && <BankSoalScreen key="bankSoal" />}
        </div>
    );
};

// --- Komponen UI Pendukung ---
const DynamicIcon = ({ name, ...props }) => {
    const IconComponent = iconMap[name];
    if (!IconComponent) return <HelpCircle {...props} />;
    return <IconComponent {...props} />;
};

const AnimatedScreen = ({ children, customKey }) => (
    <div key={customKey} className="p-4 sm:p-8 max-w-5xl mx-auto" style={{...motionVariants.screen.initial, animation: 'fadeInSlide 0.5s forwards ease-out'}}>
        {children}
    </div>
);
const BackButton = ({ onClick }) => (
     <button onClick={onClick} className="flex items-center gap-2 text-blue-400 font-semibold hover:underline mb-8 absolute top-8 left-8 z-10" style={motionVariants.button}>
        <ArrowLeft size={20} /> Kembali
    </button>
);
const InfoCard = ({ icon, title, children, className = '' }) => (
    <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg overflow-hidden ${className}`} style={{animation: 'fadeInUp 0.5s ease-out forwards'}}>
        <div className="p-4 border-b border-gray-700 flex items-center gap-3">
            {icon && <div className="text-blue-400">{React.cloneElement(icon, { size: 24 })}</div>}
            <h2 className="text-xl font-bold text-gray-100">{title}</h2>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
    </div>
);
const LoadingSpinner = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <Loader className="w-16 h-16 text-blue-500 animate-spin" />
        <p className="text-xl font-semibold mt-6 text-gray-300 text-center">{message || 'Memuat...'}</p>
    </div>
);
const ErrorMessage = ({ message }) => (
    <div className="bg-red-900/50 border-l-4 border-red-500 text-red-300 p-4 rounded-r-lg mt-6 w-full max-w-xl mx-auto flex items-center gap-4">
        <AlertTriangle className="h-6 w-6 text-red-500" /><p className="font-bold">{message}</p>
    </div>
);

// --- Screen Components ---
const LevelSelectionScreen = () => {
    const { setScreen, setLevel } = useContext(AppContext);
    const cardStyle = "p-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg hover:shadow-blue-500/20 hover:border-blue-500 hover:-translate-y-2 transition-all text-2xl font-bold flex flex-col items-center justify-center gap-4 cursor-pointer";

    return (
        <AnimatedScreen customKey="level">
            <div className="text-center pt-16">
                <Sparkles className="w-24 h-24 mx-auto text-blue-400 animate-pulse" />
                <h1 className="text-5xl font-bold mt-4">Selamat Datang di Sinau AI</h1>
                <p className="text-xl text-gray-400 mt-2 mb-12">Pilih jenjang pendidikanmu untuk memulai petualangan belajar.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {Object.keys(curriculum).map((lvl, index) => (
                        <div key={lvl} onClick={() => { setLevel(lvl); setScreen(lvl === 'SMA' ? 'trackSelection' : 'subjectSelection'); }} className={cardStyle} style={{...motionVariants.item.initial, animation: `fadeInUp 0.5s ease-out ${index * 0.1 + 0.3}s forwards`}}>
                            <School size={40} /> {lvl}
                        </div>
                    ))}
                </div>
            </div>
        </AnimatedScreen>
    );
};

const TrackSelectionScreen = () => {
    const { setScreen, setTrack } = useContext(AppContext);
    return (
        <AnimatedScreen customKey="track">
            <BackButton onClick={() => setScreen('levelSelection')} />
            <div className="text-center pt-16">
                <h1 className="text-4xl font-bold mb-12">Pilih Jurusan</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {Object.keys(curriculum.SMA.tracks).map((trackName, index) => (<button key={trackName} onClick={() => { setTrack(trackName); setScreen('subjectSelection'); }} className="p-8 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg hover:shadow-blue-500/20 hover:border-blue-500 hover:-translate-y-2 transition-all text-2xl font-bold" style={{...motionVariants.item.initial, animation: `fadeInUp 0.5s ease-out ${index * 0.1 + 0.3}s forwards`}}>{trackName}</button>))}
                </div>
            </div>
        </AnimatedScreen>
    );
};

const SubjectSelectionScreen = () => {
    const { level, track, setScreen, setSubject } = useContext(AppContext);
    const subjects = level === 'SMA' ? curriculum.SMA.tracks[track] : curriculum[level].subjects;
    const backScreen = level === 'SMA' ? 'trackSelection' : 'levelSelection';

    return (
        <AnimatedScreen customKey="subject">
             <BackButton onClick={() => setScreen(backScreen)} />
            <div className="pt-16">
                 <h1 className="text-4xl font-bold mb-12 text-center">Pilih Mata Pelajaran</h1>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {subjects.map((s, index) => (<button key={s.name} onClick={() => { setSubject(s); setScreen('subjectDashboard'); }} className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl flex flex-col items-center justify-center text-center hover:border-blue-500 hover:-translate-y-1 transition-all aspect-square shadow-lg" style={{...motionVariants.item.initial, animation: `fadeInUp 0.5s ease-out ${index * 0.05 + 0.3}s forwards`}}>
                        <DynamicIcon name={s.iconName} size={48} className="text-blue-400" /><span className="font-semibold text-gray-200 text-sm text-center mt-3">{s.name}</span></button>))}
                </div>
            </div>
        </AnimatedScreen>
    );
};

const SubjectDashboardScreen = () => {
    const { subject, fetchLearningMaterial, fetchRecommendations, recommendations, fetchBankSoal, error, setError, history } = useContext(AppContext);
    const [inputValue, setInputValue] = useState('');
    const [activeTab, setActiveTab] = useState('rekomendasi');

    useEffect(() => {
        if (subject && recommendations.length === 0) fetchRecommendations();
    }, [subject, fetchRecommendations, recommendations.length]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) { setError("Topik tidak boleh kosong."); return; }
        setError(null); fetchLearningMaterial(inputValue);
    };

    const handleHistoryClick = (item) => {
        fetchLearningMaterial(item.topic, true);
    }
    
    if (!subject) return <div>Pilih mata pelajaran.</div>;

    const filteredHistory = history.filter(h => h.subjectName === subject.name);

    return (
        <AnimatedScreen customKey="dashboard">
            <BackButton onClick={() => setScreen('subjectSelection')} />
            <div className="text-center pt-16">
                <DynamicIcon name={subject.iconName} size={80} className="text-blue-400 mx-auto mb-4" />
                <h1 className="text-5xl font-bold">Mata Pelajaran: {subject.name}</h1>
            </div>
            
            <div className="w-full max-w-2xl mx-auto my-12">
                <form onSubmit={handleSearch}>
                    <div className="relative"><input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ketik topik untuk dipelajari..." className="w-full pl-6 pr-16 py-4 text-lg bg-gray-700 border-2 border-gray-600 rounded-full focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"/><button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-transform active:scale-95"><Search className="w-6 h-6" /></button></div>
                    {error && <ErrorMessage message={error} />}
                </form>
            </div>

            <div className="max-w-4xl mx-auto">
                 <div className="flex justify-center border-b border-gray-700 mb-6">
                    <TabButton icon={<Sparkles/>} text="Rekomendasi" isActive={activeTab==='rekomendasi'} onClick={()=>setActiveTab('rekomendasi')}/>
                    <TabButton icon={<History/>} text="Riwayat" isActive={activeTab==='riwayat'} onClick={()=>setActiveTab('riwayat')}/>
                    <TabButton icon={<BrainCircuit/>} text="Bank Soal" isActive={activeTab==='bank_soal'} onClick={fetchBankSoal}/>
                </div>
                <div>
                    {activeTab === 'rekomendasi' && (recommendations.length > 0 ? <div className="grid md:grid-cols-2 gap-4">{recommendations.map((rec,i)=>(<ListItem key={i} text={rec} onClick={()=>fetchLearningMaterial(rec)}/>))}</div> : <p className="text-center text-gray-500">Tidak ada rekomendasi.</p>)}
                    {activeTab === 'riwayat' && (filteredHistory.length > 0 ? <div className="grid md:grid-cols-2 gap-4">{filteredHistory.map((h,i)=>(<ListItem key={i} text={h.topic} onClick={()=>handleHistoryClick(h)}/>))}</div> : <p className="text-center text-gray-500">Belum ada riwayat belajar.</p>)}
                </div>
            </div>
        </AnimatedScreen>
    );
};

const TabButton = ({icon, text, isActive, onClick}) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-all ${isActive ? 'text-blue-400 border-blue-400' : 'text-gray-500 border-transparent hover:text-blue-400'}`}>
        {React.cloneElement(icon, {size: 20})} {text}
    </button>
);

const ListItem = ({text, onClick}) => (
    <button onClick={onClick} className="w-full text-left flex justify-between items-center p-4 bg-gray-800/50 border border-gray-700 hover:border-blue-500 rounded-lg transition-all" style={motionVariants.button}>
        <span className="font-semibold">{text}</span><ChevronRight />
    </button>
);


const LearningMaterialScreen = () => {
    const { learningData, setScreen } = useContext(AppContext);
    if (!learningData) return <div className="text-center">Materi tidak ditemukan. <button onClick={() => setScreen('subjectDashboard')} className="text-blue-500">Kembali</button></div>;
    const { topic, summary, main_material, key_terms, youtube_video, practice_questions } = learningData;

    return (
        <AnimatedScreen customKey="lesson">
            <BackButton onClick={() => setScreen('subjectDashboard')} />
            <div className="space-y-8 pt-16">
                <h1 className="text-5xl font-bold text-center">{topic}</h1>
                <InfoCard icon={<Lightbulb />} title="Rangkuman"><p className="text-gray-400">{summary}</p></InfoCard>
                <InfoCard icon={<BookOpen />} title="Materi Utama"><div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-li:text-gray-300"><ReactMarkdown>{main_material}</ReactMarkdown></div></InfoCard>
                {youtube_video?.youtubeId && <InfoCard icon={<Youtube />} title="Video Pembelajaran"><div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden shadow-lg"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${youtube_video.youtubeId}`} title={youtube_video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div></InfoCard>}
                {key_terms?.length > 0 && <InfoCard icon={<FileText />} title="Istilah Penting"><dl className="space-y-4">{key_terms.map((item, index) => (<div key={index}><dt className="font-semibold text-white">{item.term}</dt><dd className="ml-4 text-gray-400">{item.definition}</dd></div>))}</dl></InfoCard>}
                {practice_questions?.length > 0 && <InfoCard icon={<BookMarked />} title="Latihan Pemahaman"><QuizPlayer questions={practice_questions} /></InfoCard>}
            </div>
        </AnimatedScreen>
    );
};

const BankSoalScreen = () => {
    const { bankSoal, setScreen } = useContext(AppContext);
    return (
        <AnimatedScreen customKey="bankSoal">
            <BackButton onClick={() => setScreen('subjectDashboard')} />
            <div className="pt-16">
                <InfoCard title="Bank Soal Latihan">
                    {bankSoal.length > 0 ? <QuizPlayer questions={bankSoal} /> : <p>Gagal memuat soal.</p>}
                </InfoCard>
            </div>
        </AnimatedScreen>
    );
};

// --- Komponen Interaktif: QuizPlayer ---
const QuizPlayer = ({ questions }) => {
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setSubmitted] = useState(false);
    const score = useMemo(() => questions.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0), 0), [answers, questions]);

    return (
        <div className="space-y-8">
            {isSubmitted && (<div className="text-center p-4 rounded-lg bg-blue-900/50"><h3 className="text-2xl font-bold">Skor Kamu: {Math.round((score / questions.length) * 100)}%</h3><p>Benar {score} dari {questions.length} pertanyaan.</p></div>)}
            {questions.map((q, qIndex) => (
                <div key={qIndex}>
                    <p className="font-semibold text-lg mb-3">{qIndex + 1}. {q.question}</p>
                    <div className="space-y-2">
                        {q.options.map((opt, oIndex) => {
                            const isSelected = answers[qIndex] === opt;
                            let stateClass = "border-gray-600 hover:border-blue-500 hover:bg-gray-700";
                            if (isSubmitted) {
                                if (opt === q.correctAnswer) stateClass = "bg-green-900/50 border-green-500";
                                else if (isSelected) stateClass = "bg-red-900/50 border-red-500";
                            } else if (isSelected) stateClass = "border-blue-500 bg-blue-900/50";
                            return <button key={oIndex} onClick={() => !isSubmitted && setAnswers(p => ({ ...p, [qIndex]: opt }))} className={`w-full text-left p-3 rounded-lg border-2 transition-all ${stateClass}`}>{opt}</button>
                        })}
                    </div>
                    {isSubmitted && (<div className="mt-3 p-3 bg-gray-700/50 rounded-lg text-sm"><p className="font-bold text-gray-300">Penjelasan:</p><p className="text-gray-400">{q.explanation}</p></div>)}
                </div>
            ))}
            {!isSubmitted ? (<button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length !== questions.length} className="w-full p-4 mt-6 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">Kumpulkan Jawaban</button>) : (<button onClick={() => { setSubmitted(false); setAnswers({}); }} className="w-full p-4 mt-6 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Coba Lagi</button>)}
        </div>
    );
};

// --- Inject CSS for animations ---
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
@keyframes fadeInSlide { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.bg-grid-pattern { background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px); background-size: 2rem 2rem; }
.prose-invert h1, .prose-invert h2, .prose-invert h3, .prose-invert strong { color: #fff; }
`;
document.head.appendChild(styleSheet);
