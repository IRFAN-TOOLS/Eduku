import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInAnonymously,
    signInWithCustomToken
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    query,
    onSnapshot,
    orderBy,
    doc,
    setDoc,
    getDoc,
    Timestamp,
    where,
    getDocs,
    deleteDoc,
    updateDoc
} from 'firebase/firestore';
import { PlusCircle, BookOpen, MessageSquare, LogOut, User, Zap, Home, Send, Image as ImageIcon, Video, FileText, Search, Settings, ThumbsUp, MessageCircle, Share2, Trash2, Edit3, Eye, CheckCircle, XCircle, AlertTriangle, Info, Menu, X } from 'lucide-react';

// Konfigurasi Firebase (Gunakan __firebase_config global jika tersedia)
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "YOUR_API_KEY", // Ganti dengan API key Anda jika __firebase_config tidak tersedia
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ID Aplikasi (Gunakan __app_id global jika tersedia)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'eduku-app-default';

// Komponen Ikon yang Lebih Baik
const Icon = ({ name, size = 24, color = "currentColor", className = "" }) => {
    const icons = {
        home: <Home size={size} color={color} className={className} />,
        feed: <FileText size={size} color={color} className={className} />,
        library: <BookOpen size={size} color={color} className={className} />,
        chat: <MessageSquare size={size} color={color} className={className} />,
        ai: <Zap size={size} color={color} className={className} />,
        logout: <LogOut size={size} color={color} className={className} />,
        user: <User size={size} color={color} className={className} />,
        plus: <PlusCircle size={size} color={color} className={className} />,
        send: <Send size={size} color={color} className={className} />,
        image: <ImageIcon size={size} color={color} className={className} />,
        video: <Video size={size} color={color} className={className} />,
        search: <Search size={size} color={color} className={className} />,
        settings: <Settings size={size} color={color} className={className} />,
        like: <ThumbsUp size={size} color={color} className={className} />,
        comment: <MessageCircle size={size} color={color} className={className} />,
        share: <Share2 size={size} color={color} className={className} />,
        delete: <Trash2 size={size} color={color} className={className} />,
        edit: <Edit3 size={size} color={color} className={className} />,
        view: <Eye size={size} color={color} className={className} />,
        verified: <CheckCircle size={size} color={color} className={className} />,
        error: <XCircle size={size} color={color} className={className} />,
        warning: <AlertTriangle size={size} color={color} className={className} />,
        info: <Info size={size} color={color} className={className} />,
        menu: <Menu size={size} color={color} className={className} />,
        close: <X size={size} color={color} className={className} />,
    };
    return icons[name] || <Home size={size} color={color} className={className} />;
};


// Komponen Notifikasi Kustom
const CustomNotification = ({ message, type, onClose }) => {
    if (!message) return null;

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const IconComponent = type === 'success' ? <Icon name="verified" /> : type === 'error' ? <Icon name="error" /> : <Icon name="info" />;

    return (
        <div className={`fixed top-5 right-5 ${bgColor} text-white p-4 rounded-lg shadow-lg flex items-center z-50`}>
            <div className="mr-3">{IconComponent}</div>
            <div>{message}</div>
            <button onClick={onClose} className="ml-4 text-xl font-bold">&times;</button>
        </div>
    );
};

// Komponen Modal Kustom
const CustomModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <Icon name="close" size={24} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};


