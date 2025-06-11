import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { 
    School, BrainCircuit, Lightbulb, FileText, ArrowLeft, Loader, Sparkles, 
    History, UploadCloud, Youtube, Check, X, MessageSquarePlus, FlaskConical, Globe, 
    Atom, Calculator, Dna, BarChart2, Drama, Computer, BookHeart, Landmark, Languages, HelpCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// --- PENTING: KUNCI API ANDA ---
// Saya telah menghapus kunci API yang lama. Anda HARUS membuat kunci API baru dari Google Cloud Console.
// Ganti teks placeholder di bawah ini dengan kunci asli Anda.
// Dapatkan dari: https://console.cloud.google.com/apis/credentials
const GEMINI_API_KEY = "AIzaSyArJ1P8HanSQ_XVWX9m4kUlsIVXrBRInik";
const YOUTUBE_API_KEY = "AIzaSyD9Rp-oSegoIDr8q9XlKkqpEL64lB2bQVE";


// --- App Context ---
const AppContext = createContext(null);

// --- Curriculum Data ---
const curriculum = {
  'SD': {
    subjects: [
      { name: 'Matematika', iconName: 'Calculator', color: 'text-blue-500' },
      { name: 'IPA', iconName: 'Atom', color: 'text-green-500' },
      { name: 'IPS', iconName: 'Globe', color: 'text-orange-500' },
      { name: 'PKN', iconName: 'Landmark', color: 'text-yellow-600' },
      { name: 'Bahasa Indonesia', iconName: 'BookHeart', color: 'text-red-500' },
      { name: 'Tanya Segalanya', iconName: 'HelpCircle', color: 'text-purple-500' }
    ]
  },
  'SMP': {
    subjects: [
      { name: 'Matematika', iconName: 'Calculator', color: 'text-blue-500' },
      { name: 'IPA Terpadu', iconName: 'FlaskConical', color: 'text-green-500' },
      { name: 'IPS Terpadu', iconName: 'Globe', color: 'text-orange-500' },
      { name: 'PKN', iconName: 'Landmark', color: 'text-yellow-600' },
      { name: 'Bahasa Indonesia', iconName: 'BookHeart', color: 'text-red-500' },
      { name: 'Bahasa Inggris', iconName: 'Drama', color: 'text-purple-500' },
      { name: 'Informatika', iconName: 'Computer', color: 'text-gray-600' },
      { name: 'Tanya Segalanya', iconName: 'HelpCircle', color: 'text-purple-500' }
    ]
  },
  'SMA': {
    tracks: {
      'IPA': [
        { name: 'Matematika Peminatan', iconName: 'Calculator', color: 'text-blue-500' },
        { name: 'Fisika', iconName: 'Atom', color: 'text-sky-500' },
        { name: 'Kimia', iconName: 'FlaskConical', color: 'text-green-500' },
        { name: 'Biologi', iconName: 'Dna', color: 'text-teal-500' },
        { name: 'PKN', iconName: 'Landmark', color: 'text-yellow-600' },
        { name: 'Tanya Segalanya', iconName: 'HelpCircle', color: 'text-purple-500' }
      ],
      'IPS': [
        { name: 'Ekonomi', iconName: 'BarChart2', color: 'text-indigo-500' },
        { name: 'Geografi', iconName: 'Globe', color: 'text-orange-500' },
        { name: 'Sosiologi', iconName: 'School', color: 'text-rose-500' },
        { name: 'Sejarah', iconName: 'History', color: 'text-amber-700' },
        { name: 'PKN', iconName: 'Landmark', color: 'text-yellow-600' },
        { name: 'Tanya Segalanya', iconName: 'HelpCircle', color: 'text-purple-500' }
      ],
      'Bahasa': [
        { name: 'Sastra Indonesia', iconName: 'BookHeart', color: 'text-red-500' },
        { name: 'Sastra Inggris', iconName: 'Drama', color: 'text-purple-500' },
        { name: 'Antropologi', iconName: 'Globe', color: 'text-orange-500' },
        { name: 'Bahasa Asing Lain', iconName: 'Languages', color: 'text-pink-500' },
        { name: 'PKN', iconName: 'Landmark', color: 'text-yellow-600' },
        { name: 'Tanya Segalanya', iconName: 'HelpCircle', color: 'text-purple-500' }
      ]
    }
  }
};

// --- API Helper Functions ---
const callGeminiAPI = async (prompt, isJson = false) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.startsWith("MASUKKAN")) {
        throw new Error("Kunci API Gemini tidak valid. Mohon ganti di dalam kode.");
    }
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    if (isJson) payload.generationConfig = { responseMimeType: "application/json" };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`Panggilan API Gemini gagal: ${response.status}. Periksa Kunci API Anda dan pastikan API telah diaktifkan di Google Cloud Console.`);
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Respons API Gemini tidak valid. Periksa kembali Kunci API atau permintaan Anda.");
    return text;
};

