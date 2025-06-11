import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { 
    Search, Brain, BookOpen, Youtube, Lightbulb, FileText, ArrowLeft, Loader, Sparkles, 
    AlertTriangle, X, School, FlaskConical, Globe, Calculator, Dna, BarChart2, Drama, 
    Computer, BookHeart, Landmark, Languages, HelpCircle, Atom, CheckCircle, ChevronRight, 
    BrainCircuit, History, BookMarked, Github, Instagram, CalendarDays
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- STYLING & ANIMASI ---
const motionVariants = {
    screen: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { type: "spring", stiffness: 300, damping: 30 } },
    item: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring", stiffness: 300, damping: 20 } },
    button: { hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } }, tap: { scale: 0.95 } }
};

// --- KONFIGURASI PENTING ---
const GEMINI_API_KEY = "AIzaSyArJ1P8HanSQ_XVWX9m4kUlsIVXrBRInik";

// --- App Context ---
const AppContext = createContext(null);

// --- Custom Hook untuk LocalStorage ---
function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            console.log(`[LocalStorage] Mengambil data untuk key: ${key}`);
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) { 
            console.error(`[LocalStorage] Gagal mengambil data untuk key: ${key}`, error);
            return initialValue; 
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            console.log(`[LocalStorage] Data untuk key: ${key} berhasil disimpan.`);
        } catch (error) { 
            console.error(`[LocalStorage] Gagal menyimpan data untuk key: ${key}`, error);
        }
    };
    return [storedValue, setValue];
}

// --- Data Kurikulum & Ikon ---
const curriculum = {
  'SD': { subjects: [{ name: 'Matematika', iconName: 'Calculator' }, { name: 'IPAS', iconName: 'Globe' }, { name: 'Pendidikan Pancasila', iconName: 'Landmark' }, { name: 'Bahasa Indonesia', iconName: 'BookHeart' }] },
  'SMP': { subjects: [{ name: 'Matematika', iconName: 'Calculator' }, { name: 'IPA Terpadu', iconName: 'FlaskConical' }, { name: 'IPS Terpadu', iconName: 'Globe' }, { name: 'Pendidikan Pancasila', iconName: 'Landmark'}, { name: 'Bahasa Indonesia', iconName: 'BookHeart' }, { name: 'Bahasa Inggris', iconName: 'Languages' }, { name: 'Informatika', iconName: 'Computer' }] },
  'SMA': { tracks: { 'IPA': [{ name: 'Matematika Peminatan', iconName: 'Calculator' }, { name: 'Fisika', iconName: 'Atom' }, { name: 'Kimia', iconName: 'FlaskConical' }, { name: 'Biologi', iconName: 'Dna' }], 'IPS': [{ name: 'Ekonomi', iconName: 'BarChart2' }, { name: 'Geografi', iconName: 'Globe' }, { name: 'Sosiologi', iconName: 'School' }], 'Bahasa': [{ name: 'Sastra Indonesia', iconName: 'BookHeart' }, { name: 'Sastra Inggris', iconName: 'Drama' }, { name: 'Antropologi', iconName: 'Globe' }, { name: 'Bahasa Asing', iconName: 'Languages' }] } }
};
const iconMap = { School, Brain, BookOpen, Youtube, Lightbulb, FileText, ArrowLeft, Loader, Sparkles, AlertTriangle, X, FlaskConical, Globe, Calculator, Dna, BarChart2, Drama, Computer, BookHeart, Landmark, Languages, HelpCircle, Atom, CheckCircle, ChevronRight, BrainCircuit, History, BookMarked, Github, Instagram, CalendarDays };

// --- API Helper & Utilities ---
const callGeminiAPI = async (prompt, isJson = true) => {
    console.log("[API Call] Memanggil Gemini API...");
    if (!GEMINI_API_KEY) {
        console.error("[API Error] Kunci API Gemini belum diatur.");
        throw new Error("Kunci API Gemini belum diatur.");
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    if (isJson) payload.generationConfig = { response_mime_type: "application/json" };
    
    try {
        const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
            const errorBody = await response.json();
            console.error("[API Error] Respons tidak OK:", errorBody);
            throw new Error(`Permintaan API gagal: ${errorBody.error?.message || 'Error tidak diketahui'}`);
        }
        const result = await response.json();
        console.log("[API Success] Respons diterima dari Gemini.");
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            console.error("[API Error] Respons tidak memiliki konten teks.");
            throw new Error("Respons API tidak valid.");
        }
        return isJson ? JSON.parse(text) : text;
    } catch (error) {
        console.error("[API Exception] Terjadi kesalahan saat memanggil API:", error);
        throw error;
    }
};