// Komponen Halaman Autentikasi
const AuthPage = ({ onAuthSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        setNotification({ message: '', type: '' });

        if (!email || !password) {
            setError("Email dan password tidak boleh kosong.");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                setNotification({ message: 'Login berhasil!', type: 'success' });
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                setNotification({ message: 'Registrasi berhasil! Silakan login.', type: 'success' });
                setIsLogin(true); // Arahkan ke login setelah registrasi
            }
            // onAuthSuccess akan dipanggil oleh onAuthStateChanged di App.js
        } catch (err) {
            setError(err.message.includes("auth/invalid-credential") ? "Email atau password salah." : 
                     err.message.includes("auth/email-already-in-use") ? "Email sudah terdaftar." :
                     "Terjadi kesalahan. Coba lagi.");
            setNotification({ message: error, type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    const closeNotification = () => setNotification({ message: '', type: '' });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 p-4">
            <CustomNotification message={notification.message} type={notification.type} onClose={closeNotification} />
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
                    {isLogin ? 'Selamat Datang di Eduku!' : 'Buat Akun Eduku'}
                </h2>
                <form onSubmit={handleAuth}>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                            id="email"
                            type="email"
                            placeholder="email@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                            id="password"
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            className={`w-full font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-transform transform hover:scale-105 ${loading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (isLogin ? 'Logging in...' : 'Registering...') : (isLogin ? 'Login' : 'Registrasi')}
                        </button>
                    </div>
                    <p className="text-center text-sm text-gray-600">
                        {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{' '}
                        <button
                            type="button"
                            className="font-semibold text-purple-600 hover:text-purple-800"
                            onClick={() => { setIsLogin(!isLogin); setError('');}}
                        >
                            {isLogin ? 'Registrasi di sini' : 'Login di sini'}
                        </button>
                    </p>
                </form>
                 <p className="text-center text-xs text-gray-500 mt-8">
                    UserId: {auth.currentUser?.uid || "Belum login"} <br/>
                    AppId: {appId}
                </p>
            </div>
        </div>
    );
};

// Komponen Beranda (Feed)
const FeedPage = ({ user }) => {
    const [posts, setPosts] = useState([]);
    const [newPostText, setNewPostText] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [editingPost, setEditingPost] = useState(null); // { id: string, text: string }
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // postId
    const [userId, setUserId] = useState(user?.uid);

    useEffect(() => {
        if (user?.uid) {
            setUserId(user.uid);
        }
    }, [user]);

    // Path Firestore untuk postingan (Publik)
    const postsCollectionPath = `artifacts/${appId}/public/data/posts`;

    useEffect(() => {
        if (!userId) return; // Jangan fetch jika userId belum ada

        const q = query(collection(db, postsCollectionPath)); // Urutkan berdasarkan createdAt descending
        
        // Menggunakan getDocs untuk sekali fetch, atau onSnapshot untuk realtime
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const postsData = [];
            querySnapshot.forEach((doc) => {
                postsData.push({ id: doc.id, ...doc.data() });
            });
            // Sort posts by createdAt in descending order (newest first)
            postsData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            setPosts(postsData);
        }, (error) => {
            console.error("Error fetching posts: ", error);
            setNotification({ message: "Gagal memuat postingan.", type: 'error' });
        });

        return () => unsubscribe();
    }, [userId, postsCollectionPath]);

    const handleCreatePost = async () => {
        if (!newPostText.trim()) {
            setNotification({ message: "Postingan tidak boleh kosong.", type: 'warning' });
            return;
        }
        if (!userId) {
             setNotification({ message: "Anda harus login untuk membuat postingan.", type: 'error' });
             return;
        }
        setLoading(true);
        try {
            await addDoc(collection(db, postsCollectionPath), {
                text: newPostText,
                authorId: userId,
                authorEmail: user.email, // Simpan email untuk tampilan
                createdAt: Timestamp.now(),
                likes: [],
                comments: []
            });
            setNewPostText('');
            setNotification({ message: "Postingan berhasil dibuat!", type: 'success' });
        } catch (error) {
            console.error("Error creating post: ", error);
            setNotification({ message: "Gagal membuat postingan.", type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    const handleEditPost = (post) => {
        setEditingPost({ id: post.id, text: post.text });
    };

    const handleSaveEdit = async () => {
        if (!editingPost || !editingPost.text.trim()) {
            setNotification({ message: "Postingan tidak boleh kosong.", type: 'warning' });
            return;
        }
        setLoading(true);
        try {
            const postRef = doc(db, postsCollectionPath, editingPost.id);
            await updateDoc(postRef, { text: editingPost.text });
            setEditingPost(null);
            setNotification({ message: "Postingan berhasil diperbarui!", type: 'success' });
        } catch (error) {
            console.error("Error updating post: ", error);
            setNotification({ message: "Gagal memperbarui postingan.", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId) => {
        setShowDeleteConfirm(postId);
    };

    const confirmDeletePost = async (postId) => {
        setLoading(true);
        try {
            await deleteDoc(doc(db, postsCollectionPath, postId));
            setNotification({ message: "Postingan berhasil dihapus!", type: 'success' });
            setShowDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting post: ", error);
            setNotification({ message: "Gagal menghapus postingan.", type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    
    const handleLikePost = async (postId) => {
        if (!userId) {
            setNotification({ message: "Login untuk menyukai postingan.", type: 'warning' });
            return;
        }
        const postRef = doc(db, postsCollectionPath, postId);
        const postDoc = await getDoc(postRef);
        if (postDoc.exists()) {
            const postData = postDoc.data();
            let newLikes = [...(postData.likes || [])];
            if (newLikes.includes(userId)) {
                newLikes = newLikes.filter(uid => uid !== userId); // Unlike
            } else {
                newLikes.push(userId); // Like
            }
            await updateDoc(postRef, { likes: newLikes });
        }
    };


    const closeNotification = () => setNotification({ message: '', type: '' });

    return (
        <div className="container mx-auto p-4 pt-20 md:pt-24 max-w-2xl">
            <CustomNotification message={notification.message} type={notification.type} onClose={closeNotification} />
            
            {/* Modal Edit Postingan */}
            <CustomModal isOpen={!!editingPost} onClose={() => setEditingPost(null)} title="Edit Postingan">
                {editingPost && (
                    <div className="space-y-4">
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            rows="4"
                            value={editingPost.text}
                            onChange={(e) => setEditingPost({...editingPost, text: e.target.value})}
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setEditingPost(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={loading}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                            >
                                {loading ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    </div>
                )}
            </CustomModal>

            {/* Modal Konfirmasi Hapus */}
            <CustomModal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Konfirmasi Hapus">
                 <p className="text-gray-700 mb-6">Anda yakin ingin menghapus postingan ini?</p>
                 <div className="flex justify-end space-x-3">
                    <button 
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={() => confirmDeletePost(showDeleteConfirm)} 
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                    >
                        {loading ? "Menghapus..." : "Hapus"}
                    </button>
                 </div>
            </CustomModal>


            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Buat Postingan Baru</h3>
                <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    placeholder="Apa yang kamu pikirkan, Edu-creator?"
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                />
                {/* Placeholder untuk upload foto/video */}
                <div className="flex space-x-2 mt-3 mb-3">
                    <button className="flex items-center text-sm text-purple-600 hover:text-purple-800 p-2 rounded-md hover:bg-purple-100 transition-colors">
                        <Icon name="image" size={20} className="mr-1" /> Foto
                    </button>
                    <button className="flex items-center text-sm text-purple-600 hover:text-purple-800 p-2 rounded-md hover:bg-purple-100 transition-colors">
                        <Icon name="video" size={20} className="mr-1" /> Video
                    </button>
                </div>
                <button
                    onClick={handleCreatePost}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 ease-in-out disabled:bg-gray-400 flex items-center justify-center"
                >
                    <Icon name="send" size={18} className="mr-2"/> {loading ? 'Mengirim...' : 'Kirim Postingan'}
                </button>
            </div>

            <div className="space-y-6">
                {posts.length === 0 && !loading && (
                    <p className="text-center text-gray-500">Belum ada postingan. Jadilah yang pertama!</p>
                )}
                {posts.map(post => (
                    <div key={post.id} className="bg-white p-5 rounded-xl shadow-lg">
                        <div className="flex items-center mb-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold mr-3">
                                {post.authorEmail ? post.authorEmail.substring(0, 1).toUpperCase() : <Icon name="user" size={20}/>}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">{post.authorEmail || "Anonim"}</p>
                                <p className="text-xs text-gray-500">
                                    {post.createdAt ? new Date(post.createdAt.toDate()).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short'}) : 'Beberapa waktu lalu'}
                                </p>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.text}</p>
                        <div className="flex justify-between items-center border-t pt-3">
                            <button onClick={() => handleLikePost(post.id)} className={`flex items-center space-x-1 text-sm ${post.likes?.includes(userId) ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'} p-2 rounded-md hover:bg-purple-50 transition-colors`}>
                                <Icon name="like" size={18} /> 
                                <span>{post.likes?.length || 0} Suka</span>
                            </button>
                            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-purple-600 p-2 rounded-md hover:bg-purple-50 transition-colors">
                                <Icon name="comment" size={18} /> 
                                <span>{post.comments?.length || 0} Komentar</span>
                            </button>
                            {/* Hanya tampilkan tombol edit/hapus jika post milik user */}
                            {userId === post.authorId && (
                                <div className="flex space-x-2">
                                    <button onClick={() => handleEditPost(post)} className="text-sm text-blue-500 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50 transition-colors">
                                        <Icon name="edit" size={18} />
                                    </button>
                                    <button onClick={() => handleDeletePost(post.id)} className="text-sm text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 transition-colors">
                                        <Icon name="delete" size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// Komponen Perpustakaan Digital (Placeholder)
const LibraryPage = ({ user }) => {
    const [myEbooks, setMyEbooks] = useState([]);
    const [communityEbooks, setCommunityEbooks] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [newEbookTitle, setNewEbookTitle] = useState('');
    const [newEbookFile, setNewEbookFile] = useState(null); // Untuk file .txt atau .md
    const [newEbookContent, setNewEbookContent] = useState(''); // Untuk konten yang diketik langsung
    const [uploadType, setUploadType] = useState('type'); // 'type' or 'upload'
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [userId, setUserId] = useState(user?.uid);

    useEffect(() => {
        if (user?.uid) {
            setUserId(user.uid);
        }
    }, [user]);

    const ebooksCollectionPath = `artifacts/${appId}/public/data/ebooks`;

    // Fetch ebooks
    useEffect(() => {
        if (!userId) return;

        const q = query(collection(db, ebooksCollectionPath));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const allEbooks = [];
            querySnapshot.forEach((doc) => {
                allEbooks.push({ id: doc.id, ...doc.data() });
            });
            allEbooks.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setMyEbooks(allEbooks.filter(ebook => ebook.authorId === userId));
            setCommunityEbooks(allEbooks.filter(ebook => ebook.authorId !== userId));
        }, (error) => {
            console.error("Error fetching ebooks:", error);
            setNotification({ message: "Gagal memuat e-book.", type: "error" });
        });
        return () => unsubscribe();
    }, [userId, ebooksCollectionPath]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file && (file.type === "text/plain" || file.type === "text/markdown")) {
            setNewEbookFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setNewEbookContent(e.target.result);
            reader.readAsText(file);
            setNotification({ message: `File ${file.name} dipilih.`, type: "info" });
        } else {
            setNewEbookFile(null);
            setNewEbookContent('');
            setNotification({ message: "Format file tidak didukung. Harap unggah .txt atau .md", type: "error" });
        }
    };

    const handleUploadEbook = async () => {
        if (!newEbookTitle.trim() || !newEbookContent.trim()) {
            setNotification({ message: "Judul dan konten e-book tidak boleh kosong.", type: "warning" });
            return;
        }
        if (!userId) {
            setNotification({ message: "Anda harus login untuk mengunggah e-book.", type: "error" });
            return;
        }
        setLoading(true);
        try {
            await addDoc(collection(db, ebooksCollectionPath), {
                title: newEbookTitle,
                content: newEbookContent, // Simpan konten sebagai string
                authorId: userId,
                authorEmail: user.email,
                createdAt: Timestamp.now(),
                fileName: newEbookFile ? newEbookFile.name : "Konten diketik langsung"
            });
            setShowUploadModal(false);
            setNewEbookTitle('');
            setNewEbookFile(null);
            setNewEbookContent('');
            setNotification({ message: "E-book berhasil diunggah!", type: "success" });
        } catch (error) {
            console.error("Error uploading ebook:", error);
            setNotification({ message: "Gagal mengunggah e-book.", type: "error" });
        } finally {
            setLoading(false);
        }
    };
    
    const closeNotification = () => setNotification({ message: '', type: '' });

    // Placeholder untuk fungsi lihat/baca e-book
    const viewEbook = (ebook) => {
        alert(`Membaca E-book: ${ebook.title}\n\nKonten:\n${ebook.content.substring(0,200)}...`);
    };
    
    const deleteEbook = async (ebookId) => {
        // Implement confirmation modal if desired
        setLoading(true);
        try {
            await deleteDoc(doc(db, ebooksCollectionPath, ebookId));
            setNotification({ message: "E-book berhasil dihapus.", type: "success" });
        } catch (error) {
            console.error("Error deleting ebook:", error);
            setNotification({ message: "Gagal menghapus e-book.", type: "error" });
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="container mx-auto p-4 pt-20 md:pt-24">
            <CustomNotification message={notification.message} type={notification.type} onClose={closeNotification} />
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Perpustakaan Digital</h2>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center"
                >
                    <Icon name="plus" size={20} className="mr-2" /> Unggah E-Book
                </button>
            </div>

            <CustomModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Unggah E-Book Baru">
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Judul E-Book"
                        value={newEbookTitle}
                        onChange={(e) => setNewEbookTitle(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="flex space-x-2 mb-2">
                        <button 
                            onClick={() => setUploadType('type')}
                            className={`px-4 py-2 rounded-lg ${uploadType === 'type' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Ketik Konten
                        </button>
                        <button 
                            onClick={() => setUploadType('upload')}
                            className={`px-4 py-2 rounded-lg ${uploadType === 'upload' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            Unggah File (.txt, .md)
                        </button>
                    </div>

                    {uploadType === 'type' && (
                        <textarea
                            placeholder="Ketik konten e-book di sini..."
                            value={newEbookContent}
                            onChange={(e) => setNewEbookContent(e.target.value)}
                            rows="8"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    )}
                    {uploadType === 'upload' && (
                         <input
                            type="file"
                            accept=".txt,.md"
                            onChange={handleFileUpload}
                            className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                    )}
                   
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setShowUploadModal(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleUploadEbook}
                            disabled={loading}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                        >
                            {loading ? "Mengunggah..." : "Unggah"}
                        </button>
                    </div>
                </div>
            </CustomModal>

            <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-700 mb-4">E-Book Saya</h3>
                {myEbooks.length === 0 ? (
                    <p className="text-gray-500">Anda belum mengunggah e-book.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myEbooks.map(ebook => (
                            <div key={ebook.id} className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                                <h4 className="text-lg font-semibold text-purple-700 mb-2">{ebook.title}</h4>
                                <p className="text-xs text-gray-500 mb-1">Oleh: {ebook.authorEmail}</p>
                                <p className="text-xs text-gray-500 mb-3">Diunggah: {ebook.createdAt ? new Date(ebook.createdAt.toDate()).toLocaleDateString('id-ID') : '-'}</p>
                                <p className="text-sm text-gray-600 mb-3 truncate">{ebook.content.substring(0,100)}...</p>
                                <div className="flex space-x-2">
                                    <button onClick={() => viewEbook(ebook)} className="text-sm bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded-md transition-colors flex items-center"><Icon name="view" size={16} className="mr-1"/> Baca</button>
                                     {userId === ebook.authorId && (
                                        <button onClick={() => deleteEbook(ebook.id)} disabled={loading} className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md transition-colors flex items-center disabled:bg-gray-300"><Icon name="delete" size={16} className="mr-1"/> Hapus</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-4">E-Book Komunitas</h3>
                 {communityEbooks.length === 0 ? (
                    <p className="text-gray-500">Belum ada e-book dari komunitas.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communityEbooks.map(ebook => (
                             <div key={ebook.id} className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                                <h4 className="text-lg font-semibold text-purple-700 mb-2">{ebook.title}</h4>
                                <p className="text-xs text-gray-500 mb-1">Oleh: {ebook.authorEmail}</p>
                                <p className="text-xs text-gray-500 mb-3">Diunggah: {ebook.createdAt ? new Date(ebook.createdAt.toDate()).toLocaleDateString('id-ID') : '-'}</p>
                                <p className="text-sm text-gray-600 mb-3 truncate">{ebook.content.substring(0,100)}...</p>
                                <button onClick={() => viewEbook(ebook)} className="text-sm bg-purple-500 hover:bg-purple-600 text-white py-1 px-3 rounded-md transition-colors flex items-center"><Icon name="view" size={16} className="mr-1"/> Baca</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


// Komponen Chat (Placeholder)
const ChatPage = ({ user }) => {
    const [currentChatId, setCurrentChatId] = useState(null); // ID user yang diajak chat
    const [chatUsers, setChatUsers] = useState([]); // Daftar user yang bisa diajak chat
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [userId, setUserId] = useState(user?.uid);
    const [searchTerm, setSearchTerm] = useState('');
    const [allUsers, setAllUsers] = useState([]); // Semua user di sistem

    useEffect(() => {
        if (user?.uid) {
            setUserId(user.uid);
        }
    }, [user]);

    const usersCollectionPath = `artifacts/${appId}/public/data/users`; // Simpan info user publik
    const chatsCollectionPathPrefix = `artifacts/${appId}/public/data/chats`; // Path untuk chat

    // Fetch all users for chat list (simplified)
    useEffect(() => {
        const q = query(collection(db, usersCollectionPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(u => u.id !== userId); // Jangan tampilkan diri sendiri
            setAllUsers(usersList);
            setChatUsers(usersList); // Awalnya tampilkan semua
        }, (error) => console.error("Error fetching users:", error));
        return unsubscribe;
    }, [userId, usersCollectionPath]);

    // Function to create/get chat ID
    const getChatId = (user1, user2) => {
        return [user1, user2].sort().join('_');
    };

    // Fetch messages when a chat is selected
    useEffect(() => {
        if (!currentChatId || !userId) {
            setMessages([]);
            return;
        }
        const chatId = getChatId(userId, currentChatId);
        const messagesPath = `${chatsCollectionPathPrefix}/${chatId}/messages`;
        
        const q = query(collection(db, messagesPath)); // Urutkan berdasarkan timestamp ascending
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            msgs.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate()); // Urutkan di client
            setMessages(msgs);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setNotification({ message: "Gagal memuat pesan.", type: "error" });
        });
        return unsubscribe;

    }, [currentChatId, userId, chatsCollectionPathPrefix]);
    
    // Menyimpan informasi user ke Firestore saat registrasi atau login (jika belum ada)
    const storeUserPublicInfo = useCallback(async (currentUser) => {
        if (!currentUser) return;
        const userRef = doc(db, usersCollectionPath, currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            try {
                await setDoc(userRef, {
                    email: currentUser.email,
                    displayName: currentUser.displayName || currentUser.email.split('@')[0], // Default display name
                    photoURL: currentUser.photoURL || '', // Default photo URL
                    lastSeen: Timestamp.now()
                });
                console.log("User info stored/updated:", currentUser.uid);
            } catch (error) {
                console.error("Error storing user info:", error);
            }
        } else {
             // Optionally update lastSeen on login
            try {
                await updateDoc(userRef, { lastSeen: Timestamp.now() });
            } catch (error) {
                console.error("Error updating last seen:", error);
            }
        }
    }, [usersCollectionPath]);

    useEffect(() => {
        if (user) {
            storeUserPublicInfo(user);
        }
    }, [user, storeUserPublicInfo]);


    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentChatId || !userId) return;
        setLoading(true);
        const chatId = getChatId(userId, currentChatId);
        const messagesPath = `${chatsCollectionPathPrefix}/${chatId}/messages`;
        try {
            await addDoc(collection(db, messagesPath), {
                text: newMessage,
                senderId: userId,
                receiverId: currentChatId,
                timestamp: Timestamp.now()
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            setNotification({ message: "Gagal mengirim pesan.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleSearchUser = (term) => {
        setSearchTerm(term);
        if (!term.trim()) {
            setChatUsers(allUsers);
        } else {
            setChatUsers(allUsers.filter(u => 
                u.email?.toLowerCase().includes(term.toLowerCase()) || 
                u.displayName?.toLowerCase().includes(term.toLowerCase())
            ));
        }
    };
    
    const closeNotification = () => setNotification({ message: '', type: '' });
    const selectedChatUser = allUsers.find(u => u.id === currentChatId);


    return (
        <div className="container mx-auto p-0 pt-16 md:pt-20 h-screen flex flex-col md:flex-row">
            <CustomNotification message={notification.message} type={notification.type} onClose={closeNotification} />
            {/* Sidebar Daftar Chat */}
            <div className="w-full md:w-1/3 lg:w-1/4 bg-gray-100 border-r border-gray-300 flex flex-col">
                <div className="p-4 border-b border-gray-300">
                    <h2 className="text-xl font-semibold text-gray-800">Obrolan</h2>
                    <input 
                        type="text"
                        placeholder="Cari pengguna..."
                        value={searchTerm}
                        onChange={(e) => handleSearchUser(e.target.value)}
                        className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <div className="overflow-y-auto flex-grow">
                    {chatUsers.length === 0 && <p className="p-4 text-gray-500">Tidak ada pengguna ditemukan.</p>}
                    {chatUsers.map(chatUser => (
                        <div
                            key={chatUser.id}
                            onClick={() => setCurrentChatId(chatUser.id)}
                            className={`p-4 hover:bg-gray-200 cursor-pointer border-b border-gray-200 ${currentChatId === chatUser.id ? 'bg-purple-100' : ''}`}
                        >
                            <p className="font-semibold text-gray-700">{chatUser.displayName || chatUser.email}</p>
                            <p className="text-xs text-gray-500">{chatUser.email}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Area Chat Utama */}
            <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col bg-white">
                {currentChatId && selectedChatUser ? (
                    <>
                        <div className="p-4 border-b border-gray-300 bg-gray-50">
                            <h3 className="text-lg font-semibold text-purple-700">{selectedChatUser.displayName || selectedChatUser.email}</h3>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-50">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${msg.senderId === userId ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        <p>{msg.text}</p>
                                        <p className={`text-xs mt-1 ${msg.senderId === userId ? 'text-purple-200' : 'text-gray-500'} text-right`}>
                                            {msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-300 bg-gray-100">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ketik pesanmu..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={loading || !newMessage.trim()}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold p-3 rounded-lg transition-colors disabled:bg-gray-400"
                                >
                                    <Icon name="send" size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-gray-500">
                        <p>Pilih pengguna untuk memulai obrolan.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// Komponen Fitur AI (Placeholder)
const AIFeaturesPage = ({ user }) => {
    const [feature, setFeature] = useState('question'); // 'question', 'summary', 'recommendation'
    const [inputText, setInputText] = useState('');
    const [generatedOutput, setGeneratedOutput] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    const handleGenerate = async () => {
        if (!inputText.trim()) {
            setNotification({ message: "Teks masukan tidak boleh kosong.", type: "warning" });
            return;
        }
        setLoading(true);
        setGeneratedOutput('');
        let prompt = "";
        let modelName = "gemini-2.0-flash"; // Default model

        switch (feature) {
            case 'question':
                prompt = `Buatkan beberapa soal pilihan ganda (3-5 soal) beserta kunci jawabannya berdasarkan materi berikut:\n\n${inputText}\n\nFormat jawaban:\nSoal 1: ...\na. ...\nb. ...\nc. ...\nd. ...\nKunci Jawaban: [Huruf pilihan]\n\nSoal 2: ...`;
                break;
            case 'summary':
                prompt = `Buatkan ringkasan singkat dan poin-poin penting dari materi berikut (maksimal 150 kata):\n\n${inputText}`;
                break;
            case 'recommendation':
                prompt = `Berdasarkan minat pada topik "${inputText}", berikan 3 rekomendasi bacaan (buku, artikel, atau sumber online lainnya) yang relevan beserta deskripsi singkatnya.`;
                break;
            default:
                setLoading(false);
                return;
        }

        try {
            const apiKey = ""; // API Key akan diurus oleh environment jika kosong
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setGeneratedOutput(text);
                setNotification({ message: "Konten berhasil dibuat!", type: "success" });
            } else {
                setGeneratedOutput("Tidak ada konten yang dihasilkan atau format respons tidak sesuai.");
                setNotification({ message: "Gagal memproses permintaan.", type: "error" });
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setGeneratedOutput(`Terjadi kesalahan: ${error.message}`);
            setNotification({ message: `Terjadi kesalahan: ${error.message}`, type: "error" });
        } finally {
            setLoading(false);
        }
    };
    
    const closeNotification = () => setNotification({ message: '', type: '' });

    return (
        <div className="container mx-auto p-4 pt-20 md:pt-24 max-w-3xl">
            <CustomNotification message={notification.message} type={notification.type} onClose={closeNotification} />
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Fitur AI Eduku ✨</h2>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Pilih Fitur AI:</label>
                    <select
                        value={feature}
                        onChange={(e) => { setFeature(e.target.value); setInputText(''); setGeneratedOutput('');}}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    >
                        <option value="question">Buat Soal Otomatis</option>
                        <option value="summary">Ringkas Materi</option>
                        <option value="recommendation">Rekomendasi Bacaan</option>
                    </select>
                </div>

                <div className="mb-6">
                    <label htmlFor="inputText" className="block text-gray-700 text-sm font-semibold mb-2">
                        {feature === 'question' && "Masukkan materi pelajaran:"}
                        {feature === 'summary' && "Masukkan teks materi yang ingin diringkas:"}
                        {feature === 'recommendation' && "Masukkan topik atau minat bacaan:"}
                    </label>
                    <textarea
                        id="inputText"
                        rows="8"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={
                            feature === 'question' ? "Contoh: Fotosintesis adalah proses pembuatan makanan pada tumbuhan hijau..." :
                            feature === 'summary' ? "Salin dan tempel teks panjang di sini..." :
                            "Contoh: Sejarah Peradaban Kuno, Pemrograman Python, Fisika Kuantum"
                        }
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-150 ease-in-out disabled:bg-gray-400 flex items-center justify-center"
                >
                    <Icon name="ai" size={20} className="mr-2"/>
                    {loading ? 'Memproses...' : 
                     (feature === 'question' ? 'Buat Soal' : 
                      feature === 'summary' ? 'Ringkas Sekarang' : 'Dapatkan Rekomendasi')}
                </button>

                {generatedOutput && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">Hasil:</h4>
                        <pre className="whitespace-pre-wrap text-gray-600 text-sm leading-relaxed">{generatedOutput}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};


// Komponen Navbar
const Navbar = ({ user, onLogout, currentPage, setCurrentPage }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navItems = [
        { name: 'Beranda', page: 'feed', icon: 'feed' },
        { name: 'Perpustakaan', page: 'library', icon: 'library' },
        { name: 'Chat', page: 'chat', icon: 'chat' },
        { name: 'Fitur AI', page: 'ai', icon: 'ai' },
    ];

    return (
        <nav className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4 shadow-md fixed w-full top-0 z-30">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-2xl font-bold cursor-pointer" onClick={() => setCurrentPage('feed')}>
                    Eduku 📚✨
                </div>
                {/* Desktop Menu */}
                <div className="hidden md:flex space-x-2 items-center">
                    {navItems.map(item => (
                        <button
                            key={item.page}
                            onClick={() => { setCurrentPage(item.page); setIsMobileMenuOpen(false); }}
                            className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${currentPage === item.page ? 'bg-purple-700 ring-2 ring-purple-300' : ''} flex items-center space-x-1`}
                        >
                            <Icon name={item.icon} size={18} />
                            <span>{item.name}</span>
                        </button>
                    ))}
                     {user && (
                        <button
                            onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                            className="px-3 py-2 rounded-md text-sm font-medium bg-red-500 hover:bg-red-600 transition-colors flex items-center space-x-1"
                        >
                            <Icon name="logout" size={18} />
                            <span>Logout</span>
                        </button>
                    )}
                </div>
                 {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="focus:outline-none p-2 rounded-md hover:bg-purple-700">
                        {isMobileMenuOpen ? <Icon name="close" size={28}/> : <Icon name="menu" size={28}/>}
                    </button>
                </div>
            </div>
            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-purple-600 shadow-lg rounded-b-md">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map(item => (
                            <button
                                key={item.page}
                                onClick={() => { setCurrentPage(item.page); setIsMobileMenuOpen(false); }}
                                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-purple-700 transition-colors ${currentPage === item.page ? 'bg-purple-700' : ''} flex items-center space-x-2`}
                            >
                                <Icon name={item.icon} size={20} />
                                <span>{item.name}</span>
                            </button>
                        ))}
                        {user && (
                            <button
                                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-red-500 hover:bg-red-600 transition-colors mt-2 flex items-center space-x-2"
                            >
                                <Icon name="logout" size={20} />
                                <span>Logout</span>
                            </button>
                        )}
                    </div>
                     {user && (
                        <div className="px-4 py-3 border-t border-purple-500">
                            <p className="text-sm">Login sebagai: {user.email}</p>
                            <p className="text-xs">UID: {user.uid}</p>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};


// Komponen Utama Aplikasi
function App() {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentPage, setCurrentPage] = useState('feed'); // 'auth', 'feed', 'library', 'chat', 'ai'
    const [notification, setNotification] = useState({ message: '', type: '' });
    
    // Firebase Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setCurrentPage(currentPage === 'auth' ? 'feed' : currentPage); // Jika masih di auth, pindah ke feed
                 // Store user info (jika belum ada)
                const usersCollectionPath = `artifacts/${appId}/public/data/users`;
                const userRef = doc(db, usersCollectionPath, currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                    try {
                        await setDoc(userRef, {
                            email: currentUser.email,
                            displayName: currentUser.displayName || currentUser.email.split('@')[0],
                            photoURL: currentUser.photoURL || '',
                            createdAt: Timestamp.now(),
                            lastSeen: Timestamp.now()
                        });
                    } catch (error) {
                        console.error("Error storing user info on auth change:", error);
                    }
                } else {
                     try {
                        await updateDoc(userRef, { lastSeen: Timestamp.now() });
                    } catch (error) {
                        console.error("Error updating last seen on auth change:", error);
                    }
                }

            } else {
                setUser(null);
                setCurrentPage('auth'); // Jika logout, arahkan ke halaman auth
            }
            setIsAuthReady(true); // Tandai bahwa status auth sudah siap
        });

        // Coba login dengan custom token jika ada
        const attemptCustomTokenLogin = async () => {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                try {
                    await signInWithCustomToken(auth, __initial_auth_token);
                    console.log("Signed in with custom token.");
                } catch (error) {
                    console.error("Custom token sign-in failed, trying anonymous:", error);
                    await signInAnonymously(auth); // Fallback ke anonymous jika custom token gagal
                }
            } else if (!auth.currentUser) { // Hanya sign in anonymously jika tidak ada token dan tidak ada user
                 try {
                    await signInAnonymously(auth);
                    console.log("Signed in anonymously.");
                } catch (error) {
                    console.error("Anonymous sign-in failed:", error);
                }
            }
            // onAuthStateChanged akan menangani setUser dan setIsAuthReady
        };

        attemptCustomTokenLogin();
        return () => unsubscribe(); // Cleanup listener
    }, [currentPage]);


    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setCurrentPage('auth');
            setNotification({ message: "Logout berhasil.", type: 'success' });
        } catch (error) {
            console.error("Logout error:", error);
            setNotification({ message: "Gagal logout.", type: 'error' });
        }
    };
    
    const closeNotification = () => setNotification({ message: '', type: '' });

    if (!isAuthReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-purple-600 text-xl">Memuat Aplikasi Eduku...</div>
                {/* Bisa tambahkan spinner di sini */}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <CustomNotification message={notification.message} type={notification.type} onClose={closeNotification} />
            {user && <Navbar user={user} onLogout={handleLogout} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
            
            <main className={user ? "pt-16" : ""}> {/* Add padding top if navbar is present */}
                {currentPage === 'auth' && <AuthPage onAuthSuccess={() => setCurrentPage('feed')} />}
                {currentPage === 'feed' && user && <FeedPage user={user} />}
                {currentPage === 'library' && user && <LibraryPage user={user} />}
                {currentPage === 'chat' && user && <ChatPage user={user} />}
                {currentPage === 'ai' && user && <AIFeaturesPage user={user} />}
            </main>
            {user && (
                 <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white text-xs text-center p-2 z-20">
                    Eduku App | User ID: {user.uid} | App ID: {appId}
                </footer>
            )}
        </div>
    );
}

export default App;

