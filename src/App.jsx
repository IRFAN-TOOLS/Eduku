import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

// --- LANGKAH 1: KONFIGURASI FIREBASE ANDA ---
// Ganti nilai di bawah ini dengan konfigurasi dari Proyek Firebase Anda.
const userFirebaseConfig = {
        apiKey: "AIzaSyANQqaFwrsf3xGSDxyn9pcRJqJrIiHrjM0", 
    authDomain: "bgune---community.firebaseapp.com",
    projectId: "bgune---community",
    storageBucket: "bgune---community.appspot.com", // Still needed for project config, but not for direct file uploads
    messagingSenderId: "749511144215",
    appId: "1:749511144215:web:dcf13c4d59dc705d4f7d52",
    measurementId: "G-5XRSG2H5SV" 
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : userFirebaseConfig;

// --- LANGKAH 2: KONFIGURASI API KEY LAINNYA ---
// Masukkan API Key Anda di sini.
const GEMINI_API_KEY = "AIzaSyArJ1P8HanSQ_XVWX9m4kUlsIVXrBRInik";
const YOUTUBE_API_KEY = "AIzaSyD9Rp-oSegoIDr8q9XlKkqpEL64lB2bQVE";


// --- Komponen Ikon (Lucide-React style SVGs) ---
const BookOpen = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);
const Video = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);
const FileQuestion = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M10 10.3c.2-.4.5-.8.9-1a2.1 2.1 0 0 1 2.6.4c.3.4.5.8.5 1.3 0 1.3-2 2-2 2"/><path d="M12 17h.01"/></svg>
);
const LogOut = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);
const GoogleIcon = () => ( <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C41.38,36.783,44,30.825,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg> );
const LoaderCircle = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

// --- Komponen Utama Aplikasi ---
export default function App() {
    const [user, setUser] = useState(null);
    const [auth, setAuth] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        if (firebaseConfig.apiKey.includes("MASUKKAN_API_KEY")) return;
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        setAuth(authInstance);

        const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
            setUser(currentUser);
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = () => {
        if (!auth) {
             alert("Konfigurasi Firebase belum diisi dengan benar.");
             return;
        }
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).catch((error) => console.error("Error saat login:", error));
    };

    const handleLogout = () => {
        if (!auth) return;
        signOut(auth).catch((error) => console.error("Error saat logout:", error));
    };

    if (firebaseConfig.apiKey.includes("AIzaSyANQqaFwrsf3xGSDxyn9pcRJqJrIiHrjM0")) {
        return <ConfigWarningScreen />;
    }

    if (!isAuthReady) {
        return <LoadingScreen message="Menyiapkan sesi..." />;
    }

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            {user ? (
                <Dashboard user={user} onLogout={handleLogout} />
            ) : (
                <LoginScreen onLogin={handleLogin} />
            )}
        </div>
    );
}

// --- Komponen Halaman dan Tampilan ---

function LoginScreen({ onLogin }) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-sm mx-auto overflow-hidden bg-white rounded-lg shadow-md">
                <div className="px-6 py-8">
                    <h2 className="text-3xl font-bold text-center text-gray-700">Bdukasi</h2>
                    <p className="mt-1 text-center text-gray-500">Selamat Datang Kembali</p>
                    <p className="mt-4 text-center text-sm text-gray-600">Platform belajar modern untuk siswa Indonesia. Masuk untuk melanjutkan.</p>
                    <div className="mt-8">
                        <button onClick={onLogin} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-300 transform border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none">
                            <GoogleIcon />
                            <span>Masuk dengan Google</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Dashboard({ user, onLogout }) {
    const [kelas, setKelas] = useState('');
    
    if (!kelas) {
        return <ClassSelector user={user} onLogout={onLogout} onSelect={setKelas} />;
    }
    
    return <MainInterface user={user} onLogout={onLogout} selectedClass={kelas} />;
}

function ClassSelector({ user, onLogout, onSelect }) {
     const classes = ["1 SD", "2 SD", "3 SD", "4 SD", "5 SD", "6 SD", "7 SMP", "8 SMP", "9 SMP", "10 SMA", "11 SMA", "12 SMA"];
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-2xl p-8 bg-white rounded-xl shadow-lg text-center">
                 <img src={user.photoURL} alt={user.displayName} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-md"/>
                 <h2 className="text-3xl font-bold text-gray-800">Halo, {user.displayName}!</h2>
                 <p className="text-gray-500 mt-2 mb-8">Pilih jenjang kelasmu untuk personalisasi materi.</p>
                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                     {classes.map(c => (
                         <button key={c} onClick={() => onSelect(c.split(' ')[0])} className="p-4 bg-gray-50 rounded-lg text-gray-700 font-semibold hover:bg-indigo-100 hover:text-indigo-700 transform hover:scale-105 transition-all duration-200">
                             {c}
                         </button>
                     ))}
                 </div>
                 <button onClick={onLogout} className="mt-8 text-sm text-gray-400 hover:text-red-500">Bukan Anda? Logout</button>
            </div>
        </div>
    );
}

