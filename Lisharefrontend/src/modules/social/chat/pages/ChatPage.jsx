import { useCallback, useEffect, useMemo, useState } from "react";
import { chatService } from "../services/chatService";
import { useChatSocket } from "../hooks/useChatSocket";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import EmptyState from "/src/modules/platform/common/components/EmptyState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export default function ChatPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reactionsByMessage, setReactionsByMessage] = useState({});
  const [messageText, setMessageText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [directUserId, setDirectUserId] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [groupMembersCsv, setGroupMembersCsv] = useState("");
  const [memberUserIdInput, setMemberUserIdInput] = useState("");

  const activeConversation = useMemo(
    () => conversations.find((item) => item.conversationId === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await chatService.getConversations();
      const payload = response?.data?.data || [];
      setConversations(payload);
      if (!activeConversationId && payload.length > 0) {
        setActiveConversationId(payload[0].conversationId);
      }
    } catch {
      pushToast("Failed to load conversations", "error");
    } finally {
      setLoading(false);
    }
  }, [activeConversationId, pushToast]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      const response = await chatService.getMessages(conversationId, { page: 0, size: 50 });
      const payload = response?.data?.data?.content || [];
      setMessages(payload);
      const reactionEntries = await Promise.all(
        payload.map(async (message) => {
          const reactionsResponse = await chatService.getMessageReactions(message.id);
          return [message.id, reactionsResponse?.data?.data || []];
        })
      );
      setReactionsByMessage(Object.fromEntries(reactionEntries));
      await chatService.markSeen(conversationId);
    } catch {
      pushToast("Failed to load messages", "error");
    }
  }, [pushToast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  const onIncomingMessage = useCallback(
    (incoming) => {
      if (!incoming) return;
      if (incoming.conversationId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((message) => message.id === incoming.id)) {
            return prev;
          }
          return [...prev, incoming];
        });
      }
      loadConversations();
    },
    [activeConversationId, loadConversations]
  );

  const onTyping = useCallback(
    (payload) => {
      if (!payload || payload.userId === user?.userId) return;
      setTypingUser(payload.typing ? payload.userName : null);
    },
    [user?.userId]
  );

  const { connected, sendTyping } = useChatSocket(
    activeConversationId,
    onIncomingMessage,
    onTyping
  );

  const sendMessage = async (event) => {
    event.preventDefault();
    if ((!messageText.trim() && !attachmentFile) || !activeConversationId) return;

    try {
      let attachment = null;
      if (attachmentFile) {
        const uploadResponse = await chatService.uploadAttachment(attachmentFile);
        attachment = uploadResponse?.data?.data || null;
      }

      const payload = {
        content: messageText.trim() || null,
        attachmentUrl: attachment?.attachmentUrl || null,
        attachmentType: attachment?.attachmentType || null
      };

      const response = await chatService.sendMessage(activeConversationId, payload);
      const sent = response?.data?.data;
      if (!connected && sent) {
        setMessages((prev) => [...prev, sent]);
      }

      setMessageText("");
      setAttachmentFile(null);
      setTypingUser(null);
      sendTyping(false);
    } catch {
      pushToast("Failed to send message", "error");
    }
  };

  const openDirectConversation = async () => {
    const targetId = Number(directUserId);
    if (!targetId) return;
    try {
      const response = await chatService.openDirectConversation(targetId);
      const conversation = response?.data?.data;
      await loadConversations();
      if (conversation?.conversationId) {
        setActiveConversationId(conversation.conversationId);
      }
      setDirectUserId("");
    } catch {
      pushToast("Failed to open direct conversation", "error");
    }
  };

  const createGroupConversation = async () => {
    const memberIds = groupMembersCsv
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!groupTitle.trim() || memberIds.length < 2) {
      pushToast("Provide group title and at least 2 member IDs", "error");
      return;
    }

    try {
      const response = await chatService.createGroupConversation({
        title: groupTitle.trim(),
        memberIds
      });
      const created = response?.data?.data;
      await loadConversations();
      if (created?.conversationId) {
        setActiveConversationId(created.conversationId);
      }
      setGroupTitle("");
      setGroupMembersCsv("");
      pushToast("Group conversation created", "success");
    } catch {
      pushToast("Failed to create group", "error");
    }
  };

  const addMember = async () => {
    const targetUserId = Number(memberUserIdInput);
    if (!activeConversationId || !targetUserId) return;
    try {
      await chatService.addMember(activeConversationId, targetUserId);
      setMemberUserIdInput("");
      await loadConversations();
      pushToast("Member added", "success");
    } catch {
      pushToast("Failed to add member", "error");
    }
  };

  const removeMember = async () => {
    const targetUserId = Number(memberUserIdInput);
    if (!activeConversationId || !targetUserId) return;
    try {
      await chatService.removeMember(activeConversationId, targetUserId);
      setMemberUserIdInput("");
      await loadConversations();
      pushToast("Member removed", "success");
    } catch {
      pushToast("Failed to remove member", "error");
    }
  };

  const reactToMessage = async (messageId, emoji) => {
    try {
      await chatService.reactToMessage(messageId, emoji);
      const response = await chatService.getMessageReactions(messageId);
      setReactionsByMessage((prev) => ({ ...prev, [messageId]: response?.data?.data || [] }));
    } catch {
      pushToast("Failed to react to message", "error");
    }
  };

  if (loading) return <LoadingState text="Loading chat..." />;

  return (
    <div className="chat-page">
      <aside className="chat-sidebar card">
        <h3>Conversations</h3>
        <div className="inline-form">
          <input
            placeholder="User ID"
            value={directUserId}
            onChange={(e) => setDirectUserId(e.target.value)}
          />
          <button className="btn btn-secondary" type="button" onClick={openDirectConversation}>
            Open
          </button>
        </div>
        <div className="grid-form">
          <input
            placeholder="Group title"
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
          />
          <input
            placeholder="Member IDs (comma-separated)"
            value={groupMembersCsv}
            onChange={(e) => setGroupMembersCsv(e.target.value)}
          />
          <button className="btn btn-secondary" type="button" onClick={createGroupConversation}>
            Create Group
          </button>
        </div>
        <ul className="conversation-list">
          {conversations.map((conversation) => (
            <li key={conversation.conversationId}>
              <button
                type="button"
                className={`conversation-btn ${activeConversationId === conversation.conversationId ? "active" : ""}`}
                onClick={() => setActiveConversationId(conversation.conversationId)}
              >
                <div>
                  <strong>{conversation.title}</strong>
                  <p>{conversation.lastMessage || "No messages yet"}</p>
                </div>
                {conversation.unreadCount > 0 ? (
                  <span className="notif-badge">{conversation.unreadCount}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="chat-main card">
        <header className="chat-header">
          <h3>{activeConversation?.title || "Select conversation"}</h3>
          <span>{connected ? "Live" : "Offline"}</span>
        </header>

        {activeConversation ? (
          <div className="chat-members-bar">
            <div className="member-list">
              {activeConversation.members?.map((member) => (
                <span key={member.userId} className={`member-chip ${member.online ? "online" : ""}`}>
                  {member.fullName}
                </span>
              ))}
            </div>
            {activeConversation.type === "GROUP" ? (
              <div className="inline-form">
                <input
                  placeholder="User ID"
                  value={memberUserIdInput}
                  onChange={(e) => setMemberUserIdInput(e.target.value)}
                />
                <button className="btn btn-secondary" type="button" onClick={addMember}>
                  Add
                </button>
                <button className="btn btn-secondary" type="button" onClick={removeMember}>
                  Remove
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="chat-messages">
          {messages.length === 0 ? <EmptyState title="No messages" subtitle="Start a conversation." /> : null}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-message ${message.senderId === user?.userId ? "mine" : ""}`}
            >
              <p className="chat-message-author">{message.senderName}</p>
              <p>{message.content || ""}</p>
              {message.attachmentUrl ? (
                <a href={toMediaUrl(message.attachmentUrl)} target="_blank" rel="noreferrer">
                  Attachment
                </a>
              ) : null}
              <small>
                {new Date(message.createdAt).toLocaleTimeString()} | {message.status}
              </small>
              <div className="reaction-row">
                {QUICK_REACTIONS.map((emoji) => (
                  <button key={emoji} type="button" className="chip" onClick={() => reactToMessage(message.id, emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="message-reactions">
                {(reactionsByMessage[message.id] || []).map((reaction) => (
                  <span key={reaction.id} className="message-reaction-item">
                    {reaction.emoji} {reaction.userName}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {typingUser ? <p className="typing-indicator">{typingUser} is typing...</p> : null}

        <form className="chat-input-row" onSubmit={sendMessage}>
          <input
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              sendTyping(e.target.value.length > 0);
            }}
            placeholder="Type a message"
          />
          <input
            type="file"
            onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
            aria-label="Attach file"
          />
          <button className="btn btn-primary" type="submit">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