const callImagenAPI = async (prompt) => {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${GEMINI_API_KEY}`;
    const payload = { instances: [{ prompt: prompt }], parameters: { "sampleCount": 1} };
    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`Panggilan API Imagen gagal: ${response.status}`);
    const result = await response.json();
    if (result.predictions && result.predictions[0]?.bytesBase64Encoded) {
        return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
    }
    throw new Error("API tidak mengembalikan gambar yang valid.");
};

const callYouTubeAPI = async (query) => {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.startsWith("MASUKKAN")) {
        console.warn("Kunci API YouTube tidak valid, pencarian video dilewati.");
        return null;
    }
    const encodedQuery = encodeURIComponent(query + " penjelasan singkat");
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
        console.error("Gagal mengambil data YouTube:", await response.json());
        return null;
    }
    const data = await response.json();
    if (data.items && data.items.length > 0) {
        return { title: data.items[0].snippet.title, youtubeId: data.items[0].id.videoId };
    }
    return null;
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
    const [history, setHistory] = useLocalStorage('bdukasiHistory_v18', []);
    const [error, setError] = useState('');

    const updateHistory = useCallback((newEntry) => {
        setHistory(prev => [newEntry, ...prev.filter(h => h.topic !== newEntry.topic)].slice(0, 50));
    }, [setHistory]);
    
    const handleGlobalError = useCallback((message) => {
        setError(message || "Terjadi kesalahan yang tidak diketahui.");
        setTimeout(() => setError(''), 8000);
    }, []);
    
    const value = useMemo(() => ({
        screen, setScreen, level, setLevel, track, setTrack, subject, setSubject, topic, setTopic, 
        lessonContent, setLessonContent, bankSoalQuestions, setBankSoalQuestions, 
        history, updateHistory, error, setError: handleGlobalError
    }), [screen, level, track, subject, topic, lessonContent, bankSoalQuestions, history, error, updateHistory, handleGlobalError]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- Main App Component ---
export default function App() {
    return <AppProvider><Main /></AppProvider>;
}

const Main = () => {
    const { error, setError } = useContext(AppContext);
    
    return (
        <div className="bg-gray-50 min-h-screen font-sans antialiased">
            <AppScreens />
            {error && (
                 <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-pulse">
                    <X size={24} />
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="font-bold ml-4">TUTUP</button>
                </div>
            )}
        </div>
    );
};

const AppScreens = () => {
    const { screen } = useContext(AppContext);
    switch (screen) {
        case 'levelSelection': return <LevelSelectionScreen />;
        case 'trackSelection': return <TrackSelectionScreen />;
        case 'subjectSelection': return <SubjectSelectionScreen />;
        case 'subjectDashboard': return <SubjectDashboardScreen />;
        case 'lesson': return <LessonScreen />;
        case 'quiz': return <QuizPlayerScreen />;
        case 'bankSoalGenerator': return <BankSoalGeneratorScreen />;
        case 'bankSoalPlayer': return <BankSoalPlayerScreen />;
        case 'generalChat': return <GeneralChatScreen />;
        default: return <LevelSelectionScreen />;
    }
}

// --- Dynamic Icon Component ---
const iconMap = {
    School, BrainCircuit, Lightbulb, FileText, ArrowLeft, Loader, Sparkles, 
    History, UploadCloud, Youtube, Check, X, MessageSquarePlus, FlaskConical, Globe, 
    Atom, Calculator, Dna, BarChart2, Drama, Computer, BookHeart, Landmark, Languages, HelpCircle
};

const DynamicIcon = ({ name, ...props }) => {
    const IconComponent = iconMap[name];
    if (!IconComponent) return <HelpCircle {...props} />;
    return <IconComponent {...props} />;
};

// --- Custom Renderer for Math ---
const ContentRenderer = ({ text }) => {
    if (!text) return <p className="text-gray-500">Materi tidak tersedia.</p>;
    const parts = text.split('$$');
    return (
        <div className="prose prose-lg max-w-none text-gray-800">
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
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <Sparkles className="mx-auto text-blue-600 h-20 w-20" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mt-4 text-center">Bdukasi Expert</h1>
            <p className="text-gray-600 mt-2 mb-8 text-center max-w-md">Pilih jenjang pendidikanmu untuk melanjutkan.</p>
            <div className="w-full max-w-sm space-y-4">
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
            <div className="w-full max-w-sm space-y-4">
                <button onClick={() => { setTrack('IPA'); setScreen('subjectSelection'); }} className="w-full p-5 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg flex items-center justify-center"> <FlaskConical className="mr-3" /> IPA </button>
                <button onClick={() => { setTrack('IPS'); setScreen('subjectSelection'); }} className="w-full p-5 bg-yellow-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg flex items-center justify-center"> <Globe className="mr-3" /> IPS </button>
                <button onClick={() => { setTrack('Bahasa'); setScreen('subjectSelection'); }} className="w-full p-5 bg-rose-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg flex items-center justify-center"> <Languages className="mr-3" /> Bahasa </button>
            </div>
        </div>
    );
};

const SubjectSelectionScreen = () => {
    const { level, track, setScreen, setSubject } = useContext(AppContext);
    const subjects = level === 'SMA' ? curriculum.SMA.tracks[track] : curriculum[level].subjects;
    const backScreen = level === 'SMA' ? 'trackSelection' : 'levelSelection';

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            <Header onBack={() => setScreen(backScreen)} title={`Pelajaran ${level} ${track || ''}`} />
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {subjects.map((s) => (
                        <button 
                            key={s.name} 
                            onClick={() => { setSubject(s); setScreen(s.name === 'Tanya Segalanya' ? 'generalChat' : 'subjectDashboard'); }} 
                            className="p-4 bg-gray-50 hover:bg-blue-100 rounded-xl flex flex-col items-center justify-center text-center transition-transform transform hover:scale-105 aspect-square"
                        >
                            <DynamicIcon name={s.iconName} size={48} className={s.color} />
                            <span className="font-semibold text-gray-700 text-sm sm:text-base text-center mt-3">{s.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SubjectDashboardScreen = () => {
    const { subject, setScreen, setTopic } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('rekomendasi');

    if (!subject) {
        return <LoadingScreen message="Memuat data mata pelajaran..." />;
    }

    const openLesson = (topicStr) => { setTopic(topicStr); setScreen('lesson'); };
    
    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
            <Header 
                onBack={() => setScreen('subjectSelection')} 
                title={subject.name} 
                icon={<DynamicIcon name={subject.iconName} size={32} className={subject.color} />} 
            />
            <SearchTopic onSearch={openLesson} />
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

const SearchTopic = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const handleSearch = () => {
        if (searchTerm.trim()) {
            onSearch(searchTerm);
        }
    };
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Mau belajar apa hari ini?</h2>
            <div className="flex">
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
                    placeholder="Cari topik spesifik..." 
                    className="w-full p-3 border-2 border-gray-200 rounded-l-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <button onClick={handleSearch} className="p-3 bg-blue-500 text-white rounded-r-lg font-semibold hover:bg-blue-600 transition-colors">Cari</button>
            </div>
        </div>
    );
};

const RecommendationTab = () => {
    const { level, track, subject, setTopic, setScreen, setError } = useContext(AppContext);
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const subjectName = subject?.name;

    useEffect(() => {
        if (!subjectName) return;
        setIsLoading(true);
        const prompt = `Berdasarkan Kurikulum Merdeka, buatkan 5 rekomendasi topik utama untuk mata pelajaran "${subjectName}" bagi siswa ${level} ${track ? `jurusan ${track}` : ''}. Jawab dalam format JSON array string. Contoh: ["Topik 1", "Topik 2"]`;
        callGeminiAPI(prompt, true)
            .then(responseText => {
                try {
                    const parsedTopics = JSON.parse(responseText);
                    if (Array.isArray(parsedTopics)) setTopics(parsedTopics);
                    else setTopics([]);
                } catch (e) {
                    console.error("Gagal parse JSON rekomendasi:", e);
                    setTopics([]);
                    setError("Gagal mendapatkan rekomendasi topik.");
                }
            })
            .catch(err => {
                console.error(err);
                setError("Gagal menghubungi server untuk rekomendasi.");
            })
            .finally(() => setIsLoading(false));
    }, [level, track, subjectName, setError, setScreen]);

    if (isLoading) return <div className="text-center p-8"><Loader className="mx-auto animate-spin text-blue-500"/></div>;
    if (topics.length === 0) return <p className="text-center p-5 text-gray-500">Tidak ada rekomendasi topik saat ini.</p>;

    return <div className="space-y-3">{topics.map((topic, i) => <ListItem key={i} text={topic} onClick={() => { setTopic(topic); setScreen('lesson'); }} />)}</div>;
};

const HistoryTab = () => {
    const { level, track, subject, history, setTopic, setScreen } = useContext(AppContext);
    const filteredHistory = history.filter(h => h.subject === subject.name && h.level === level && (h.track === track || !h.track));
    if (filteredHistory.length === 0) return <p className="text-center p-5 text-gray-500">Belum ada riwayat belajar untuk mata pelajaran ini.</p>;
    return <div className="space-y-3">{filteredHistory.map((h, i) => <ListItem key={i} text={h.topic} onClick={() => { setTopic(h.topic); setScreen('lesson'); }} />)}</div>;
};

// --- [PERBAIKAN] Komponen LessonScreen ---
const LessonScreen = () => {
    const { topic, level, track, subject, setScreen, setLessonContent, updateHistory, setError } = useContext(AppContext);
    const [content, setContent] = useState({ text: null, imageUrl: null, video: null });
    const [isChatOpen, setChatOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const subjectName = subject?.name;

    useEffect(() => {
        if (!topic || !subjectName) {
            setScreen('subjectDashboard');
            return;
        }

        let isMounted = true;

        const fetchAllContent = async () => {
            setIsLoading(true);
            updateHistory({ level, track, subject: subjectName, topic, date: new Date().toISOString() });

            const fullContext = `${subjectName} untuk siswa ${level} ${track ? `jurusan ${track}` : ''}`;
            
            const textPrompt = `Sebagai guru ahli, buatkan materi lengkap tentang "${topic}" (${fullContext}) sesuai Kurikulum Merdeka. Gunakan format Markdown, termasuk header, list, bold, dan italic. Untuk rumus matematika, apit dengan '$$' (contoh: $$E=mc^2$$).`;
            const imagePrompt = `Ilustrasi pendidikan, gaya desain datar sederhana berwarna, topik: "${topic}" (${fullContext})`;
            const youtubeQuery = `${topic} ${subjectName}`;

            const promises = [
                callGeminiAPI(textPrompt),
                callImagenAPI(imagePrompt),
                callYouTubeAPI(youtubeQuery)
            ];

            const results = await Promise.allSettled(promises);
            
            if (!isMounted) return;

            // Handle Text Result
            if (results[0].status === 'fulfilled') {
                const lessonText = results[0].value;
                setContent(prev => ({ ...prev, text: lessonText }));
                setLessonContent(lessonText);
            } else {
                console.error("Gagal memuat materi teks:", results[0].reason);
                setError(`Gagal memuat materi: ${results[0].reason.message}`);
                setContent(prev => ({ ...prev, text: "Materi pelajaran tidak dapat dimuat. Pastikan Kunci API Anda valid dan telah diaktifkan." }));
            }
            
            // Handle Image Result
            if (results[1].status === 'fulfilled') {
                setContent(prev => ({ ...prev, imageUrl: results[1].value }));
            } else {
                console.error("Gagal memuat gambar ilustrasi:", results[1].reason);
                // Tidak perlu menampilkan error global untuk gambar, cukup biarkan kosong
            }

            // Handle Video Result
            if (results[2].status === 'fulfilled') {
                setContent(prev => ({ ...prev, video: results[2].value }));
            } else {
                console.error("Gagal memuat video YouTube:", results[2].reason);
            }
            
            setIsLoading(false);
        };

        fetchAllContent();

        return () => { isMounted = false; };
    }, [topic, level, track, subjectName, setLessonContent, updateHistory, setScreen, setError]);

    if (isLoading) return <LoadingScreen message={`Membuat materi lengkap untuk: ${topic}`} />;

    return (
        <div className="relative min-h-screen">
            <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-24">
                <Header onBack={() => setScreen('subjectDashboard')} title={topic} />
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="w-full h-48 md:h-64 bg-gray-200 flex items-center justify-center">
                         {content.imageUrl ? 
                            <img src={content.imageUrl} alt={`Ilustrasi untuk ${topic}`} className="w-full h-full object-cover"/> : 
                            <div className="text-center text-gray-500 p-4">
                                <Lightbulb className="h-8 w-8 mx-auto text-gray-400"/>
                                <p className="mt-2 text-sm">Ilustrasi tidak tersedia</p>
                            </div>
                         }
                    </div>
                    <div className="p-4 sm:p-6">
                        <ContentRenderer text={content.text} />
                        {content.video && content.video.youtubeId && (
                            <div className="mt-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><Youtube className="text-red-500 mr-2"/> Video Pembelajaran</h2>
                                <p className="text-gray-600 mb-4">{content.video.title}</p>
                                <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden shadow-lg">
                                    <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${content.video.youtubeId}`} title={content.video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                </div>
                            </div>
                        )}
                        <button onClick={() => setScreen('quiz')} disabled={!content.text || content.text.startsWith("Materi pelajaran tidak dapat dimuat")} className="mt-8 w-full p-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"> Uji Pemahaman </button>
                    </div>
                </div>
            </div>
            <button onClick={() => setChatOpen(true)} className="fixed bottom-6 right-6 p-4 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-transform hover:scale-110"> <MessageSquarePlus /> </button>
            {isChatOpen && <ChatModal topic={topic} subject={subject.name} onClose={() => setChatOpen(false)} />}
        </div>
    );
};

