import React from 'react';
import { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const alignment = isOwnMessage ? 'items-end' : 'items-start';
  const bubbleColor = isOwnMessage
    ? 'bg-indigo-600 text-white'
    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';

  const timestamp = message.timestamp?.toDate ? message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`w-full flex flex-col ${alignment}`}>
      <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${bubbleColor}`}>
        <p className="text-sm">{message.text}</p>
      </div>
      <p className="text-xs text-gray-400 mt-1 px-1">{timestamp}</p>
    </div>
  );
};

export default MessageBubble;
