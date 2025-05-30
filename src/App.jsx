import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import LibraryPage from './pages/LibraryPage';
import ChatPage from './pages/ChatPage';
import AIFeaturesPage from './pages/AIFeaturesPage';
import Navbar from './layout/Navbar';
import { auth, db } from './firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import CustomNotification from './components/CustomNotification';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'eduku-app-default';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState('feed');
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setCurrentPage(currentPage === 'auth' ? 'feed' : currentPage);

        const userRef = doc(db, `artifacts/${appId}/public/data/users`, currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            createdAt: Timestamp.now(),
            lastSeen: Timestamp.now()
          });
        } else {
          await updateDoc(userRef, { lastSeen: Timestamp.now() });
        }
      } else {
        setUser(null);
        setCurrentPage('auth');
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [currentPage]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentPage('auth');
      setNotification({ message: 'Logout berhasil.', type: 'success' });
    } catch (error) {
      console.error('Logout error:', error);
      setNotification({ message: 'Gagal logout.', type: 'error' });
    }
  };

  const closeNotification = () => setNotification({ message: '', type: '' });

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-purple-600 text-xl">Memuat Aplikasi Eduku...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <CustomNotification message={notification.message} type={notification.type} onClose={closeNotification} />
      {user && <Navbar user={user} onLogout={handleLogout} currentPage={currentPage} setCurrentPage={setCurrentPage} />}
      <main className={user ? 'pt-16' : ''}>
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
