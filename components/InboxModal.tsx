import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import { Chat } from '../types';
import { XIcon } from './icons/Icons';

interface InboxModalProps {
  currentUser: firebase.User;
  onClose: () => void;
  onSelectChat: (chat: Chat) => void;
}

const InboxModal: React.FC<InboxModalProps> = ({ currentUser, onClose, onSelectChat }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chatsRef = db.collection('chats')
      .where('participantIds', 'array-contains', currentUser.uid)
      .orderBy('lastMessageTimestamp', 'desc');

    const unsubscribe = chatsRef.onSnapshot(snapshot => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      setChats(chatsData);
      setLoading(false);
    }, error => {
      console.error("Error fetching chats:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser.uid]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md h-[80vh] flex flex-col relative animate-fade-in-up">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Inbox</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white" aria-label="Close Inbox">
            <XIcon />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading conversations...</div>
          ) : chats.length === 0 ? (
            <div className="p-6 text-center text-gray-500">You have no messages.</div>
          ) : (
            <ul>
              {chats.map(chat => {
                const otherParticipantId = chat.participantIds.find(id => id !== currentUser.uid)!;
                const otherParticipantInfo = chat.participantInfo[otherParticipantId];
                const lastMessageDate = chat.lastMessageTimestamp?.toDate ? chat.lastMessageTimestamp.toDate().toLocaleDateString() : '';
                const unreadCount = chat.unreadCount?.[currentUser.uid] || 0;

                return (
                  <li key={chat.id} onClick={() => onSelectChat(chat)} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                    <div className="p-4 flex items-center space-x-4">
                      <div className="relative flex-shrink-0">
                         <img src={otherParticipantInfo.photoURL || `https://ui-avatars.com/api/?name=${otherParticipantInfo.name}&background=random`} alt={otherParticipantInfo.name} className="h-12 w-12 rounded-full object-cover" />
                         {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white ring-2 ring-white dark:ring-gray-800">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                         )}
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <div className="flex justify-between items-baseline">
                           <p className="font-semibold text-gray-800 dark:text-white truncate">{otherParticipantInfo.name}</p>
                           <p className="text-xs text-gray-400 flex-shrink-0">{lastMessageDate}</p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">RE: {chat.listingTitle}</p>
                        <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{chat.lastMessage}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxModal;