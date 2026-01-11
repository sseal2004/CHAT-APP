import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // =========================
  // CHECK AUTH
  // =========================
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check", {
        withCredentials: true,
      });

      console.log("✅ checkAuth success:", res.data);

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.error("❌ checkAuth error:", {
        message: error.message,
        response: error.response?.data,
      });

      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // =========================
  // SIGNUP
  // =========================
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data, {
        withCredentials: true,
      });

      console.log("✅ signup success:", res.data);

      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      console.error("❌ signup error:", {
        message: error.message,
        response: error.response?.data,
      });

      toast.error(
        error.response?.data?.message || "Signup failed. Try again."
      );
    } finally {
      set({ isSigningUp: false });
    }
  },

  // =========================
  // LOGIN
  // =========================
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data, {
        withCredentials: true,
      });

      console.log("✅ login success:", res.data);

      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      console.error("❌ login error:", {
        message: error.message,
        response: error.response?.data,
      });

      toast.error(
        error.response?.data?.message || "Login failed. Check credentials."
      );
    } finally {
      set({ isLoggingIn: false });
    }
  },

  // =========================
  // LOGOUT
  // =========================
  logout: async () => {
    try {
      await axiosInstance.post(
        "/auth/logout",
        {},
        { withCredentials: true }
      );

      console.log("✅ logout success");

      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      console.error("❌ logout error:", {
        message: error.message,
        response: error.response?.data,
      });

      toast.error(
        error.response?.data?.message || "Logout failed."
      );
    }
  },

  // =========================
  // UPDATE PROFILE
  // =========================
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put(
        "/auth/update-profile",
        data,
        { withCredentials: true }
      );

      console.log("✅ updateProfile success:", res.data);

      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("❌ updateProfile error:", {
        message: error.message,
        response: error.response?.data,
      });

      toast.error(
        error.response?.data?.message || "Profile update failed."
      );
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // =========================
  // SOCKET CONNECT
  // =========================
  connectSocket: () => {
    const { authUser, socket } = get();

    if (!authUser) {
      console.warn("⚠️ connectSocket aborted: no authUser");
      return;
    }

    if (socket?.connected) {
      console.warn("⚠️ socket already connected");
      return;
    }

    console.log("🔌 Connecting socket for user:", authUser._id);

    const newSocket = io(BASE_URL, {
      query: { userId: authUser._id },
      withCredentials: true,
      transports: ["websocket"],
    });

    newSocket.connect();

    newSocket.on("connect", () => {
      console.log("🟢 Socket connected:", newSocket.id);
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("👥 Online users:", userIds);
      set({ onlineUsers: userIds });
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    set({ socket: newSocket });
  },

  // =========================
  // SOCKET DISCONNECT
  // =========================
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      console.log("🔌 Disconnecting socket");
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
