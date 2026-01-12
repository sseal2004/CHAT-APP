import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader ";
import MessageInput from "./MessageInput ";
import MessageSkeleton from "./skeletons/MessageSkeleton ";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [failedAudio, setFailedAudio] = useState({});

  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id]);

  // ✅ Reliable auto-scroll (FIXED)
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getDateLabel = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) return "Today";
    if (messageDate.toDateString() === yesterday.toDateString())
      return "Yesterday";

    return messageDate.toLocaleDateString();
  };

  const renderMessages = () => {
    let lastMessageDate = null;

    return messages.map((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      const showDateSeparator = lastMessageDate !== messageDate;
      lastMessageDate = messageDate;

      const isMyMessage = message.senderId === authUser._id;

      return (
        <div key={message._id}>
          {showDateSeparator && (
            <div className="flex justify-center mb-2">
              <span className="bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded-full">
                {getDateLabel(message.createdAt)}
              </span>
            </div>
          )}

          <div className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}>
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    isMyMessage
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile"
                />
              </div>
            </div>

            <div className="chat-header mb-1 flex items-center gap-2">
              <time className="text-xs opacity-50">
                {formatMessageTime(message.createdAt)}
              </time>

              {/* ✅ PERFECT REAL-TIME TICK LOGIC */}
              {isMyMessage && (
                <span
                  className={`text-xs ${
                    message.seen ? "text-blue-500" : "text-gray-400"
                  }`}
                  title={message.seen ? "Seen" : "Delivered"}
                >
                  {message.seen ? "✓✓" : "✓"}
                </span>
              )}
            </div>

            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}

              {message.audio && (
                <>
                  {!failedAudio[message._id] ? (
                    <audio
                      controls
                      src={message.audio}
                      className="max-w-xs mb-2"
                      onError={() =>
                        setFailedAudio((prev) => ({
                          ...prev,
                          [message._id]: true,
                        }))
                      }
                    />
                  ) : (
                    <p className="text-sm text-red-500 italic mb-2">
                      Failed to send voice message
                    </p>
                  )}
                </>
              )}

              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        </div>
      );
    });
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderMessages()}
        {/* ✅ SCROLL ANCHOR */}
        <div ref={messageEndRef} />
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatContainer;
