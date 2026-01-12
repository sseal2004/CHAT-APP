import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  aiMessages: [], // ✅ AI messages stored separately
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Can't get the Users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      if (userId === "ai-chatty") {
        const res = await axiosInstance.get("/ai");
        set({ aiMessages: res.data });
        return;
      }

      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Can't get the messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();

    // 🤖 AI CHAT (backend)
    if (selectedUser?.isAI) {
      try {
        const res = await axiosInstance.post("/ai/send", messageData);
        set((state) => ({
          aiMessages: [...state.aiMessages, ...res.data],
        }));
        return;
      } catch (error) {
        toast.error(error.response?.data?.message || "Can't send the message");
        return;
      }
    }

    // 👤 NORMAL USER CHAT (backend)
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Can't send the message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser || selectedUser.isAI) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    // ✅ DO NOT TOUCH (as requested)
    socket.on("messagesSeen", () => {
      set((state) => ({
        messages: state.messages.map((msg) => ({
          ...msg,
          seen: true,
        })),
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesSeen");
  },

  setSelectedUser: (selectedUser) => {
    // Unsubscribe previous user first
    get().unsubscribeFromMessages();

    const aiMessages = selectedUser?.isAI ? [...get().aiMessages] : [];
    set({
      selectedUser,
      messages: [],
      aiMessages,
    });

    // Subscribe to messages for new user
    if (!selectedUser?.isAI) get().subscribeToMessages();
  },
}));
