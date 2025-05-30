// SetupProfilePage.jsx
import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();
const appId = 'eduku-app-default'; // bisa diganti sesuai app kamu

const SetupProfilePage = () => {
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const user = auth.currentUser;

    const handleSave = async () => {
        if (!name || !bio || !user) return alert("Isi semua data dulu!");

        await setDoc(doc(db, `artifacts/${appId}/public/data/users/${user.uid}`), {
            name,
            bio,
            email: user.email,
            uid: user.uid,
        });

        window.location.href = "/";
    };

    return (
        <div className="min-h-screen flex justify-center items-center bg-gray-100">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Lengkapi Profil</h2>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama" className="mb-3 w-full border p-3 rounded-lg" />
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Bio singkat" className="mb-3 w-full border p-3 rounded-lg" />
                <button onClick={handleSave} className="bg-purple-600 text-white px-4 py-2 rounded-lg w-full">Simpan Profil</button>
            </div>
        </div>
    );
};

export default SetupProfilePage;