function MainInterface({ user, onLogout, selectedClass }) {
    const [activeTab, setActiveTab] = useState('materi');

    const renderContent = () => {
        switch (activeTab) {
            case 'video': return <VideoSearch selectedClass={selectedClass} />;
            case 'soal': return <QuizGenerator selectedClass={selectedClass} />;
            case 'materi':
            default:
                return <MaterialGenerator selectedClass={selectedClass} />;
        }
    };
    
    const tabs = [
        { id: 'materi', label: 'Materi Pelajaran', icon: BookOpen },
        { id: 'video', label: 'Video Pembelajaran', icon: Video },
        { id: 'soal', label: 'Latihan Soal', icon: FileQuestion }
    ];

    return (
        <div>
            {/* Navbar */}
            <nav className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <span className="font-bold text-2xl text-indigo-600">Bdukasi</span>
                             <span className="ml-4 bg-indigo-100 text-indigo-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">Kelas {selectedClass}</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-600 mr-4 hidden sm:block">Halo, {user.displayName.split(' ')[0]}!</span>
                            <img className="h-8 w-8 rounded-full" src={user.photoURL} alt="User avatar" />
                            <button onClick={onLogout} className="ml-4 text-gray-500 hover:text-indigo-600" title="Logout">
                                <LogOut className="h-6 w-6"/>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content Area */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Tabs */}
                <div className="mb-6">
                    <div className="sm:hidden">
                        <select onChange={(e) => setActiveTab(e.target.value)} value={activeTab} className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
                        </select>
                    </div>
                    <div className="hidden sm:block">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                {tabs.map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
                                        <tab.icon className="-ml-0.5 mr-2 h-5 w-5" />
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
}

// --- Komponen Fitur (Tabs) ---

function MaterialGenerator({ selectedClass }) {
    const [topic, setTopic] = useState('');
    const [material, setMaterial] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        setIsLoading(true);
        setMaterial('');

        try {
            const prompt = `Sebagai seorang guru ahli, jelaskan topik "${topic}" untuk siswa kelas ${selectedClass} dengan cara yang sangat menarik, jelas, dan mudah dipahami. Gunakan analogi sederhana dan poin-poin. Format jawabanmu menggunakan Markdown (gunakan heading, bold, dan list).`;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) throw new Error("Gagal mengambil data dari Gemini API.");
            const data = await response.json();
            setMaterial(data.candidates[0].content.parts[0].text);
        } catch (error) {
            console.error(error);
            setMaterial("Maaf, terjadi kesalahan saat membuat materi. Coba lagi ya.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Simple Markdown to HTML renderer
    const renderMarkdown = (text) => {
        let html = text
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3 border-b pb-2">$1</h2>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\s*[\*-] (.*$)/gim, '<li class="ml-5 list-disc">$1</li>');
        return { __html: html };
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Materi Pelajaran</h2>
            <p className="mt-1 text-gray-500">Ketik topik yang ingin kamu pelajari di bawah ini.</p>
            <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Contoh: Proses terjadinya hujan"
                    className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    disabled={isLoading}
                />
                <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors" disabled={isLoading}>
                    {isLoading ? <LoaderCircle className="animate-spin h-5 w-5" /> : 'Buat Materi'}
                </button>
            </form>
            <div className="mt-8 prose max-w-none">
                {isLoading && <p>Sedang membuat materi, mohon tunggu...</p>}
                {material && <div dangerouslySetInnerHTML={renderMarkdown(material)} />}
            </div>
        </div>
    );
}

function VideoSearch() {
    const [query, setQuery] = useState('');
    const [videos, setVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setIsLoading(true);
        setVideos([]);
        setSelectedVideoId(null);
        
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
            if (!response.ok) throw new Error('Gagal mengambil data dari YouTube API.');
            const data = await response.json();
            setVideos(data.items);
        } catch(error) {
            console.error(error);
            alert("Terjadi kesalahan saat mencari video. Pastikan API Key YouTube Anda valid.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div>
             <h2 className="text-2xl font-bold text-gray-800">Video Pembelajaran</h2>
            <p className="mt-1 text-gray-500">Cari video dari YouTube untuk membantumu belajar.</p>
             <form onSubmit={handleSearch} className="mt-6 flex gap-2">
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Contoh: Tata Surya untuk anak SD" className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" disabled={isLoading}/>
                <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors" disabled={isLoading}>
                    {isLoading ? <LoaderCircle className="animate-spin h-5 w-5" /> : 'Cari Video'}
                </button>
            </form>

            {selectedVideoId && (
                <div className="mt-8">
                    <div className="aspect-w-16 aspect-h-9">
                        <iframe className="w-full h-full rounded-lg shadow-lg" src={`https://www.youtube.com/embed/${selectedVideoId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </div>
                </div>
            )}
            
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {isLoading && <p>Mencari video...</p>}
                {videos.map(video => (
                    <div key={video.id.videoId} onClick={() => setSelectedVideoId(video.id.videoId)} className="cursor-pointer bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                        <img src={video.snippet.thumbnails.high.url} alt={video.snippet.title} className="w-full h-40 object-cover" />
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-800 line-clamp-2">{video.snippet.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{video.snippet.channelTitle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function QuizGenerator({ selectedClass }) {
    const [topic, setTopic] = useState('');
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [answers, setAnswers] = useState({});

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        setIsLoading(true);
        setQuestions([]);
        setAnswers({});

        try {
            const prompt = `Buatkan 5 soal latihan pilihan ganda (A, B, C, D) tentang topik "${topic}" untuk siswa kelas ${selectedClass}. Sertakan kunci jawabannya. Format jawabanmu sebagai JSON dengan struktur: { "questions": [ { "question": "...", "options": ["...", "...", "...", "..."], "answer": "..." } ] }`;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
            });
            if (!response.ok) throw new Error("Gagal mengambil data dari Gemini API.");
            const data = await response.json();
            const quizData = JSON.parse(data.candidates[0].content.parts[0].text);
            setQuestions(quizData.questions);
        } catch (error) {
            console.error(error);
            alert("Gagal membuat soal. Pastikan API Key Gemini Anda valid dan mendukung format JSON.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAnswerSelect = (qIndex, option) => {
        setAnswers(prev => ({ ...prev, [qIndex]: option }));
    };

    return (
        <div>
             <h2 className="text-2xl font-bold text-gray-800">Latihan Soal</h2>
            <p className="mt-1 text-gray-500">Uji pemahamanmu dengan mengerjakan soal-soal di bawah ini.</p>
             <form onSubmit={handleGenerate} className="mt-6 flex gap-2">
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Contoh: Pecahan Matematika" className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" disabled={isLoading}/>
                <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors" disabled={isLoading}>
                    {isLoading ? <LoaderCircle className="animate-spin h-5 w-5" /> : 'Buat Soal'}
                </button>
            </form>
            
            <div className="mt-8 space-y-6">
                {isLoading && <p>Sedang membuat soal, mohon tunggu...</p>}
                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-gray-50 p-6 rounded-lg border">
                        <p className="font-semibold text-lg text-gray-800">{qIndex + 1}. {q.question}</p>
                        <div className="mt-4 space-y-2">
                            {q.options.map((opt, oIndex) => {
                                const isSelected = answers[qIndex] === opt;
                                const isCorrect = q.answer === opt;
                                let buttonClass = 'text-left w-full p-3 border rounded-md hover:bg-gray-200 transition-colors';
                                if (isSelected && answers.hasOwnProperty(qIndex)) {
                                    buttonClass += isCorrect ? ' bg-green-100 border-green-400 text-green-800' : ' bg-red-100 border-red-400 text-red-800';
                                } else {
                                    buttonClass += ' bg-white border-gray-300';
                                }

                                return <button key={oIndex} onClick={() => handleAnswerSelect(qIndex, opt)} className={buttonClass}>{opt}</button>
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LoadingScreen({ message }) {
    return <div className="flex items-center justify-center h-screen bg-gray-100"><p>{message}</p></div>;
}
function ConfigWarningScreen() {
    return (
        <div className="flex items-center justify-center h-screen bg-yellow-50 text-yellow-800 p-4">
            <div className="text-center p-8 border-2 border-dashed border-yellow-300 rounded-lg bg-white">
                <h1 className="text-2xl font-bold mb-2">Konfigurasi Dibutuhkan</h1>
                <p>Harap masukkan konfigurasi Firebase dan API Key Anda di dalam kode untuk menjalankan aplikasi.</p>
                <p className="mt-2 text-sm">Lihat instruksi di luar blok kode ini untuk panduan lengkap.</p>
            </div>
        </div>
    );
}