const QuizPlayerScreen = () => {
    const { lessonContent, level, track, subject, setScreen, setError } = useContext(AppContext);
    const [quiz, setQuiz] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [isSubmitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if(!lessonContent || lessonContent.startsWith("Gagal")) { 
            setError("Konten materi tidak ditemukan untuk membuat kuis."); 
            setScreen('subjectDashboard'); 
            return; 
        }
        setIsLoading(true);
        const prompt = `Buat 4 pertanyaan kuis pilihan ganda (A, B, C, D) dari materi tentang "${subject.name}" ini:\n\n${lessonContent.substring(0,2000)}\n\nPastikan pertanyaan relevan dengan materi. Jawab hanya dalam format JSON array. Setiap elemen array adalah objek dengan properti "question" (string), "options" (array string berisi 4 pilihan), dan "correctAnswer" (string berisi salah satu dari pilihan). Contoh: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A"}]`;
        callGeminiAPI(prompt, true)
            .then(responseText => {
                try {
                    const parsed = JSON.parse(responseText);
                    if (Array.isArray(parsed) && parsed.every(q => q.question && Array.isArray(q.options) && q.correctAnswer)) { setQuiz(parsed); } 
                    else { throw new Error("Format kuis tidak valid dari AI."); }
                } catch (e) {
                    console.error("Gagal parse JSON kuis:", e, responseText);
                    setError('Gagal membuat kuis karena format data salah.'); setQuiz([]);
                }
            })
            .catch((err) => { setError(`Gagal memuat kuis dari server: ${err.message}`); })
            .finally(() => setIsLoading(false));
    }, [lessonContent, level, track, subject.name, setError, setScreen]);

    const score = quiz.reduce((acc, q, i) => acc + (userAnswers[i] === q.correctAnswer ? 1 : 0), 0);
    const scorePercentage = quiz.length > 0 ? Math.round(score/quiz.length * 100) : 0;
    
    if (isLoading) return <LoadingScreen message="Membuat soal kuis..." />;
    
    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
            <Header onBack={() => setScreen('lesson')} title="Uji Pemahaman" />
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                {quiz.length === 0 && !isLoading && (<p className="text-center text-gray-500 p-4">Tidak dapat memuat kuis. Coba kembali ke materi dan ulangi.</p>)}
                {isSubmitted && <div className="text-center p-4 rounded-lg bg-blue-50"><h2 className="text-2xl font-bold">Skor Kamu</h2><p className="text-5xl font-bold text-blue-600 my-2">{scorePercentage}</p><p className="text-gray-600">Kamu benar {score} dari {quiz.length} pertanyaan.</p></div>}
                {quiz.map((q, qIndex) => (
                    <div key={qIndex}>
                        <p className="font-semibold text-gray-800 mb-3">{qIndex + 1}. {q.question}</p>
                        <div className="space-y-2">
                            {q.options.map((opt, optIndex) => {
                                const isSelected = userAnswers[qIndex] === opt;
                                let c = 'bg-white hover:bg-gray-100 border-gray-200';
                                if(isSubmitted){ if(opt===q.correctAnswer) c='bg-green-100 border-green-500 text-green-800 font-bold'; else if(isSelected) c='bg-red-100 border-red-500 text-red-800';} 
                                else if(isSelected) c='bg-blue-100 border-blue-500';
                                return (<button key={optIndex} onClick={()=>!isSubmitted && setUserAnswers(p=>({...p,[qIndex]:opt}))} className={`w-full text-left p-3 rounded-lg border-2 transition ${c}`}> {opt} </button>);
                            })}
                        </div>
                    </div>
                ))}
            </div>
            {!isSubmitted && quiz.length > 0 && <button onClick={() => setSubmitted(true)} disabled={Object.keys(userAnswers).length !== quiz.length} className="mt-6 w-full p-4 bg-green-600 text-white font-bold rounded-lg disabled:bg-gray-400">Kumpulkan</button>}
            {isSubmitted && <button onClick={() => setScreen('lesson')} className="mt-6 w-full p-4 bg-blue-600 text-white font-bold rounded-lg">Kembali</button>}
        </div>
    );
};