const getYouTubeID = (url) => {
    if (!url) return null;
    let ID = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        ID = match[2];
    } else if (url.length === 11) {
        ID = url;
    }
    console.log(`[YouTube] Ekstraksi ID dari URL: "${url}" -> "${ID}"`);
    return ID;
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
    const [history, setHistory] = useLocalStorage('bdukasi-expert-history-v3', []);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ type: null, data: null });

    const contextValue = useMemo(() => ({ level, track, subject }), [level, track, subject]);
    
    const addHistory = useCallback((item) => {
        console.log("[History] Menambahkan ke riwayat:", item);
        setHistory(prev => [item, ...prev.filter(h => h.topic !== item.topic)].slice(0, 50));
    }, [setHistory]);

    const fetchLearningMaterial = useCallback(async (searchTopic, isFromHistory = false) => {
        console.log(`[Fetch Materi] Memulai untuk topik: "${searchTopic}"`);
        if (!searchTopic || !contextValue.level || !contextValue.subject) {
             console.error("[Fetch Materi] Gagal: Konteks tidak lengkap (level/subject).");
             return;
        }
        setIsLoading(true); setLoadingMessage('AI sedang menyusun materi lengkap...'); setError(null);
        setLearningData(null); setScreen('lesson');
        const { level, track, subject } = contextValue;
        if (!isFromHistory) addHistory({ topic: searchTopic, level, track, subjectName: subject.name, date: new Date().toISOString() });
        
        const prompt = `Buatkan materi ringkasan dan lengkap tentang "${searchTopic}" untuk siswa ${level} ${track ? `jurusan ${track}`: ''} mata pelajaran "${subject.name}", sertakan video YouTube url nya dan kode embed serta soal pilihan ganda 5 butir ada jawaban dan penjelasan. PENTING: Untuk penjelasan soal, buatlah penjelasan yang detail, lengkap, namun tetap ringkas dan mudah dipahami. Jawab HANYA dalam format JSON yang valid dengan struktur: {"judul_video": "Judul video...", "url_video": "URL YouTube lengkap...", "ringkasan": "Ringkasan...", "materi_lengkap": "Materi lengkap dalam Markdown...", "latihan_soal": [{"question": "...", "options": ["A", "B", "C", "D", "E"], "correctAnswer": "A", "explanation": "..."}]}`;

        try { 
            const data = await callGeminiAPI(prompt);
            if (data.url_video) {
                data.youtubeId = getYouTubeID(data.url_video);
            }
            setLearningData({ topic: searchTopic, ...data });
            console.log("[Fetch Materi] Sukses, data materi diatur.");
        } catch (err) { 
            console.error("[Fetch Materi] Error:", err);
            setError(err.message); setScreen('subjectDashboard'); 
        } finally { setIsLoading(false); }
    }, [contextValue, addHistory]);

    const fetchRecommendations = useCallback(async () => {
        console.log("[Fetch Rekomendasi] Memulai...");
        if (!contextValue.level || !contextValue.subject) return;
        const { level, track, subject } = contextValue;
        const prompt = `Berikan 5 rekomendasi topik belajar yang relevan untuk mata pelajaran "${subject.name}" bagi siswa ${level} ${track ? `jurusan ${track}`: ''}. Jawab HANYA dalam format JSON array string.`;
        try { 
            const recs = await callGeminiAPI(prompt);
            setRecommendations(Array.isArray(recs) ? recs : []);
            console.log("[Fetch Rekomendasi] Sukses.");
        } catch (err) { 
            console.error("[Fetch Rekomendasi] Error:", err);
            setRecommendations([]);
        }
    }, [contextValue]);
    
    const fetchBankSoal = useCallback(async (topic) => {
        console.log(`[Fetch Bank Soal] Memulai untuk topik: "${topic}"`);
        if (!topic || !contextValue.level || !contextValue.subject) {
            console.error("[Fetch Bank Soal] Gagal: Topik atau konteks tidak lengkap.");
            return;
        }
        setIsLoading(true); setLoadingMessage(`AI sedang membuat Bank Soal untuk topik "${topic}"...`); setError(null);
        const { level, track, subject } = contextValue;
        const prompt = `Buat 5-7 pertanyaan pilihan ganda (A, B, C, D, E) tentang topik "${topic}" dari mapel "${subject.name}" untuk siswa ${level} ${track}. Jawab HANYA dalam format JSON array dari objek: [{"question": "...", "options": [...], "correctAnswer": "...", "explanation": "..."}]`;
        try { 
            const soal = await callGeminiAPI(prompt);
            setBankSoal(Array.isArray(soal) ? soal : []); 
            setScreen('bankSoal');
            console.log("[Fetch Bank Soal] Sukses.");
        } catch(err) { 
            console.error("[Fetch Bank Soal] Error:", err);
            setError(err.message); 
            setScreen('subjectDashboard');
        } finally { setIsLoading(false); }
    }, [contextValue]);

    const fetchStudyPlan = useCallback(async (goal) => {
        console.log(`[Fetch Rencana Belajar] Memulai untuk tujuan: "${goal}"`);
        if (!goal || !contextValue.subject) return;
        setModal({ type: 'loading', data: 'AI sedang membuat Rencana Belajar...' });
        const { subject, level, track } = contextValue;
        const prompt = `Buat rencana belajar mingguan untuk mencapai tujuan: "${goal}" dalam mata pelajaran ${subject.name} untuk siswa ${level} ${track}. Berikan output HANYA dalam format JSON dengan struktur: {"title": "Rencana Belajar: ${goal}", "plan": [{"week": 1, "focus": "Fokus Minggu Ini", "tasks": ["Tugas 1", "Tugas 2"]}]}`;
        try { 
            setModal({ type: 'studyPlan', data: await callGeminiAPI(prompt) });
            console.log("[Fetch Rencana Belajar] Sukses.");
        } catch(err) { 
            console.error("[Fetch Rencana Belajar] Error:", err);
            setModal({ type: 'error', data: err.message });
        }
    }, [contextValue]);

    const value = { screen, setScreen, level, setLevel, track, setTrack, subject, setSubject, learningData, recommendations, fetchRecommendations, bankSoal, fetchBankSoal, isLoading, loadingMessage, error, setError, history, fetchLearningMaterial, modal, setModal, fetchStudyPlan };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// --- Komponen Utama & Layout ---
