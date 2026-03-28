import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { RoomListing, UserProfile } from '../types';
import { CheckCircleIcon, XIcon, UserCircleIcon, PlusIcon } from './icons/Icons';
import ListRoomModal from './ListRoomModal';

interface AdminPanelProps {
    onClose: () => void;
}

type AdminView = 'dashboard' | 'listings' | 'users';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const [view, setView] = useState<AdminView>('dashboard');
    
    const [listings, setListings] = useState<RoomListing[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState({ listings: true, users: true });
    const [error, setError] = useState<string | null>(null);

    const [editingRoom, setEditingRoom] = useState<RoomListing | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all');

    const fetchAllData = async () => {
        setLoading({ listings: true, users: true });
        setError(null);
        try {
            // Fetch listings
            const listingsSnapshot = await db.collection('rooms').orderBy('listedDate', 'desc').get();
            const listingsData = listingsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                listedDate: doc.data().listedDate?.toDate ? doc.data().listedDate.toDate() : new Date(),
            } as RoomListing));
            setListings(listingsData);

            // Fetch users
            const usersSnapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
            const usersData = usersSnapshot.docs.map(doc => ({
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
            } as UserProfile));
            setUsers(usersData);

        } catch (err: any) {
            setError(err.message || "Failed to fetch data.");
        } finally {
            setLoading({ listings: false, users: false });
        }
    };
    
    useEffect(() => {
        fetchAllData();
    }, []);

    const handleVerify = async (id: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        try {
            await db.collection('rooms').doc(id).update({ isVerified: newStatus });
            setListings(prev => prev.map(room => room.id === id ? { ...room, isVerified: newStatus } : room));
        } catch (err) {
            alert("Failed to update verification status.");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            try {
                await db.collection('rooms').doc(id).delete();
                setListings(prev => prev.filter(room => room.id !== id));
            } catch (err) {
                alert("Failed to delete the listing.");
            }
        }
    };

    const handleRoomUpdated = (updatedRoom: RoomListing) => {
        setListings(prev => prev.map(r => (r.id === updatedRoom.id ? updatedRoom : r)));
        setEditingRoom(null);
    };

    const filteredListings = useMemo(() => {
        return listings
            .filter(room => {
                if (filterStatus === 'verified') return room.isVerified;
                if (filterStatus === 'unverified') return !room.isVerified;
                return true;
            })
            .filter(room => 
                room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.address.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [listings, searchTerm, filterStatus]);

    const stats = useMemo(() => ({
        totalListings: listings.length,
        verifiedListings: listings.filter(r => r.isVerified).length,
        unverifiedListings: listings.filter(r => !r.isVerified).length,
        totalUsers: users.length,
    }), [listings, users]);

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Listings" value={stats.totalListings} icon={<CheckCircleIcon className="w-6 h-6 text-indigo-500" />} />
                        <StatCard title="Verified Listings" value={stats.verifiedListings} icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />} />
                        <StatCard title="Unverified Listings" value={stats.unverifiedListings} icon={<XIcon className="w-6 h-6 text-red-500" />} />
                        <StatCard title="Total Users" value={stats.totalUsers} icon={<UserCircleIcon className="w-6 h-6 text-blue-500" />} />
                    </div>
                );
            case 'listings':
                return (
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
                        <div className="p-4 border-b dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
                            <input
                                type="text"
                                placeholder="Search listings..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full md:w-1/3 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <select 
                                value={filterStatus} 
                                onChange={e => setFilterStatus(e.target.value as any)}
                                className="w-full md:w-auto border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="all">All Status</option>
                                <option value="verified">Verified</option>
                                <option value="unverified">Unverified</option>
                            </select>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Title</th>
                                        <th scope="col" className="px-6 py-3">City</th>
                                        <th scope="col" className="px-6 py-3">Status</th>
                                        <th scope="col" className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading.listings ? <tr><td colSpan={4} className="text-center p-4">Loading...</td></tr> : filteredListings.map(room => (
                                        <tr key={room.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{room.title}</td>
                                            <td className="px-6 py-4">{room.city}</td>
                                            <td className="px-6 py-4">{room.isVerified ? 'Verified' : 'Unverified'}</td>
                                            <td className="px-6 py-4 space-x-2">
                                                <button onClick={() => setEditingRoom(room)} className="font-medium text-indigo-600 dark:text-indigo-500 hover:underline">Edit</button>
                                                <button onClick={() => handleVerify(room.id, room.isVerified)} className="font-medium text-yellow-600 dark:text-yellow-500 hover:underline">{room.isVerified ? 'Un-verify' : 'Verify'}</button>
                                                <button onClick={() => handleDelete(room.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'users':
                return (
                     <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                         <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Email</th>
                                    <th scope="col" className="px-6 py-3">Role</th>
                                    <th scope="col" className="px-6 py-3">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading.users ? <tr><td colSpan={4} className="text-center p-4">Loading...</td></tr> : users.map(user => (
                                    <tr key={user.uid} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.name}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>{user.role}</span></td>
                                        <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                         </table>
                     </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 z-50 flex font-sans">
            <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0 flex flex-col">
                <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Menu</h2>
                </div>
                <nav className="flex-grow p-4 space-y-2">
                    <button onClick={() => setView('dashboard')} className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${view === 'dashboard' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Dashboard</button>
                    <button onClick={() => setView('listings')} className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${view === 'listings' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Listings</button>
                    <button onClick={() => setView('users')} className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${view === 'users' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Users</button>
                </nav>
                <div className="p-4 border-t dark:border-gray-700">
                    <button onClick={onClose} className="w-full px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                        Back to Site
                    </button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                {error ? <p className="text-red-500">{error}</p> : renderView()}
            </main>
             {editingRoom && (
                <ListRoomModal
                    onClose={() => setEditingRoom(null)}
                    onRoomCreated={() => {}} // Not used in edit mode
                    onRoomUpdated={handleRoomUpdated}
                    userProfile={null} // Admin doesn't need a profile for this action
                    initialCountry={editingRoom.country}
                    roomToEdit={editingRoom}
                />
            )}
        </div>
    );
};

export default AdminPanel;