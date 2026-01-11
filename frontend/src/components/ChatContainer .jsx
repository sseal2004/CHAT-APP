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

  // ✅ Track failed audio messages
  const [failedAudio, setFailedAudio] = useState({});

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
        {messages.map((message) => {
          const isMyMessage = message.senderId === authUser._id;

          return (
            <div
              key={message._id}
              className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isMyMessage
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>

              <div className="chat-header mb-1 flex items-center gap-2">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>

                {/* ✅ TICK STATUS (ONLY FOR MY MESSAGES) */}
                {isMyMessage && (
                  <span
                    className={`text-xs ${
                      message.seen ? "text-blue-500" : "text-gray-400"
                    }`}
                    title={message.seen ? "Seen" : "Delivered"}
                  >
<span className="flex items-center gap-[1px] text-xs select-none">
  {/* First Tick */}
  <span
    className={`leading-none ${
      message.seen ? "text-blue-500" : "text-gray-400"
    }`}
  >
    ✓
  </span>

  {/* Second Tick */}
  <span
    className={`leading-none ${
      message.seen ? "text-blue-500" : "text-transparent"
    }`}
  >
    ✓
  </span>
</span>
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

                {/* ✅ AUDIO WITH FAIL HANDLING */}
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
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