// --- [PERBAIKAN] Komponen Bank Soal ---
const BankSoalGeneratorScreen = () => {
    const { level, track, subject, setScreen, setError, setBankSoalQuestions } = useContext(AppContext);
    const [material, setMaterial] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!material.trim()) { setError("Masukkan materi terlebih dahulu."); return; };
        setIsLoading(true);
        try {
            // [MODIFIKASI] Prompt diubah untuk meminta hanya soal pilihan ganda.
            const prompt = `Buat 5 pertanyaan latihan pilihan ganda (A, B, C, D) dari materi ini untuk siswa ${level} ${track||''}, mata pelajaran ${subject.name}:\n\n${material}\n\nJawab hanya dalam format JSON array. Setiap objek harus memiliki properti "type":"mcq", "question" (string), "options" (array string dengan 4 pilihan), dan "correctAnswer" (string yang berisi jawaban benar).`;
            const soalText = await callGeminiAPI(prompt, true);
            const parsedSoal = JSON.parse(soalText);
            if (Array.isArray(parsedSoal) && parsedSoal.every(q => q.type === 'mcq')) { 
                setBankSoalQuestions(parsedSoal); 
                setScreen('bankSoalPlayer'); 
            } 
            else { throw new Error("Format soal dari AI tidak valid."); }
        } catch (err) { 
            console.error("Gagal membuat soal bank soal:", err);
            setError('Gagal membuat soal dari materi yang diberikan. Pastikan materi cukup jelas.'); 
        } 
        finally { setIsLoading(false); }
    };

    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
            <Header onBack={() => setScreen('subjectDashboard')} title="Bank Soal Pribadi" />
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Buat Soal dari Materimu</h2>
                <p className="text-gray-600 mb-4">Tempel materi dari catatanmu di sini, dan AI akan membuatkan soal latihan pilihan ganda untukmu.</p>
                <textarea value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Contoh: Fotosintesis adalah proses tumbuhan mengubah cahaya matahari menjadi energi..." className="w-full h-64 p-3 border-2 rounded-lg"/>
                <button onClick={handleGenerate} disabled={isLoading} className="mt-4 w-full p-4 bg-green-600 text-white font-bold rounded-lg disabled:bg-green-300 flex items-center justify-center">
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

    if(!bankSoalQuestions || bankSoalQuestions.length === 0) {
        return (
            <div className="p-4 sm:p-6 max-w-2xl mx-auto">
                <Header onBack={()=>setScreen('bankSoalGenerator')} title="Error"/>
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                    <p>Tidak ada soal untuk ditampilkan. Silakan kembali untuk membuat soal baru.</p>
                    <button onClick={() => setScreen('bankSoalGenerator')} className="mt-6 w-full p-4 bg-blue-600 text-white rounded-lg">Kembali</button>
                </div>
            </div>
        );
    }
    
    // [MODIFIKASI] Logika disederhanakan karena semua soal adalah Pilihan Ganda.
    const score = bankSoalQuestions.reduce((acc, q) => acc + (userAnswers[q.question] === q.correctAnswer ? 1 : 0), 0);
    const scorePercentage = bankSoalQuestions.length > 0 ? Math.round((score / bankSoalQuestions.length) * 100) : 0;
    
    return (
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
            <Header onBack={() => setScreen('bankSoalGenerator')} title="Latihan Soal" />
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                {isSubmitted && <h2 className="text-2xl font-bold text-center">Skor Akhir Kamu: {scorePercentage}</h2>}
                {bankSoalQuestions.map((q, qIndex) => (
                    <div key={qIndex}>
                        <p className="font-semibold">{qIndex + 1}. {q.question}</p>
                         <div className="space-y-2 mt-3">
                            {q.options.map((opt, optIndex) => {
                                const isSelected = userAnswers[q.question] === opt;
                                let c = 'bg-white hover:bg-gray-100 border-gray-200';
                                if(isSubmitted){ if(opt===q.correctAnswer) c='bg-green-100 border-green-500 font-bold'; else if(isSelected) c='bg-red-100 border-red-500';} 
                                else if(isSelected) c='bg-blue-100 border-blue-500';
                                return (<button key={optIndex} onClick={()=>!isSubmitted && setUserAnswers(p=>({...p, [q.question]:opt}))} className={`w-full text-left p-3 rounded-lg border-2 transition ${c}`}> {opt} </button>);
                            })}
                        </div>
                    </div>
                ))}
            </div>
            {!isSubmitted && <button onClick={() => setSubmitted(true)} disabled={Object.keys(userAnswers).length !== bankSoalQuestions.length} className="mt-6 w-full p-4 bg-green-600 text-white font-bold rounded-lg disabled:bg-gray-400">Kumpulkan Jawaban</button>}
            {isSubmitted && <button onClick={() => setScreen('bankSoalGenerator')} className="mt-6 w-full p-4 bg-blue-600 text-white font-bold rounded-lg">Buat Soal Lain</button>}
        </div>
    )
};

