import React, { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import {
    Search, Brain, BookOpen, Youtube, Lightbulb, FileText, ArrowLeft, Loader, Sparkles,
    AlertTriangle, X, School, FlaskConical, Globe, Calculator, Dna, BarChart2, Drama,
    Computer, BookHeart, Landmark, Languages, HelpCircle, Atom, CheckCircle, ChevronRight,
    BrainCircuit, History, BookMarked, Github, Instagram, CalendarDays
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Import plugin untuk GitHub Flavored Markdown

// --- STYLING & ANIMASI ---
const motionVariants = {
    screen: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { type: "spring", stiffness: 300, damping: 30 } },
    item: { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring", stiffness: 300, damping: 20 } },
    button: { hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } }, tap: { scale: 0.95 } }
};

// --- KONFIGURASI PENTING ---
// Catatan: Sebaiknya simpan API Key di environment variable untuk keamanan.
const GEMINI_API_KEY = "AIzaSyArJ1P8HanSQ_XVWX9m4kUlsIVXrBRInik";
const YOUTUBE_API_KEY = "AIzaSyD9Rp-oSegoIDr8q9XlKkqpEL64lB2bQVE"; // API Key YouTube dari user

// --- App Context ---
const AppContext = createContext(null);

// --- Custom Hook untuk LocalStorage ---
function useLocalStorage(key, initialValue) {
    const [storedValue, setStoredValue] = useState(() => {
        try {
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
    if (!GEMINI_API_KEY) throw new Error("Kunci API Gemini belum diatur.");
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {}
    };

    if (isJson) {
        payload.generationConfig.response_mime_type = "application/json";
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Permintaan API Gemini gagal: ${errorBody.error?.message || 'Error tidak diketahui'}`);
        }

        const result = await response.json();
        console.log("[API Success] Respons diterima dari Gemini.");
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Respons API Gemini tidak valid atau kosong.");

        const cleanedText = text.replace(/^```json\s*|```$/g, '').trim();
        return isJson ? JSON.parse(cleanedText) : cleanedText;

    } catch (error) {
        console.error("[API Exception] Terjadi kesalahan Gemini:", error);
        throw error;
    }
};

/**
 * Memanggil YouTube Data API v3 untuk mencari video paling populer.
 * @param {string} query Topik pencarian video.
 * @returns {object|null} Objek berisi judul_video, youtube_video_id, youtubeEmbedUrl, youtubeWatchUrl, atau null jika gagal.
 */
const fetchYouTubeVideo = async (query) => {
    console.log(`[YouTube API Call] Mencari video YouTube paling populer untuk query: "${query}"`);
    if (!YOUTUBE_API_KEY) {
        console.error("[YouTube API] Kunci API YouTube belum diatur.");
        return null;
    }
    // Menggunakan order=viewCount untuk mendapatkan video paling populer
    const YOUTUBE_API_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&order=viewCount&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(YOUTUBE_API_URL);
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Permintaan YouTube API gagal: ${errorBody.error?.message || 'Error tidak diketahui'}`);
        }
        const data = await response.json();
        console.log("[YouTube API Success] Respons diterima:", data);

        if (data.items && data.items.length > 0) {
            const video = data.items[0];
            const videoId = video.id.videoId;
            return {
                judul_video: video.snippet.title,
                youtube_video_id: videoId,
                youtubeEmbedUrl: `https://www.youtube.com/embed/${videoId}`,
                youtubeWatchUrl: `https://www.youtube.com/watch?v=${videoId}`
            };
        } else {
            console.log("[YouTube API] Tidak ada video ditemukan untuk query ini.");
            return null;
        }
    } catch (error) {
        console.error("[YouTube API Exception] Terjadi kesalahan YouTube:", error);
        return null;
    }
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
    const [history, setHistory] = useLocalStorage('bdukasi-expert-history-v5', []); // Versi baru
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ type: null, data: null });

    const contextValue = useMemo(() => ({ level, track, subject }), [level, track, subject]);

    const addHistory = useCallback((item) => setHistory(prev => [item, ...prev.filter(h => h.topic !== item.topic)].slice(0, 50)), [setHistory]);

    // --- FUNGSI FETCH MATERI (DIPERBARUI) ---
    const fetchLearningMaterial = useCallback(async (searchTopic, isFromHistory = false) => {
        console.log(`[Fetch Materi] Memulai untuk topik: "${searchTopic}"`);
        if (!searchTopic || !contextValue.level || !contextValue.subject) {
             console.error("[Fetch Materi] Gagal: Konteks tidak lengkap (level/mapel belum dipilih)."); return;
        }
        setIsLoading(true); setLoadingMessage('AI sedang menyusun materi dan mencari video untukmu, mohon tunggu...'); setError(null);
        setLearningData(null); setScreen('lesson');
        const { level, track, subject } = contextValue;
        if (!isFromHistory) addHistory({ topic: searchTopic, level, track, subjectName: subject.name });

        // Prompt Gemini HANYA untuk materi teks (ringkasan, materi lengkap, soal)
        const geminiPrompt = `
        Sebagai seorang ahli materi pelajaran, tolong proses permintaan berikut:
        "Buatkan saya ringkasan dan materi lengkap tentang '${searchTopic}' untuk siswa ${level} ${track ? `jurusan ${track}`: ''} mata pelajaran '${subject.name}'. Pastikan materi lengkap ditulis dalam format Markdown standar yang bersih, tanpa karakter escape (\) yang tidak perlu, dan gunakan heading, list, bold, italic untuk keterbacaan yang optimal."
        Sertakan 5 soal latihan pilihan ganda (A, B, C, D, E) beserta jawaban dan penjelasan untuk setiap soal."

        Tolong berikan respons HANYA dalam format JSON yang valid dan bersih dengan struktur berikut:
        {
          "ringkasan": "Ringkasan singkat dan padat mengenai topik '${searchTopic}'.",
          "materi_lengkap": "Penjelasan materi yang komprehensif dan terstruktur dengan baik dalam format Markdown. Contoh: ## Judul, - List Item, **Bold**, *Italic*.",
          "latihan_soal": [
            {
              "question": "Pertanyaan pertama terkait materi.",
              "options": ["A. Opsi A", "B. Opsi B", "C. Opsi C", "D. Opsi D", "E. Opsi E"],
              "correctAnswer": "A",
              "explanation": "Penjelasan mengapa jawaban A adalah yang benar."
            }
          ]
        }
        `;

        try {
            // Fetch text content from Gemini
            const geminiData = await callGeminiAPI(geminiPrompt);

            // Fetch video data from YouTube API
            const youtubeVideoData = await fetchYouTubeVideo(searchTopic);

            // Combine data and update state
            setLearningData({
                topic: searchTopic,
                ...geminiData,
                judul_video: youtubeVideoData?.judul_video || 'Video Pembelajaran Tidak Tersedia',
                youtube_video_id: youtubeVideoData?.youtube_video_id || null, // Simpan ID video
                youtubeEmbedUrl: youtubeVideoData?.youtubeEmbedUrl || null,
                youtubeWatchUrl: youtubeVideoData?.youtubeWatchUrl || null,
            });
            console.log("[Fetch Materi] Sukses, data materi dan video diatur.");
        } catch (err) {
            console.error("[Fetch Materi] Error:", err);
            setError(`Gagal memuat materi: ${err.message}. Coba lagi nanti.`);
            setScreen('subjectDashboard');
        } finally {
            setIsLoading(false);
        }
    }, [contextValue, addHistory]);

    const fetchRecommendations = useCallback(async () => {
        console.log("[Fetch Rekomendasi] Memulai...");
        if (!contextValue.level || !contextValue.subject) return;
        const { level, track, subject } = contextValue;
        const prompt = `Berikan 5 rekomendasi topik yang menarik untuk dipelajari dalam mata pelajaran "${subject.name}" untuk siswa level ${level} ${track ? `jurusan ${track}`: ''}. Jawab HANYA dalam format JSON array berisi string. Contoh: ["Topik 1", "Topik 2"]`;
        try {
            const recs = await callGeminiAPI(prompt); setRecommendations(Array.isArray(recs) ? recs : []);
        } catch (err) { console.error("Gagal fetch rekomendasi:", err); setRecommendations([]); }
    }, [contextValue]);

    // --- FUNGSI FETCH BANK SOAL (DIPERBARUI) ---
    const fetchBankSoal = useCallback(async (topic, count) => {
        console.log(`[Fetch Bank Soal] Memulai untuk topik: "${topic}" sejumlah ${count} soal.`);
        if (!topic || !contextValue.level || !contextValue.subject || !count) {
             console.error("[Fetch Bank Soal] Gagal: Topik, jumlah soal, atau konteks pelajaran tidak lengkap.");
             setError("Harap masukkan topik dan jumlah soal yang valid.");
             return;
        }
        setIsLoading(true); setLoadingMessage(`AI sedang membuat ${count} soal untuk topik "${topic}"...`); setError(null);

        const { level, track, subject } = contextValue;

        // Prompt diperbarui untuk menerima jumlah soal
        const prompt = `
        Tolong proses permintaan berikut:
        "Buatkan saya soal tentang '${topic}' berjumlah ${count} butir untuk mata pelajaran '${subject.name}' level ${level} ${track ? `jurusan ${track}` : ''}. Setiap soal harus dalam bentuk pilihan ganda (A, B, C, D, E) beserta jawaban dan penjelasan yang jelas."

        Berikan respons HANYA dalam format JSON array dari objek, dengan struktur berikut:
        [
          {
            "question": "Isi pertanyaan di sini.",
            "options": ["A. Opsi jawaban A", "B. Opsi jawaban B", "C. Opsi jawaban C", "D. Opsi jawaban D", "E. Opsi jawaban E"],
            "correctAnswer": "A",
            "explanation": "Penjelasan detail mengapa jawaban tersebut benar dan yang lain salah."
          }
        ]
        `;
        try {
            const soal = await callGeminiAPI(prompt);
            setBankSoal(Array.isArray(soal) ? soal : []);
            setScreen('bankSoal');
        } catch(err) {
            setError(`Gagal membuat bank soal: ${err.message}`);
            setScreen('subjectDashboard');
        } finally {
            setIsLoading(false);
        }
    }, [contextValue]);

    const fetchStudyPlan = useCallback(async (goal) => {
        console.log(`[Fetch Rencana Belajar] Memulai untuk tujuan: "${goal}"`);
        if (!goal || !contextValue.subject) return;
        setModal({ type: 'loading', data: 'AI sedang membuat Rencana Belajar...' });
        const { subject, level, track } = contextValue;
        const prompt = `Buat rencana belajar mingguan untuk mencapai tujuan: "${goal}" dalam mata pelajaran ${subject.name} untuk siswa ${level} ${track}. Jawab HANYA dalam JSON: {"title": "Rencana Belajar: ${goal}", "plan": [{"week": 1, "focus": "...", "tasks": ["...", "..."]}]}`;
        try { setModal({ type: 'studyPlan', data: await callGeminiAPI(prompt) });
        } catch(err) { setModal({ type: 'error', data: err.message }); }
    }, [contextValue]);

    const value = { screen, setScreen, level, setLevel, track, setTrack, subject, setSubject, learningData, recommendations, fetchRecommendations, bankSoal, fetchBankSoal, isLoading, error, setError, history, fetchLearningMaterial, modal, setModal, fetchStudyPlan };

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
const BackButton = ({ onClick }) => <button onClick={onClick} className="flex items-center gap-2 text-blue-400 font-semibold hover:underline mb-8 absolute top-8 left-8 z-10"><ArrowLeft size={20} /> Kembali</button>;
const InfoCard = ({ icon, title, children, className = '' }) => <div className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg overflow-hidden ${className}`} style={{animation: 'fadeInUp 0.5s ease-out forwards'}}><div className="p-4 border-b border-gray-700 flex items-center gap-3">{icon && <div className="text-blue-400">{React.cloneElement(icon, { size: 24 })}</div>}<h2 className="text-xl font-bold text-gray-100">{title}</h2></div><div className="p-4 sm:p-6">{children}</div></div>;
const LoadingSpinner = ({ message }) => <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900"><Loader className="w-16 h-16 text-blue-500 animate-spin" /><p className="text-xl font-semibold mt-6 text-gray-300 text-center max-w-md">{message || 'AI sedang menyusun materi...'}</p></div>;
const ErrorMessage = ({ message }) => <div className="bg-red-900/50 border-l-4 border-red-500 text-red-300 p-4 rounded-r-lg mt-4 w-full max-w-xl mx-auto flex items-center gap-4"><AlertTriangle className="h-6 w-6 text-red-500" /><p className="font-bold">{message}</p></div>;
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
                        <div classN