export default function App() {
    return (
        <AppProvider>
            <div className="bg-gray-900 min-h-screen text-gray-200 font-sans overflow-hidden relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20"></div>
                <ScreenContainer />
                <ModalContainer />
            </div>
        </AppProvider>
    );
}

const ScreenContainer = () => {
    const { screen, isLoading, loadingMessage } = useContext(AppContext);
    if (isLoading) return <LoadingSpinner message={loadingMessage} />;
    const screens = {
        levelSelection: <LevelSelectionScreen key="level" />,
        trackSelection: <TrackSelectionScreen key="track" />,
        subjectSelection: <SubjectSelectionScreen key="subject" />,
        subjectDashboard: <SubjectDashboardScreen key="dashboard" />,
        lesson: <LearningMaterialScreen key="lesson" />,
        bankSoal: <BankSoalScreen key="bankSoal" />,
    };
    return <div className="relative h-full w-full">{screens[screen]}</div>;
};

// --- Komponen UI, Ilustrasi, & Modal ---
const DynamicIcon = ({ name, ...props }) => { const IconComponent = iconMap[name]; return IconComponent ? <IconComponent {...props} /> : <HelpCircle {...props} />; };
const AnimatedScreen = ({ children, customKey }) => <div key={customKey} className="p-4 sm:p-8 max-w-5xl mx-auto" style={{animation: 'screenIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards'}}>{children}</div>;
const BackButton = ({ onClick }) => <button onClick={onClick} className="flex items-center gap-2 text-blue-400 font-semibold hover:underline mb-8 absolute top-8 left-8 z-10" style={motionVariants.button}><ArrowLeft size={20} /> Kembali</button>;
const InfoCard = ({ icon, title, children, className = '' }) => <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg overflow-hidden ${className}`} style={{animation: 'fadeInUp 0.5s ease-out forwards'}}><div className="p-4 border-b border-gray-700 flex items-center gap-3">{icon && <div className="text-blue-400">{React.cloneElement(icon, { size: 24 })}</div>}<h2 className="text-xl font-bold text-gray-100">{title}</h2></div><div className="p-4 sm:p-6">{children}</div></div>;
const LoadingSpinner = ({ message }) => <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900"><Loader className="w-16 h-16 text-blue-500 animate-spin" /><p className="text-xl font-semibold mt-6 text-gray-300 text-center">{message || 'Memuat...'}</p></div>;
const ErrorMessage = ({ message }) => <div className="bg-red-900/50 border-l-4 border-red-500 text-red-300 p-4 rounded-r-lg mt-6 w-full max-w-xl mx-auto flex items-center gap-4"><AlertTriangle className="h-6 w-6 text-red-500" /><p className="font-bold">{message}</p></div>;
const Illustration = ({ className }) => <div className={`absolute -bottom-12 -right-12 w-64 h-64 opacity-10 ${className}`}><svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path fill="#2563EB" d="M47.8,-70.7C61.4,-62.4,71.5,-48,77.4,-32.4C83.3,-16.8,85,0.2,80.1,15.1C75.2,30,63.7,42.8,51,52.3C38.3,61.8,24.3,68.1,9.8,70.5C-4.7,73,-19.8,71.7,-33.8,66.2C-47.8,60.7,-60.6,51,-68.8,38.5C-77,26,-80.6,10.7,-79.9,-4.6C-79.2,-19.9,-74.3,-35.1,-64.7,-46.8C-55.2,-58.5,-41,-66.7,-26.9,-72C-12.8,-77.3,-6.4,-79.8,2.7,-82.2C11.8,-84.7,23.6,-87.3,34.1,-82.8C44.6,-78.3,54.2,-66.8,47.8,-70.7Z" transform="translate(100 100) scale(1.2)" /></svg></div>;

const ModalContainer = () => {
    const { modal, setModal } = useContext(AppContext);
    if (!modal.type) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModal({ type: null, data: null })}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()} style={{animation: 'fadeInUp 0.3s ease-out forwards'}}>
                {modal.type === 'loading' && <div className="p-8 flex flex-col items-center gap-4"><Loader className="animate-spin" size={48} /><span>{modal.data}</span></div>}
                {modal.type === 'error' && <div className="p-8"><ErrorMessage message={modal.data} /></div>}
                {modal.type === 'studyPlan' && (
                    <div className="p-6">
                        <h3 className="text-2xl font-bold mb-4">{modal.data?.title || "Rencana Belajar"}</h3>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">{modal.data.plan?.map((week, i) => (<div key={i}><h4 className="font-bold text-lg text-blue-400">Minggu {week.week}: {week.focus}</h4><ul className="list-disc list-inside text-gray-300 mt-1">{week.tasks.map((task, j) => <li key={j}>{task}</li>)}</ul></div>))}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Screen Components ---
const LevelSelectionScreen = () => {
    const { setScreen, setLevel } = useContext(AppContext);
    return (
        <AnimatedScreen customKey="level">
            <div className="flex flex-col min-h-screen justify-center">
                <div className="text-center pt-16 relative">
                    <Illustration className="!w-96 !h-96 -top-24 -left-24" />
                    <Brain className="w-24 h-24 mx-auto text-blue-400 animate-pulse" />
                    <h1 className="text-5xl font-bold mt-4 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Bdukasi Expert</h1>
                    <p className="text-xl text-gray-400 mt-2 mb-12">Pilih jenjang pendidikanmu untuk memulai petualangan belajar.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {Object.keys(curriculum).map((lvl, index) => <button key={lvl} onClick={() => { setLevel(lvl); setScreen(lvl === 'SMA' ? 'trackSelection' : 'subjectSelection'); }} className="p-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg hover:shadow-blue-500/20 hover:border-blue-500 hover:-translate-y-2 transition-all text-2xl font-bold flex flex-col items-center justify-center gap-4 cursor-pointer" style={{...motionVariants.item, animation: `fadeInUp 0.5s ease-out ${index * 0.1 + 0.3}s forwards`}}><School size={40} /> {lvl}</button>)}
                    </div>
                </div>
                <div className="mt-auto"><Footer/></div>
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
                    {Object.keys(curriculum.SMA.tracks).map((trackName, index) => <button key={trackName} onClick={() => { setTrack(trackName); setScreen('subjectSelection'); }} className="p-8 bg-gray-800/50 border border-gray-700 rounded-2xl shadow-lg hover:shadow-blue-500/20 hover:border-blue-500 hover:-translate-y-2 transition-all text-2xl font-bold" style={{...motionVariants.item, animation: `fadeInUp 0.5s ease-out ${index * 0.1 + 0.3}s forwards`}}>{trackName}</button>)}
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
                    {subjects.map((s, index) => <button key={s.name} onClick={() => { setSubject(s); setScreen('subjectDashboard'); }} className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl flex flex-col items-center justify-center text-center hover:border-blue-500 hover:-translate-y-1 transition-all aspect-square shadow-lg" style={{...motionVariants.item, animation: `fadeInUp 0.5s ease-out ${index * 0.05 + 0.3}s forwards`}}><DynamicIcon name={s.iconName} size={48} className="text-blue-400" /><span className="font-semibold text-gray-200 text-sm text-center mt-3">{s.name}</span></button>)}
                </div>
            </div>
        </AnimatedScreen>
    );
};

const SubjectDashboardScreen = () => {
    const { subject, fetchLearningMaterial, fetchRecommendations, recommendations, error, setError, history, setScreen } = useContext(AppContext);
    const [inputValue, setInputValue] = useState('');
    const [activeTab, setActiveTab] = useState('rekomendasi');

    useEffect(() => { if (subject && recommendations.length === 0) fetchRecommendations(); }, [subject, fetchRecommendations, recommendations.length]);

    if (!subject) return <div>Pilih mata pelajaran.</div>;

    const filteredHistory = history.filter(h => h.subjectName === subject.name);

    return (
        <AnimatedScreen customKey="dashboard">
            <BackButton onClick={() => setScreen('subjectSelection')} />
            <div className="text-center pt-16"><DynamicIcon name={subject.iconName} size={80} className="text-blue-400 mx-auto mb-4" /><h1 className="text-5xl font-bold">Mata Pelajaran: {subject.name}</h1></div>
            <div className="w-full max-w-2xl mx-auto my-12"><form onSubmit={(e) => { e.preventDefault(); if(inputValue.trim()) { setError(null); fetchLearningMaterial(inputValue); } else { setError("Topik tidak boleh kosong.")} }}><div className="relative"><input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ketik topik untuk dipelajari..." className="w-full pl-6 pr-16 py-4 text-lg bg-gray-700 border-2 border-gray-600 rounded-full focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"/><button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-transform active:scale-95"><Search className="w-6 h-6" /></button></div>{error && <ErrorMessage message={error} />}</form></div>
            <div className="max-w-4xl mx-auto"><div className="flex justify-center border-b border-gray-700 mb-6">{['rekomendasi', 'riwayat', 'bank_soal', 'rencana'].map(tab => <TabButton key={tab} icon={{rekomendasi: <Sparkles/>, riwayat: <History/>, bank_soal: <BrainCircuit/>, rencana: <CalendarDays/>}[tab]} text={{rekomendasi: "Rekomendasi", riwayat: "Riwayat", bank_soal: "Bank Soal", rencana: "Rencana Belajar"}[tab]} isActive={activeTab===tab} onClick={() => setActiveTab(tab)}/>)}</div>
                <div style={{animation: 'fadeInUp 0.5s ease-out forwards'}}>
                    {activeTab === 'rekomendasi' && (recommendations.length > 0 ? <div className="grid md:grid-cols-2 gap-4">{recommendations.map((rec,i)=>(<ListItem key={i} text={rec} onClick={()=>fetchLearningMaterial(rec)}/>))}</div> : <p className="text-center text-gray-500">Tidak ada rekomendasi.</p>)}
                    {activeTab === 'riwayat' && (filteredHistory.length > 0 ? <div className="grid md:grid-cols-2 gap-4">{filteredHistory.map((h,i)=>(<ListItem key={i} text={h.topic} onClick={()=>fetchLearningMaterial(h.topic, true)}/>))}</div> : <p className="text-center text-gray-500">Belum ada riwayat belajar.</p>)}
                    {activeTab === 'bank_soal' && <BankSoalGenerator />}
                    {activeTab === 'rencana' && <StudyPlanGenerator />}
                </div>
            </div>
             <Footer />
        </AnimatedScreen>
    );
};

const StudyPlanGenerator = () => {
    const { fetchStudyPlan } = useContext(AppContext);
    const [goal, setGoal] = useState('');
    return (
        <div className="max-w-xl mx-auto bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-center mb-4">✨ Buat Rencana Belajar Kustom</h3>
            <p className="text-center text-gray-400 mb-4">Masukkan tujuan belajarmu, dan biarkan AI menyusun jadwal untukmu.</p>
            <form onSubmit={e => {e.preventDefault(); fetchStudyPlan(goal)}}>
                <input type="text" value={goal} onChange={e => setGoal(e.target.value)} placeholder='Contoh: Ujian Akhir Semester 2 minggu lagi' className='w-full p-3 bg-gray-700 rounded-lg border border-gray-600 mb-4' />
                <button type="submit" className="w-full p-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Buatkan Rencana!</button>
            </form>
        </div>
    );
};

const BankSoalGenerator = () => {
    const { fetchBankSoal } = useContext(AppContext);
    const [topic, setTopic] = useState('');
    return (
        <div className="max-w-xl mx-auto bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-center mb-4">🎯 Bank Soal Berbasis Topik</h3>
            <p className="text-center text-gray-400 mb-4">Masukkan topik spesifik untuk dibuatkan soal latihan oleh AI.</p>
            <form onSubmit={e => {e.preventDefault(); fetchBankSoal(topic)}}>
                <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder='Contoh: Perang Diponegoro' className='w-full p-3 bg-gray-700 rounded-lg border border-gray-600 mb-4' />
                <button type="submit" className="w-full p-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700">Buatkan Soal Latihan!</button>
            </form>
        </div>
    );
}

const TabButton = ({icon, text, isActive, onClick}) => <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-all ${isActive ? 'text-blue-400 border-blue-400' : 'text-gray-500 border-transparent hover:text-blue-400'}`}>{React.cloneElement(icon, {size: 20})} {text}</button>;
const ListItem = ({text, onClick}) => <button onClick={onClick} className="w-full text-left flex justify-between items-center p-4 bg-gray-800/50 border border-gray-700 hover:border-blue-500 rounded-lg transition-all" style={motionVariants.button}><span className="font-semibold">{text}</span><ChevronRight /></button>;

