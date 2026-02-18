import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { MessageSquare, Send, Headset, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const SOCKET_URL = API_BASE_URL.replace("/api", "");

const toSenderId = (sender) => (typeof sender === "object" ? sender?._id : sender);

export default function SellerChat() {
  const location = useLocation();
  const { user } = useAuth();

  const token = localStorage.getItem("token");
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(location.state?.chatId || null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef(null);
  const joinedChatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeChatIdRef = useRef(location.state?.chatId || null);
  const typingTimeoutRef = useRef(null);

  const joinChatRoom = useCallback(
    (chatId) => {
      if (!chatId || !socketRef.current) return;
      if (joinedChatRef.current && joinedChatRef.current !== chatId) {
        socketRef.current.emit("leave-chat", joinedChatRef.current);
      }
      socketRef.current.emit("join-chat", chatId);
      joinedChatRef.current = chatId;
    },
    []
  );

  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat?type=admin&scope=all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load support chats");
      }
      const list = Array.isArray(data?.chats) ? data.chats : [];
      setChats(list);

      setActiveChatId((prev) => {
        if (prev && (list.length === 0 || list.some((item) => item._id === prev))) {
          return prev;
        }
        return list?.[0]?._id || null;
      });
    } catch (error) {
      console.error("Seller chat list error:", error);
    } finally {
      setLoadingChats(false);
    }
  }, [token]);

  const fetchChatById = useCallback(
    async (chatId) => {
      if (!token || !chatId) return;
      setLoadingMessages(true);
      try {
        const res = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load chat");
        }
        setActiveChat(data);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        joinChatRoom(chatId);
        socketRef.current?.emit("mark-read", chatId);
      } catch (error) {
        console.error("Seller chat detail error:", error);
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, joinChatRoom]
  );

  const ensureSupportChat = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/support/open`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to open support chat");
      }

      setActiveChatId(data.chatId);
      await fetchChats();
      await fetchChatById(data.chatId);
    } catch (error) {
      console.error("Open support chat error:", error);
      alert(error.message || "Support is currently unavailable");
    }
  }, [token, fetchChats, fetchChatById]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (location.state?.chatId) {
      setActiveChatId(location.state.chatId);
    }
  }, [location.state?.chatId]);

  useEffect(() => {
    if (activeChatId) {
      fetchChatById(activeChatId);
    }
  }, [activeChatId, fetchChatById]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      if (!activeChatIdRef.current) return;
      joinChatRoom(activeChatIdRef.current);
      socketRef.current?.emit("mark-read", activeChatIdRef.current);
    });

    socketRef.current.on("new-message", (data) => {
      if (!data?.chatId || data.chatId !== activeChatIdRef.current) return;
      setMessages((prev) => {
        const incoming = data.message;
        const incomingId = incoming?._id;
        const incomingSenderId = incoming?.sender?._id || incoming?.sender;
        
        // Check for exact _id match
        const existsById = prev.some((msg) => msg._id === incomingId);
        if (existsById) {
          return prev.map((msg) => (msg._id === incomingId ? incoming : msg));
        }
        
        // Check for optimistic message match (same content + sender + recent temp id)
        const optimisticIndex = prev.findIndex((msg) => {
          const msgId = msg._id || "";
          const isTemp = typeof msgId === "string" && msgId.startsWith("temp-");
          const msgSenderId = msg.sender?._id || msg.sender;
          return isTemp && msg.content === incoming?.content && msgSenderId === incomingSenderId;
        });
        
        if (optimisticIndex !== -1) {
          // Replace optimistic message with real one
          const next = [...prev];
          next[optimisticIndex] = incoming;
          return next;
        }
        
        return [...prev, incoming];
      });
      socketRef.current?.emit("mark-read", data.chatId);
      void fetchChats();
    });

    socketRef.current.on("chat-notification", () => {
      void fetchChats();
    });

    socketRef.current.on("user-typing", (data) => {
      if (data?.chatId === activeChatIdRef.current) {
        setIsTyping(true);
      }
    });

    socketRef.current.on("user-stop-typing", (data) => {
      if (data?.chatId === activeChatIdRef.current) {
        setIsTyping(false);
      }
    });

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      if (joinedChatRef.current) {
        socketRef.current?.emit("leave-chat", joinedChatRef.current);
      }
      socketRef.current?.disconnect();
    };
  }, [token, fetchChats, joinChatRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const content = messageInput.trim();
    if (!content || !activeChatId || sending || !token) return;

    setSending(true);
    setMessageInput("");

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      sender: { _id: user?._id },
      content,
      messageType: "text",
      createdAt: new Date().toISOString(),
      isTemp: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    socketRef.current?.emit("typing", activeChatId);
    socketRef.current?.emit("stop-typing", activeChatId);

    try {
      const res = await fetch(`${API_BASE_URL}/chat/${activeChatId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          messageType: "text",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      const savedMessage = data?.message;
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? savedMessage || msg : msg))
      );
      void fetchChats();
    } catch (error) {
      console.error("Send support message error:", error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      setMessageInput(content);
      alert(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    if (!activeChatId) return;
    socketRef.current?.emit("typing", activeChatId);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      socketRef.current?.emit("stop-typing", activeChatId);
    }, 1200);
  };

  const getChatTitle = (chatItem) =>
    chatItem?.participant?.name || chatItem?.participant?.username || "Support";

  const otherParticipant = activeChat?.participants?.find(
    (participant) => String(participant?._id) !== String(user?._id)
  );

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50 rounded-lg overflow-hidden border border-slate-200">
      <aside className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Support Chat</h2>
            <button
              onClick={fetchChats}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="Refresh chats"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chat with admin support for ads, boosts, and account help.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="p-6 text-sm text-slate-500">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-6 text-sm text-slate-500 space-y-3">
              <p>No support chat yet.</p>
              <button
                onClick={ensureSupportChat}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Headset size={16} />
                Start Support Chat
              </button>
            </div>
          ) : (
            chats.map((chatItem) => (
              <button
                key={chatItem._id}
                onClick={() => setActiveChatId(chatItem._id)}
                className={`w-full p-4 text-left border-b hover:bg-slate-50 transition-colors ${
                  activeChatId === chatItem._id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800 truncate">{getChatTitle(chatItem)}</p>
                  <span className="text-xs text-slate-400">
                    {formatTime(chatItem?.lastMessage?.createdAt || chatItem?.updatedAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {chatItem?.lastMessage?.content || "No messages yet"}
                </p>
                {chatItem?.unreadCount > 0 && (
                  <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                    {chatItem.unreadCount} new
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="flex-1 flex flex-col">
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 px-4">
            <MessageSquare size={48} />
            <p className="mt-3 text-sm">Open a support chat to start messaging.</p>
            <button
              onClick={ensureSupportChat}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Open Support Chat
            </button>
          </div>
        ) : (
          <>
            <header className="px-4 py-3 bg-white border-b">
              <p className="font-semibold text-slate-800">
                {otherParticipant?.name ||
                  otherParticipant?.username ||
                  "Support Team"}
              </p>
              <p className="text-xs text-slate-500">{isTyping ? "typing..." : "Online support channel"}</p>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {loadingMessages ? (
                <p className="text-sm text-slate-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages yet. Send a message to support.</p>
              ) : (
                messages.map((msg) => {
                  const isMe = String(toSenderId(msg.sender)) === String(user?._id);
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-white text-slate-800 rounded-bl-sm border border-slate-200"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[11px] mt-1 ${isMe ? "text-blue-100" : "text-slate-400"}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Type your message to support..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => void sendMessage()}
                  disabled={!messageInput.trim() || sending}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
