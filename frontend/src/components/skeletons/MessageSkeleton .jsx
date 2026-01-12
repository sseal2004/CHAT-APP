const MessageSkeleton = ({ isAI = false }) => {
  const skeletonMessages = Array(6).fill(null);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {skeletonMessages.map((_, idx) => {
        // 👉 AI always left, users alternate
        const alignment = isAI
          ? "chat-start"
          : idx % 2 === 0
          ? "chat-start"
          : "chat-end";

        return (
          <div key={idx} className={`chat ${alignment}`}>
            {/* Avatar */}
            <div className="chat-image avatar">
              <div className="size-10 rounded-full">
                <div className="skeleton w-full h-full rounded-full" />
              </div>
            </div>

            {/* Header (AI label or time placeholder) */}
            <div className="chat-header mb-1 flex items-center gap-2">
              {isAI ? (
                <div className="skeleton h-3 w-14 rounded" /> // 🤖 AI label
              ) : (
                <div className="skeleton h-3 w-10 rounded" /> // time
              )}
            </div>

            {/* Message Bubble */}
            <div className="chat-bubble bg-transparent p-0">
              <div
                className={`skeleton rounded-xl ${
                  idx % 2 === 0
                    ? "h-12 w-[220px]"
                    : "h-16 w-[260px]"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageSkeleton;