const LearningMaterialScreen = () => {
    const { learningData, setScreen } = useContext(AppContext);
    if (!learningData) return <div className="text-center">Materi tidak ditemukan. <button onClick={() => setScreen('subjectDashboard')} className="text-blue-500">Kembali</button></div>;
    const { topic, ringkasan, materi_lengkap, judul_video, youtubeId, latihan_soal } = learningData;

    return (
        <AnimatedScreen customKey="lesson">
            <BackButton onClick={() => setScreen('subjectDashboard')} />
            <div className="space-y-8 pt-16">
                <h1 className="text-5xl font-bold text-center">{topic}</h1>
                {judul_video && youtubeId && <InfoCard icon={<Youtube />} title={judul_video}><div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden shadow-lg"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}`} title={judul_video} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe></div></InfoCard>}
                {ringkasan && <InfoCard icon={<Lightbulb />} title="Ringkasan"><p className="text-gray-400">{ringkasan}</p></InfoCard>}
                {materi_lengkap && <InfoCard icon={<BookOpen />} title="Materi Lengkap"><div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-li:text-gray-300"><ReactMarkdown>{materi_lengkap}</ReactMarkdown></div></InfoCard>}
                {latihan_soal?.length > 0 && <InfoCard icon={<BookMarked />} title="Latihan Soal"><QuizPlayer questions={latihan_soal} /></InfoCard>}
            </div>
             <Footer />
        </AnimatedScreen>
    );
};

const BankSoalScreen = () => {
    const { bankSoal, setScreen } = useContext(AppContext);
    return (
        <AnimatedScreen customKey="bankSoal">
            <BackButton onClick={() => setScreen('subjectDashboard')} />
            <div className="pt-16"><InfoCard title="Bank Soal Latihan">{bankSoal && bankSoal.length > 0 ? <QuizPlayer questions={bankSoal} /> : <p>Gagal memuat soal atau tidak ada soal tersedia.</p>}</InfoCard></div>
            <Footer />
        </AnimatedScreen>
    );
};

// --- Komponen Interaktif: QuizPlayer & Footer ---
const QuizPlayer = ({ questions }) => {
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setSubmitted] = useState(false);
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return <p className="text-gray-400">Soal latihan tidak tersedia.</p>;
    }

    const score = useMemo(() => {
        if (!isSubmitted) return 0;
        return questions.reduce((acc, q, i) => {
            const correctOption = q.options.find(opt => opt.startsWith(q.correctAnswer));
            return acc + (answers[i] === correctOption ? 1 : 0);
        }, 0);
    }, [answers, questions, isSubmitted]);

    return (
        <div className="space-y-8">
            {isSubmitted && <div className="text-center p-4 rounded-lg bg-blue-900/50"><h3 className="text-2xl font-bold">Skor Kamu: {Math.round((score / questions.length) * 100)}%</h3><p>Benar {score} dari {questions.length} pertanyaan.</p></div>}
            {questions.map((q, qIndex) => (
                <div key={qIndex}>
                    <p className="font-semibold text-lg mb-3">{qIndex + 1}. {q.question}</p>
                    <div className="space-y-2">{q.options?.map((opt, oIndex) => {
                        const isSelected = answers[qIndex] === opt;
                        const isCorrect = opt.startsWith(q.correctAnswer);
                        let stateClass = "border-gray-600 hover:border-blue-500 hover:bg-gray-700";
                        if (isSubmitted) {
                            if (isCorrect) stateClass = "bg-green-900/50 border-green-500";
                            else if (isSelected) stateClass = "bg-red-900/50 border-red-500";
                        } else if (isSelected) {
                            stateClass = "border-blue-500 bg-blue-900/50";
                        }
                        return <button key={oIndex} onClick={() => !isSubmitted && setAnswers(p => ({ ...p, [qIndex]: opt }))} className={`w-full text-left p-3 rounded-lg border-2 transition-all ${stateClass}`}>{opt}</button>})}
                    </div>
                    {isSubmitted && q.explanation && <div className="mt-3 p-3 bg-gray-700/50 rounded-lg text-sm"><p className="font-bold text-gray-300">Penjelasan:</p><p className="text-gray-400">{q.explanation}</p></div>}
                </div>
            ))}
            {!isSubmitted ? <button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length !== questions.length} className="w-full p-4 mt-6 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">Kumpulkan Jawaban</button> : <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="w-full p-4 mt-6 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Coba Lagi</button>}
        </div>
    );
};

