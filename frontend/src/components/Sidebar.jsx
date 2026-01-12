import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton ";
import { Users } from "lucide-react";
import { AI_USER } from "../constants/aiUser";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = [AI_USER, ...users]
    .filter((user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((user) =>
      showOnlineOnly ? onlineUsers.includes(user._id) || user.isAI : true
    );

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside
      className={`h-full w-full lg:w-72 bg-base-100 border-r border-base-300
      flex flex-col transition-all duration-200
      ${selectedUser ? "max-md:hidden" : ""}`}
    >
      {/* Header */}
      <div className="border-b border-base-300 w-full px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="size-5" />
          <span className="font-semibold text-lg">Contacts</span>
        </div>

        <div className="relative mt-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z"
            />
          </svg>

          <input
            type="text"
            placeholder="Search User..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              input input-sm w-full
              pl-9
              font-semibold
              border-2 border-primary/60
              focus:border-primary
              focus:outline-none
              focus:ring-0
            "
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-xs"
            />
            <span className="text-sm">Online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1})
          </span>
        </div>
      </div>

      {/* Users */}
      <div className="overflow-y-auto w-full py-2">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full px-4 py-3 flex items-center gap-3
              hover:bg-base-200 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-300" : ""}
            `}
          >
            <div className="relative">
              <img
                src={
                  user.isAI
                    ? "https://cdn-icons-png.flaticon.com/512/4712/4712109.png"
                    : user.profilePic || "/frontend/public/avatar.png"
                }
                alt={user.fullName}
                className="size-11 object-cover rounded-full"
              />
              {(onlineUsers.includes(user._id) || user.isAI) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>

            {/* TEXT AREA */}
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">
                  {user.fullName}
                </span>

                {user.isAI && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                    AI
                  </span>
                )}
              </div>

              <div className="text-sm sm:text-[13px] text-zinc-400 mt-0.5">
                {user.isAI
                  ? "AI Assistant"
                  : onlineUsers.includes(user._id)
                  ? "Online"
                  : "Offline"}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            No users found
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
