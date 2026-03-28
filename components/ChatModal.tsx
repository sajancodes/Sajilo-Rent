import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import firebase from 'firebase/compat/app';
import { Chat, ChatMessage } from '../types';
import { XIcon, SendIcon } from './icons/Icons';
import MessageBubble from './MessageBubble';

interface ChatModalProps {
  chat: Chat;
  currentUser: firebase.User;
  onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ chat, currentUser, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherParticipantId = chat.participantIds.find(id => id !== currentUser.uid)!;
  const otherParticipantInfo = chat.participantInfo[otherParticipantId];

  useEffect(() => {
    const messagesRef = db.collection('chats').doc(chat.id).collection('messages').orderBy('timestamp', 'asc');
    
    const unsubscribe = messagesRef.onSnapshot(snapshot => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(messagesData);
      setLoading(false);
    }, error => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    // Reset unread count for the current user when they open the chat
    const chatRef = db.collection('chats').doc(chat.id);
    chatRef.get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data?.unreadCount?.[currentUser.uid] > 0) {
                chatRef.update({
                    [`unreadCount.${currentUser.uid}`]: 0
                });
            }
        }
    });


    return () => unsubscribe();
  }, [chat.id, currentUser.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const trimmedMessage = newMessage.trim();
    setNewMessage('');

    const messagePayload: Omit<ChatMessage, 'id'> = {
      senderId: currentUser.uid,
      text: trimmedMessage,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      isRead: false,
    };
    
    const chatRef = db.collection('chats').doc(chat.id);
    const messagesRef = chatRef.collection('messages');
    const newMessageRef = messagesRef.doc(); // Generate ID client-side for transaction

    try {
        await db.runTransaction(async (transaction) => {
            const chatDoc = await transaction.get(chatRef);
            if (!chatDoc.exists) throw new Error("Chat document not found!");

            const chatData = chatDoc.data()!;
            const currentUnreadCount = chatData.unreadCount?.[otherParticipantId] || 0;
            
            // Write 1: Update chat doc
            transaction.update(chatRef, {
                lastMessage: trimmedMessage,
                lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
                [`unreadCount.${otherParticipantId}`]: currentUnreadCount + 1,
            });

            // Write 2: Create new message doc
            transaction.set(newMessageRef, messagePayload);
        });
    } catch (error) {
        console.error("Error sending message in transaction:", error);
        alert("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col relative animate-fade-in-up">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-3">
            <img src={otherParticipantInfo.photoURL || `https://ui-avatars.com/api/?name=${otherParticipantInfo.name}&background=random`} alt={otherParticipantInfo.name} className="h-10 w-10 rounded-full object-cover"/>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white truncate">{otherParticipantInfo.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">RE: {chat.listingTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white" aria-label="Close Chat">
            <XIcon />
          </button>
        </div>

        <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {loading ? (
                <div className="flex justify-center items-center h-full"><p className="text-gray-500">Loading messages...</p></div>
            ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full"><p className="text-gray-500">Start the conversation!</p></div>
            ) : (
                messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.senderId === currentUser.uid} />
                ))
            )}
             <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2"
            />
            <button type="submit" className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors disabled:bg-indigo-300" disabled={!newMessage.trim()}>
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;