const Footer = () => (
    <footer className="w-full text-center p-8 mt-16 text-gray-500 text-sm">
        <p className="font-semibold text-lg text-gray-400 mb-2">Sebuah Karya dari</p>
        <p className="text-xl font-bold text-white">M. Irham Andika Putra</p>
        <p>Siswa SMPN 3 Mentok, Bangka Barat</p>
        <p>Owner Bgune - Digital & YouTuber "Pernah Mikir?"</p>
        <div className="flex justify-center gap-4 mt-4">
            <a href="https://www.youtube.com/@pernah_mikir" target="_blank" rel="noopener noreferrer" className="hover:text-white"><Youtube/></a>
            <a href="https://github.com/irhamp" target="_blank" rel="noopener noreferrer" className="hover:text-white"><Github/></a>
            <a href="https://www.instagram.com/irham_putra07" target="_blank" rel="noopener noreferrer" className="hover:text-white"><Instagram/></a>
        </div>
        <p className="mt-6">Dibuat dengan <Sparkles className="inline h-4 w-4 text-yellow-400"/> dan Teknologi AI</p>
    </footer>
);

// --- Inject CSS for animations ---
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `@keyframes screenIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } } @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .bg-grid-pattern { background-image: linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px); background-size: 2rem 2rem; } .prose-invert h1, .prose-invert h2, .prose-invert h3, .prose-invert strong { color: #fff; }`;
document.head.appendChild(styleSheet);