// --- Komponen Lain (Tidak Berubah) ---
const GeneralChatScreen = () => {
    const { setScreen } = useContext(AppContext);
    return (
        <div className="h-screen flex flex-col p-0 sm:p-4">
             <div className="h-full flex flex-col max-w-3xl mx-auto bg-white sm:rounded-2xl shadow-lg">
                <Header onBack={() => setScreen('subjectSelection')} title="Tanya Segalanya" />
                <ChatModal topic="topik apa pun" subject="pengetahuan umum" onClose={() => setScreen('subjectSelection')} isPage={true} />
            </div>
        </div>
    );
};

const LoadingScreen = ({ message }) => (<div className="flex flex-col items-center justify-center min-h-screen bg-white"><Sparkles className="h-24 w-24 text-blue-500 animate-pulse" /><p className="mt-6 text-gray-700 font-semibold text-lg text-center px-4">{message || 'Memuat...'}</p></div>);
const Header = ({ onBack, title, icon }) => (<div className="flex items-center mb-6 px-4 pt-4 shrink-0"><button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 mr-2 sm:mr-4"><ArrowLeft className="h-6 w-6 text-gray-600" /></button>{icon && <div className="mr-3 hidden sm:block">{icon}</div>}<div className="flex-1 min-w-0"><h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate" title={title}>{title}</h1></div></div>);
const TabButton = ({ text, icon, active, onClick }) => (<button onClick={onClick} className={`flex-1 flex items-center justify-center p-3 font-semibold transition-colors text-sm sm:text-base ${active ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>{React.cloneElement(icon, { className: "mr-2 h-5 w-5"})} {text}</button>);
const ListItem = ({text, onClick}) => (<button onClick={onClick} className="w-full text-left p-4 bg-gray-50 hover:bg-blue-100 rounded-lg transition-colors font-medium text-gray-800 flex justify-between items-center"><span>{text}</span></button>);

const ChatModal = ({ topic, subject, onClose, isPage=false }) => {
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setError } = useContext(AppContext);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const newHistory = [...history, { role: 'user', text: input }];
        setHistory(newHistory); setInput(''); setIsLoading(true);
        try {
            const prompt = `Anda adalah "Bdukasi Expert", seorang tutor AI yang ramah dan membantu. Jawab pertanyaan berikut dalam konteks topik "${topic}" (mata pelajaran: ${subject}). Berikan penjelasan yang jelas, mudah dimengerti, dan relevan dengan kurikulum di Indonesia. Jika pertanyaan di luar konteks, ingatkan pengguna dengan sopan untuk tetap fokus pada topik.\nPertanyaan: ${input}`;
            const aiResponse = await callGeminiAPI(prompt);
            setHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
        } catch (error) { 
            setError("Gagal menghubungi AI. Coba lagi nanti.");
            setHistory(prev => prev.slice(0, newHistory.length-1)); // Revert user message on error
        } finally { setIsLoading(false); }
    };
    
    const chatContainerClass = isPage ? "flex-1 flex flex-col overflow-hidden" : "bg-white rounded-2xl shadow-xl w-full max-w-lg h-[80vh] flex flex-col";
    const wrapperClass = isPage ? "flex-1 flex flex-col overflow-hidden" : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";

    const chatUI = (
        <div className={isPage ? 'h-full flex flex-col' : chatContainerClass} onClick={e => e.stopPropagation()}>
            {!isPage && ( <header className="p-4 border-b flex justify-between items-center shrink-0"><h2 className="text-lg font-bold">Tanya Expert: {topic}</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X/></button></header> )}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm text-center">Jawaban AI mungkin tidak selalu 100% akurat. Gunakan sebagai referensi.</div>
                {history.map((msg, i) => (<div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>{msg.role === 'ai' && <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center"><Sparkles className="h-5 w-5 text-purple-600" /></div>}<div className={`max-w-prose p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}><ContentRenderer text={msg.text}/></div></div>))}{isLoading && <div className="flex justify-start items-center gap-2 text-gray-500"><Loader className="animate-spin h-4 w-4" /><p>Mengetik...</p></div>}
            </main>
            <footer className="p-4 border-t bg-white shrink-0">
                <div className="relative"><input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Tanya tentang topik ini..." className="w-full p-3 pr-14 rounded-xl border-gray-300 border" /><button onClick={handleSend} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-purple-600 text-white disabled:bg-purple-300"><Sparkles className="h-5 w-5" /></button></div>
            </footer>
        </div>
    );
    if (isPage) return chatUI;
    return (<div className={wrapperClass} onClick={onClose}>{chatUI}</div>);
};
