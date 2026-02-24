import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../../config/api";

const SOCKET_URL = API_BASE_URL.replace("/api", "");

const toMediaUrl = (value) => {
  if (!value) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(value)) return value;
  return `${SOCKET_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

const getInitials = (value = "") =>
  String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

function AvatarWithPlaceholder({
  src,
  name,
  sizeClass = "w-10 h-10",
  textClass = "text-xs",
}) {
  const [status, setStatus] = useState(src ? "loading" : "fallback");

  useEffect(() => {
    setStatus(src ? "loading" : "fallback");
  }, [src]);

  return (
    <div
      className={`relative ${sizeClass} rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0`}
    >
      {status === "loading" && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
      {src ? (
        <img
          src={src}
          alt={name || "User"}
          loading="lazy"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("fallback")}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
      {status === "fallback" && (
        <span className={`font-semibold text-slate-600 ${textClass}`}>
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="p-3 space-y-3">
      {Array.from({ length: 7 }).map((_, idx) => (
        <div key={`sidebar-skeleton-${idx}`} className="flex items-center gap-3 p-2">
          <div className="w-11 h-11 rounded-full bg-slate-200 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-3 w-2/3 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 7 }).map((_, idx) => {
        const isRight = idx % 2 === 0;
        return (
          <div
            key={`message-skeleton-${idx}`}
            className={`flex ${isRight ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-2xl px-4 py-3 animate-pulse ${
                isRight ? "w-56 bg-blue-100" : "w-64 bg-slate-200"
              }`}
            >
              <div className="h-3 w-4/5 bg-white/70 rounded" />
              <div className="h-3 w-2/5 bg-white/70 rounded mt-2" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminChat() {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [existingChats, setExistingChats] = useState([]); // Chats with history
  const [selectedUser, setSelectedUser] = useState(location.state?.selectedUser || null);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [viewMode, setViewMode] = useState("chats"); // "chats" or "users"

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const token = localStorage.getItem("token");
  const adminUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Initialize socket
  useEffect(() => {
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      // Socket connected
    });

    socketRef.current.on("new-message", (data) => {
      if (data.chatId === chat?._id) {
        setMessages((prev) => {
          // Check if this message already exists (from optimistic update)
          const exists = prev.some(
            (m) => m._id === data.message._id || 
            (m.isTemp && m.content === data.message.content && m.sender._id === data.message.sender._id)
          );
          if (exists) {
            // Replace temp message with real one
            return prev.map((m) =>
              m.isTemp && m.content === data.message.content && m.sender._id === data.message.sender._id
                ? data.message
                : m
            );
          }
          return [...prev, data.message];
        });
        socketRef.current.emit("mark-read", data.chatId);
      }
    });

    socketRef.current.on("user-typing", (data) => {
      if (data.chatId === chat?._id && data.userId !== adminUser._id) {
        setIsTyping(true);
      }
    });

    socketRef.current.on("user-stop-typing", (data) => {
      if (data.chatId === chat?._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, chat?._id, adminUser._id]);

  // Fetch existing chats with history
  const fetchExistingChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      const chatList = data.chats || data || [];
      
      // Deduplicate chats by participant - keep only the most recent chat per user
      const uniqueChats = [];
      const seenParticipants = new Set();
      
      for (const chatItem of chatList) {
        // Format participant from populated participants array
        const participant = chatItem.participant || chatItem.participants?.find(
          (p) => p._id !== adminUser._id
        );
        if (!participant) continue;
        
        const participantId = participant._id;
        if (participantId && !seenParticipants.has(participantId)) {
          seenParticipants.add(participantId);
          uniqueChats.push({ ...chatItem, participant });
        }
      }
      
      setExistingChats(uniqueChats);
    } catch (error) {
      console.error("Error fetching existing chats:", error);
    } finally {
      setLoadingChats(false);
    }
  }, [token, adminUser._id]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
    fetchExistingChats();
  }, [fetchUsers, fetchExistingChats]);

  // Auto-start chat if user was passed via navigation
  useEffect(() => {
    if (location.state?.selectedUser && !chat) {
      startChat(location.state.selectedUser);
    }
  }, [location.state?.selectedUser]);

  // Open existing chat from history
  const openExistingChat = async (chatItem) => {
    setLoadingMessages(true);
    try {
      const chatRes = await fetch(`${API_BASE_URL}/chat/${chatItem._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullChat = await chatRes.json();
      
      setChat(fullChat);
      setMessages(fullChat.messages || []);
      setSelectedUser(chatItem.participant);
      
      // Join chat room
      socketRef.current?.emit("join-chat", chatItem._id);
    } catch (error) {
      console.error("Error opening chat:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Start chat with user
  const startChat = async (user) => {
    setSelectedUser(user);
    setMessages([]);
    setLoadingMessages(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/chat/admin/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user._id }),
      });
      
      const chatData = await res.json();
      setChat(chatData);

      // Fetch existing messages
      const chatRes = await fetch(`${API_BASE_URL}/chat/${chatData._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullChat = await chatRes.json();
      setMessages(fullChat.messages || []);
      
      // Update chat with full data including productContext
      setChat(fullChat);

      // Join chat room
      socketRef.current?.emit("join-chat", chatData._id);
      
      // Refresh existing chats list
      fetchExistingChats();
    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !chat) return;

    setSending(true);
    const content = message;
    setMessage("");

    // Optimistic update with temp flag
    const tempMessage = {
      _id: Date.now().toString(),
      sender: { _id: adminUser._id },
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
      isTemp: true,
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      socketRef.current?.emit("send-message", {
        chatId: chat._id,
        content,
        messageType: "text",
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (!chat) return;
    socketRef.current?.emit("typing", chat._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stop-typing", chat._id);
    }, 2000);
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter users
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter existing chats
  const filteredChats = existingChats.filter(
    (chatItem) =>
      chatItem.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chatItem.participant?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date for chat list
  const formatChatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return formatTime(dateString);
    if (days === 1) return "Yesterday";
    if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const sidebarLoading = viewMode === "chats" ? loadingChats : loadingUsers;

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Admin Support</h2>
          
          {/* Tabs */}
          <div className="flex mb-3 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("chats")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === "chats" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Chats ({existingChats.length})
            </button>
            <button
              onClick={() => setViewMode("users")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === "users" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              All Users
            </button>
          </div>
          
          <input
            type="text"
            placeholder={viewMode === "chats" ? "Search chats..." : "Search users..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarLoading ? (
            <SidebarSkeleton />
          ) : viewMode === "chats" ? (
            // Chat History View
            filteredChats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="font-medium">No chat history</p>
                <p className="text-sm mt-1">Switch to "All Users" to start a new conversation</p>
              </div>
            ) : (
              filteredChats.map((chatItem) => (
                <button
                  key={chatItem._id}
                  onClick={() => openExistingChat(chatItem)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 border-b transition-colors ${
                    chat?._id === chatItem._id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="relative">
                    <AvatarWithPlaceholder
                      src={toMediaUrl(chatItem.participant?.profilePic)}
                      name={chatItem.participant?.name || chatItem.participant?.username}
                      sizeClass="w-12 h-12"
                      textClass="text-sm"
                    />
                    {chatItem.participant?.userType === "business" && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {chatItem.participant?.name || chatItem.participant?.username}
                      </p>
                      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {formatChatDate(chatItem.updatedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {chatItem.lastMessage?.content || "No messages yet"}
                    </p>
                    {chatItem.unreadCount > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                        {chatItem.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )
          ) : (
            // All Users View
            filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No users found</div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => startChat(user)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 border-b transition-colors ${
                    selectedUser?._id === user._id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="relative">
                    <AvatarWithPlaceholder
                      src={toMediaUrl(user.profilePic)}
                      name={user.name || user.username}
                      sizeClass="w-10 h-10"
                    />
                    {user.userType === "business" && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" />
                      </svg>
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 text-sm">{user.name || user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    user.userType === "business"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {user.userType}
                </span>
              </button>
            ))
          )
        )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 bg-white border-b">
              <AvatarWithPlaceholder
                src={toMediaUrl(selectedUser.profilePic)}
                name={selectedUser.name || selectedUser.username}
                sizeClass="w-10 h-10"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{selectedUser.name || selectedUser.username}</h3>
                <p className="text-xs text-gray-500">
                  {isTyping ? (
                    <span className="text-green-500">typing...</span>
                  ) : (
                    selectedUser.email
                  )}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedUser.userType === "business" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
              }`}>
                {selectedUser.userType}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {/* Product Context Card - only show for product inquiries, not admin support */}
              {!loadingMessages && chat?.productContext?.title && (
                <div className="bg-white rounded-lg border p-3 flex items-center gap-3 mb-4 shadow-sm">
                  <img
                    src={chat.productContext.image?.startsWith('http') ? chat.productContext.image : `${API_BASE_URL.replace('/api', '')}${chat.productContext.image}`}
                    alt={chat.productContext.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Inquiry About</p>
                    <p className="font-semibold text-gray-900 truncate">{chat.productContext.title}</p>
                    {chat.productContext.price > 0 && (
                      <p className="text-blue-600 font-bold">₹{chat.productContext.price.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )}
              
              {loadingMessages ? (
                <MessageSkeleton />
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No messages yet</p>
                  <p className="text-sm">Start a conversation with {selectedUser.name}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = (typeof msg.sender === 'object' ? msg.sender._id : msg.sender) === adminUser._id;
                  
                  // Product message
                  if (msg.messageType === 'product' && msg.product) {
                    return (
                      <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[70%] rounded-2xl overflow-hidden bg-white shadow-sm border">
                          <img
                            src={msg.product.image?.startsWith('http') ? msg.product.image : `${API_BASE_URL.replace('/api', '')}${msg.product.image}`}
                            alt={msg.product.title}
                            className="w-48 h-36 object-cover"
                          />
                          <div className="p-3">
                            <p className="text-xs text-gray-500 uppercase">Inquiry about</p>
                            <p className="font-semibold text-gray-900">{msg.product.title}</p>
                            <p className="text-blue-600 font-bold">₹{(msg.product.price || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatTime(msg.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Regular text message
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          isMe
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 px-4 py-3 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
                  className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-24 h-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Admin Support Chat</h3>
            <p className="text-gray-500">Select a user from the list to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
