import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatService } from "../services/chatService";
import { useChatSocket } from "../hooks/useChatSocket";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import EmptyState from "/src/modules/platform/common/components/EmptyState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import { followService } from "/src/modules/social/follow/services/followService";
import { friendService } from "/src/modules/social/friend/services/friendService";

const QUICK_REACTIONS = ["\uD83D\uDC4D", "\u2764\uFE0F", "\uD83D\uDE02", "\uD83D\uDE2E", "\uD83D\uDE22", "\uD83D\uDD25"];

function fullName(user) {
  const first = user?.firstName ?? user?.firstname ?? "";
  const last = user?.lastName ?? user?.lastname ?? "";
  return `${first} ${last}`.trim() || user?.name || "Unknown User";
}

function normalizeContact(user) {
  if (!user?.userId) return null;
  return {
    userId: user.userId,
    name: fullName(user),
    email: user.email || "",
    profileImageUrl: user.profileImageUrl || user.imageUrl || ""
  };
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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
  const [groupMemberIds, setGroupMemberIds] = useState([]);
  const [memberUserIdInput, setMemberUserIdInput] = useState("");
  const [contacts, setContacts] = useState([]);
  const [contactQuery, setContactQuery] = useState("");
  const [conversationQuery, setConversationQuery] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  const messageListRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.conversationId === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const filteredContacts = useMemo(() => {
    const query = contactQuery.trim().toLowerCase();
    if (!query) return contacts.slice(0, 12);
    return contacts.filter((contact) =>
      contact.name.toLowerCase().includes(query) || contact.email.toLowerCase().includes(query)
    );
  }, [contacts, contactQuery]);

  const unreadCount = useMemo(
    () => conversations.reduce((total, item) => total + Number(item.unreadCount || 0), 0),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase();
    return conversations.filter((item) => {
      const matchesQuery = !query || item.title?.toLowerCase().includes(query) || item.lastMessage?.toLowerCase().includes(query);
      if (!matchesQuery) return false;
      if (!onlyUnread) return true;
      return Number(item.unreadCount || 0) > 0;
    });
  }, [conversations, conversationQuery, onlyUnread]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, activeConversationId]);

  const loadContacts = useCallback(async () => {
    try {
      const [friendsRes, followingRes] = await Promise.all([
        friendService.getFriends(),
        followService.following()
      ]);

      const friendList = Array.isArray(friendsRes.data) ? friendsRes.data : [];
      const followingList = Array.isArray(followingRes.data) ? followingRes.data : [];
      const merged = [...friendList, ...followingList]
        .map(normalizeContact)
        .filter(Boolean)
        .filter((contact) => contact.userId !== user?.userId);

      const unique = new Map();
      merged.forEach((contact) => {
        if (!unique.has(contact.userId)) {
          unique.set(contact.userId, contact);
        }
      });
      setContacts([...unique.values()]);
    } catch {
      // silent fallback
    }
  }, [user?.userId]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await chatService.getConversations();
      const payload = response?.data?.data || [];
      setConversations(payload);
      const exists = payload.some((item) => item.conversationId === activeConversationId);
      if (!exists && payload.length > 0) {
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
    loadContacts();
  }, [loadContacts]);

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
      await loadConversations();

      setMessageText("");
      setAttachmentFile(null);
      setTypingUser(null);
      sendTyping(false);
    } catch {
      pushToast("Failed to send message", "error");
    }
  };

  const openDirectConversationById = async (userId) => {
    const targetId = Number(userId);
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

  const openDirectConversation = async () => {
    await openDirectConversationById(directUserId);
  };

  const createGroupConversation = async () => {
    const csvMemberIds = groupMembersCsv
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);
    const memberIds = [...new Set([...groupMemberIds, ...csvMemberIds])];

    if (!groupTitle.trim() || memberIds.length < 2) {
      pushToast("Provide group title and at least 2 members", "error");
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
      setGroupMemberIds([]);
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
      const existing = (reactionsByMessage[messageId] || []).find(
        (reaction) => reaction.emoji === emoji && (reaction.userId === user?.userId || reaction.userName === fullName(user))
      );

      if (existing) {
        await chatService.removeMessageReaction(messageId);
      } else {
        await chatService.reactToMessage(messageId, emoji);
      }
      const response = await chatService.getMessageReactions(messageId);
      setReactionsByMessage((prev) => ({ ...prev, [messageId]: response?.data?.data || [] }));
    } catch {
      pushToast("Failed to react to message", "error");
    }
  };

  if (loading) return <LoadingState text="Loading chat..." />;

  return (
    <div className="chat-page-wrap">
      <section className="page-hero">
        <div>
          <h2>Messaging Hub</h2>
          <p>Direct chats, group rooms and realtime communication in one workspace.</p>
        </div>
        <div className="hero-stats">
          <article>
            <strong>{conversations.length}</strong>
            <span>Conversations</span>
          </article>
          <article>
            <strong>{messages.length}</strong>
            <span>Messages</span>
          </article>
          <article>
            <strong>{unreadCount}</strong>
            <span>Unread</span>
          </article>
        </div>
      </section>

      <div className="chat-layout">
        <aside className="chat-sidebar-panel">
          <div className="chat-sidebar-head">
            <h3>Inbox</h3>
            <span className={`chip ${connected ? "" : "chip-offline"}`}>{connected ? "Live" : "Offline"}</span>
          </div>

          <div className="chat-quick-grid">
            <article className="chat-quick-item">
              <strong>{conversations.length}</strong>
              <span>Chats</span>
            </article>
            <article className="chat-quick-item">
              <strong>{contacts.length}</strong>
              <span>Contacts</span>
            </article>
            <article className="chat-quick-item">
              <strong>{unreadCount}</strong>
              <span>Unread</span>
            </article>
          </div>

          <input
            placeholder="Search conversations"
            value={conversationQuery}
            onChange={(e) => setConversationQuery(e.target.value)}
          />

          <label className="muted" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(event) => setOnlyUnread(event.target.checked)}
              style={{ width: "auto" }}
            />
            Show unread only
          </label>

          <div className="inline-form">
            <input
              placeholder="User ID"
              value={directUserId}
              onChange={(e) => setDirectUserId(e.target.value)}
            />
            <button className="btn btn-secondary" type="button" onClick={openDirectConversation}>
              Start Chat
            </button>
          </div>

          <div className="chat-contact-panel">
            <input
              placeholder="Search friends/following"
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
            />
            <ul className="chat-contact-list">
              {filteredContacts.length === 0 ? <li className="muted">No contacts found.</li> : null}
              {filteredContacts.map((contact) => (
                <li key={contact.userId} className="chat-contact-row">
                  <div>
                    <strong>{contact.name}</strong>
                    <p>{contact.email || `ID: ${contact.userId}`}</p>
                  </div>
                  <div className="row-actions">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => {
                        setGroupMemberIds((prev) => (prev.includes(contact.userId) ? prev : [...prev, contact.userId]));
                      }}
                    >
                      Group
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => openDirectConversationById(contact.userId)}
                    >
                      Chat
                    </button>
                  </div>
                </li>
              ))}
            </ul>
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
            <div className="reaction-row">
              {groupMemberIds.map((userId) => (
                <button
                  key={userId}
                  type="button"
                  className="chip"
                  onClick={() => setGroupMemberIds((prev) => prev.filter((value) => value !== userId))}
                >
                  Member #{userId} x
                </button>
              ))}
            </div>
            <button className="btn btn-secondary" type="button" onClick={createGroupConversation}>
              Create Group
            </button>
          </div>

          <ul className="conversation-list">
            {filteredConversations.map((conversation) => (
              <li key={conversation.conversationId}>
                <button
                  type="button"
                  className={`conversation-btn ${activeConversationId === conversation.conversationId ? "active" : ""}`}
                  onClick={() => setActiveConversationId(conversation.conversationId)}
                >
                  <div>
                    <strong>{conversation.title || `Chat #${conversation.conversationId}`}</strong>
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

        <section className="chat-thread-panel">
          {activeConversation ? (
            <>
              <header className="chat-thread-header">
                <div>
                  <h3>{activeConversation.title || `Conversation #${activeConversation.conversationId}`}</h3>
                  <p>{activeConversation.type === "GROUP" ? "Group chat" : "Direct message"} | realtime enabled</p>
                </div>
                <span className={`chip ${connected ? "" : "chip-offline"}`}>{connected ? "Live" : "Offline"}</span>
              </header>

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

              <div className="chat-messages" ref={messageListRef}>
                {messages.length === 0 ? <EmptyState title="No messages" subtitle="Start a conversation." /> : null}
                {messages.map((message) => {
                  const attachmentType = String(message.attachmentType || "").toLowerCase();
                  const imageAttachment = attachmentType.startsWith("image");
                  const videoAttachment = attachmentType.startsWith("video");
                  const attachmentUrl = message.attachmentUrl ? toMediaUrl(message.attachmentUrl) : "";

                  return (
                    <div
                      key={message.id}
                      className={`chat-message ${message.senderId === user?.userId ? "mine" : ""}`}
                    >
                      <p className="chat-message-author">{message.senderName}</p>
                      <p>{message.content || ""}</p>
                      {attachmentUrl ? (
                        imageAttachment ? (
                          <img className="chat-attachment-image" src={attachmentUrl} alt="Attachment" />
                        ) : videoAttachment ? (
                          <video className="chat-attachment-video" src={attachmentUrl} controls preload="metadata" />
                        ) : (
                          <a href={attachmentUrl} target="_blank" rel="noreferrer">
                            Attachment
                          </a>
                        )
                      ) : null}
                      <small>
                        {formatTime(message.createdAt)} | {message.status}
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
                  );
                })}
              </div>

              {typingUser ? <p className="typing-indicator">{typingUser} is typing...</p> : null}
              {attachmentFile ? <p className="muted">Attachment: {attachmentFile.name}</p> : null}

              <form className="chat-composer" onSubmit={sendMessage}>
                <div className="chat-input-row">
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
                    accept="image/*,video/*"
                    onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                    aria-label="Attach file"
                  />
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      setMessageText("");
                      setAttachmentFile(null);
                      sendTyping(false);
                    }}
                  >
                    Clear
                  </button>
                  <button className="btn btn-primary" type="submit">
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <EmptyState title="Select a conversation" subtitle="Choose a chat from your inbox or open one from contacts." />
          )}
        </section>
      </div>
    </div>
  );
}
