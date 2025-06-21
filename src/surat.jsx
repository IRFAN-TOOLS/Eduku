import React, { useState, useEffect } from 'react';

// === Komponen Ikon SVG untuk Antarmuka yang Lebih Menarik ===
const PaperPlaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5">
    <path d="m3 3 3 9-3 9 19-9Z"/><path d="M6 12h16"/>
  </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-cyan-300">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6-11.5A2 2 0 0 0 1.063 1.063l11.5 6A2 2 0 0 0 14.063 8.5l4.5 4.5 -7.125 7.125Z"/><path d="m2.5 2.5 3 3"/><path d="M13 8.5 15.5 11"/><path d="M14.5 4.5 19.5 9.5"/><path d="m18 2-6 6"/><path d="m22 6-6 6"/>
    </svg>
);

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500"></div>
    <p className="text-cyan-200 text-lg tracking-wider">Menghubungkan ke masa depan...</p>
    <p className="text-gray-400 text-sm">Harap tunggu, portal waktu sedang dibuka.</p>
  </div>
);


export default function App() {
  // === State Management ===
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [feeling, setFeeling] = useState('');
  const [futureLetter, setFutureLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Efek untuk animasi teks pada judul
  const [title, setTitle] = useState('');
  const fullTitle = "Tulis Surat untuk Masa Lalu Anda";
  useEffect(() => {
    if (!isSubmitted) {
      let i = 0;
      const typingInterval = setInterval(() => {
        setTitle(fullTitle.substring(0, i + 1));
        i++;
        if (i === fullTitle.length) {
          clearInterval(typingInterval);
        }
      }, 70);
      return () => clearInterval(typingInterval);
    }
  }, [isSubmitted]);

  // === Fungsi untuk memanggil Gemini API ===
  const generateFutureLetter = async () => {
    setIsLoading(true);
    setError(null);

    // Prompt yang dirancang dengan cermat untuk AI
    const prompt = `
      Anda adalah versi masa depan dari seseorang yang telah berhasil mencapai impian mereka.
      Nama panggilan mereka saat ini adalah "${name}".
      Impian terbesar mereka saat ini adalah: "${goal}".
      Perasaan mereka tentang perjalanan ini adalah: "${feeling}".

      Tugas Anda adalah menulis surat yang hangat, bijaksana, dan sangat memberi semangat kepada diri Anda di masa lalu (pengguna).
      
      Struktur surat:
      1.  **Sapaan Personal:** Sapa mereka dengan hangat menggunakan nama panggilan mereka.
      2.  **Pengakuan:** Akui dan validasi impian serta perasaan mereka saat ini. Tunjukkan bahwa Anda ingat betapa sulitnya atau menyenangkannya perasaan itu.
      3.  **Perspektif Masa Depan:** Tanpa memberikan detail spesifik tentang "bagaimana" caranya, berikan perspektif bahwa semua kerja keras dan perasaan yang mereka alami adalah bagian penting dari perjalanan menuju kesuksesan (yaitu posisi Anda saat ini).
      4.  **Dorongan Semangat:** Berikan kata-kata motivasi yang tulus. Ingatkan mereka tentang kekuatan dan ketahanan yang mereka miliki.
      5.  **Penutup yang Hangat:** Tutup surat dengan penuh harapan dan kasih sayang.

      Gaya penulisan:
      - Gunakan Bahasa Indonesia yang mengalir dan puitis.
      - Nada: Bijaksana, tenang, penuh empati, dan inspiratif.
      - Hindari klise. Buatlah terasa otentik dan personal.
      - Jangan memberikan nasihat finansial atau prediksi yang konkret. Fokus pada pertumbuhan emosional dan mental.
    `;

    try {
        let chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = "" // API Key Anda (jika diperlukan)
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
            const text = result.candidates[0].content.parts[0].text;
            setFutureLetter(text);
            setIsSubmitted(true);
        } else {
            console.error("Unexpected response structure:", result);
            throw new Error("Gagal menerima surat dari masa depan. Format respons tidak valid.");
        }

    } catch (err) {
      console.error(err);
      setError('Maaf, terjadi gangguan pada portal waktu. Silakan coba lagi nanti.');
    } finally {
      setIsLoading(false);
    }
  };

  // === Handler untuk Form ===
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !goal || !feeling) {
      setError('Harap isi semua kolom untuk membuka portal waktu.');
      return;
    }
    generateFutureLetter();
  };
  
  // === Handler untuk Reset ===
  const handleReset = () => {
      setIsSubmitted(false);
      setName('');
      setGoal('');
      setFeeling('');
      setFutureLetter('');
      setError(null);
  }

  // === Tampilan Render ===
  return (
    <div className="bg-slate-900 min-h-screen font-sans text-gray-200 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-slate-900 transition-all duration-500">
      <div className="w-full max-w-2xl mx-auto backdrop-blur-sm bg-slate-800/50 rounded-2xl shadow-2xl shadow-cyan-500/10 border border-cyan-500/20 overflow-hidden">
        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner />
          </div>
        ) : isSubmitted ? (
          // Tampilan Surat dari Masa Depan
          <div className="p-8 md:p-12 animate-fade-in">
            <div className="flex items-center space-x-3 mb-6">
               <SparklesIcon />
               <h2 className="text-2xl md:text-3xl font-bold text-cyan-300">Sebuah Pesan untukmu...</h2>
            </div>
            <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed">
              {futureLetter.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-700 text-center">
              <button
                onClick={handleReset}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-indigo-500/50 transform hover:scale-105 transition-all duration-300"
              >
                Tulis Surat Baru
              </button>
            </div>
          </div>
        ) : (
          // Tampilan Form Input
          <form onSubmit={handleSubmit} className="p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 min-h-[48px] md:min-h-[56px]">
                {title}
                <span className="animate-pulse">_</span>
            </h1>
            <p className="text-center text-gray-400 mb-8">Isi detail ini. Versi masa depanmu sedang menunggu.</p>
            
            {error && <p className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-6 text-center">{error}</p>}
            
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-cyan-400 mb-2">Siapa nama panggilanmu?</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Sang Pemimpi"
                  className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all duration-300"
                />
              </div>
              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-cyan-400 mb-2">Apa impian atau tujuan terbesarmu saat ini?</label>
                <textarea
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Contoh: Membangun perusahaan teknologi yang mengubah dunia."
                  rows="3"
                  className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all duration-300"
                />
              </div>
              <div>
                <label htmlFor="feeling" className="block text-sm font-medium text-cyan-400 mb-2">Bagaimana perasaanmu tentang usahamu mencapai tujuan itu?</label>
                <input
                  id="feeling"
                  type="text"
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  placeholder="Contoh: Terkadang lelah dan ragu, tapi tetap semangat."
                  className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all duration-300"
                />
              </div>
            </div>
            <div className="mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperPlaneIcon />
                Buka Portal Waktu
              </button>
            </div>
          </form>
        )}
      </div>
      <footer className="text-center mt-8 text-gray-500 text-sm">
        <p>Diciptakan dengan imajinasi oleh Gemini.</p>
        <p>Sebuah eksperimen naratif berbasis AI.</p>
      </footer>
    </div>
  );
}

// Tambahkan beberapa gaya khusus untuk animasi fade-in
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.8s ease-in-out forwards;
  }
  .prose-invert p {
    margin-bottom: 1rem;
  }
`;
document.head.appendChild(style);
    
