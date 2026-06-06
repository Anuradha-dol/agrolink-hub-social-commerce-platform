import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { chatService } from "../services/chatService";
import { useChatSocket } from "../hooks/useChatSocket";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import { followService } from "/src/modules/social/follow/services/followService";
import { friendService } from "/src/modules/social/friend/services/friendService";
import {
  Avatar,
  Button,
  Card,
  EmptyPanel,
  Icon,
  PageGrid,
  SectionHeader,
  StatusBadge,
  Tabs
} from "/src/modules/platform/common/ui/DashboardUI";

const QUICK_REACTIONS = ["Like", "Love", "Laugh", "Wow", "Sad", "Fire"];
const REACTION_EMOJI = {
  Like: "\uD83D\uDC4D",
  Love: "\u2764\uFE0F",
  Laugh: "\uD83D\uDE02",
  Wow: "\uD83D\uDE2E",
  Sad: "\uD83D\uDE22",
  Fire: "\uD83D\uDD25"
};

function fullName(user) {
  return `${user?.firstName ?? user?.firstname ?? ""} ${user?.lastName ?? user?.lastname ?? ""}`.trim()
    || user?.fullName
    || user?.name
    || "AgroLink User";
}

function isOnlineUser(user) {
  return Boolean(user?.online || user?.isOnline || user?.presence === "ONLINE");
}

function isOnlineConversation(conversation, viewerId) {
  const members = Array.isArray(conversation?.members) ? conversation.members : [];
  const otherMember = members.find((member) => Number(member.userId) !== Number(viewerId)) || members[0] || null;
  return Boolean(
    isOnlineUser(otherMember) ||
    conversation?.online ||
    conversation?.isOnline ||
    conversation?.presence === "ONLINE"
  );
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
  const location = useLocation();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const messageListRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reactionsByMessage, setReactionsByMessage] = useState({});
  const [messageText, setMessageText] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [accountQuery, setAccountQuery] = useState("");
  const [accountResults, setAccountResults] = useState([]);
  const [conversationQuery, setConversationQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((item) => item.conversationId === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const unreadCount = useMemo(() => conversations.reduce((total, item) => total + Number(item.unreadCount || 0), 0), [conversations]);

  const filteredConversations = useMemo(() => {
    const query = conversationQuery.trim().toLowerCase();
    return conversations.filter((item) => {
      const matchesQuery = !query || item.title?.toLowerCase().includes(query) || item.lastMessage?.toLowerCase().includes(query);
      const matchesFilter = filter === "all"
        || (filter === "unread" && Number(item.unreadCount || 0) > 0)
        || (filter === "groups" && item.type === "GROUP");
      return matchesQuery && matchesFilter;
    });
  }, [conversations, conversationQuery, filter]);

  const selectedUser = useMemo(() => {
    const members = activeConversation?.members || [];
    return members.find((member) => Number(member.userId) !== Number(user?.userId)) || members[0] || null;
  }, [activeConversation, user?.userId]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await chatService.getConversations();
      const data = response?.data?.data || [];
      setConversations(data);
      setActiveConversationId((current) => (data.some((item) => item.conversationId === current) ? current : data[0]?.conversationId || null));
    } catch {
      pushToast("Failed to load conversations", "error");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  const loadContacts = useCallback(async () => {
    try {
      const [friendsRes, followingRes] = await Promise.all([friendService.getFriends(), followService.following()]);
      const merged = [...(Array.isArray(friendsRes.data) ? friendsRes.data : []), ...(Array.isArray(followingRes.data) ? followingRes.data : [])]
        .map(normalizeContact)
        .filter(Boolean)
        .filter((contact) => Number(contact.userId) !== Number(user?.userId));
      const unique = new Map();
      merged.forEach((contact) => unique.set(contact.userId, contact));
      setContacts([...unique.values()]);
    } catch {
      setContacts([]);
    }
  }, [user?.userId]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      const response = await chatService.getMessages(conversationId, { page: 0, size: 80 });
      const data = response?.data?.data?.content || [];
      setMessages(data);
      const reactionEntries = await Promise.all(
        data.map(async (message) => {
          try {
            const reactionsResponse = await chatService.getMessageReactions(message.id);
            return [message.id, reactionsResponse?.data?.data || []];
          } catch {
            return [message.id, []];
          }
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
    loadContacts();
  }, [loadContacts, loadConversations]);

  useEffect(() => {
    loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, activeConversationId]);

  const openDirectConversationById = useCallback(async (targetUserId) => {
    const id = Number(targetUserId);
    if (!id) return;
    try {
      const response = await chatService.openDirectConversation(id);
      const conversation = response?.data?.data;
      await loadConversations();
      if (conversation?.conversationId) setActiveConversationId(conversation.conversationId);
      setNewMessageOpen(false);
      setAccountQuery("");
      setAccountResults([]);
      pushToast("Conversation opened", "success");
    } catch {
      pushToast("Failed to open direct chat", "error");
    }
  }, [loadConversations, pushToast]);

  useEffect(() => {
    if (location.state?.startUserId) {
      openDirectConversationById(location.state.startUserId);
    }
  }, [location.state, openDirectConversationById]);

  const onIncomingMessage = useCallback((incoming) => {
    if (!incoming) return;
    if (incoming.conversationId === activeConversationId) {
      setMessages((prev) => (prev.some((message) => message.id === incoming.id) ? prev : [...prev, incoming]));
    }
    loadConversations();
  }, [activeConversationId, loadConversations]);

  const onTyping = useCallback((payload) => {
    if (!payload || Number(payload.userId) === Number(user?.userId)) return;
    setTypingUser(payload.typing ? payload.userName : null);
  }, [user?.userId]);

  const onPresence = useCallback((payload) => {
    if (!payload || !payload.userId) return;
    setConversations((prev) => prev.map((conv) => {
      const isRelevant = conv.members?.some(m => Number(m.userId) === Number(payload.userId));
      if (!isRelevant) return conv;
      return {
        ...conv,
        online: payload.status === "ONLINE",
        isOnline: payload.status === "ONLINE",
        presence: payload.status,
        members: conv.members.map(m =>
          Number(m.userId) === Number(payload.userId)
            ? { ...m, presence: payload.status, isOnline: payload.status === "ONLINE" }
            : m
        )
      };
    }));
  }, []);

  const { connected, sendTyping } = useChatSocket(activeConversationId, onIncomingMessage, onTyping, onPresence);
  const selectedUserOnline = activeConversation
    ? (selectedUser ? (isOnlineUser(selectedUser) || isOnlineConversation(activeConversation, user?.userId)) : isOnlineConversation(activeConversation, user?.userId))
    : false;

  const searchAccounts = async (event) => {
    event?.preventDefault();
    if (!accountQuery.trim()) {
      setAccountResults([]);
      return;
    }
    try {
      const response = await followService.searchUsers(accountQuery.trim());
      setAccountResults((Array.isArray(response.data) ? response.data : []).filter((entry) => Number(entry.userId) !== Number(user?.userId)));
    } catch {
      pushToast("Failed to search accounts", "error");
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if ((!messageText.trim() && !attachmentFile) || !activeConversationId) return;
    try {
      let attachment = null;
      if (attachmentFile) {
        const uploadResponse = await chatService.uploadAttachment(attachmentFile);
        attachment = uploadResponse?.data?.data || null;
      }
      const response = await chatService.sendMessage(activeConversationId, {
        content: messageText.trim() || null,
        attachmentUrl: attachment?.attachmentUrl || null,
        attachmentType: attachment?.attachmentType || null
      });
      const sent = response?.data?.data;
      if (!connected && sent) setMessages((prev) => [...prev, sent]);
      setMessageText("");
      setAttachmentFile(null);
      setTypingUser(null);
      sendTyping(false);
      await loadConversations();
    } catch {
      pushToast("Failed to send message", "error");
    }
  };

  const reactToMessage = async (messageId, label) => {
    const emoji = REACTION_EMOJI[label] || label;
    try {
      const existing = (reactionsByMessage[messageId] || []).find(
        (reaction) => reaction.emoji === emoji && (Number(reaction.userId) === Number(user?.userId) || reaction.userName === fullName(user))
      );
      if (existing) await chatService.removeMessageReaction(messageId);
      else await chatService.reactToMessage(messageId, emoji);
      const response = await chatService.getMessageReactions(messageId);
      setReactionsByMessage((prev) => ({ ...prev, [messageId]: response?.data?.data || [] }));
    } catch {
      pushToast("Failed to react", "error");
    }
  };

  if (loading) return <LoadingState text="Loading chat..." />;

  return (
    <PageGrid className="chat-dashboard">
      <div className="chat-dashboard-grid">
        <Card className="messages-panel">
          <SectionHeader
            title="Messages"
            action={<button type="button" className="icon-button" onClick={() => setNewMessageOpen((open) => !open)} aria-label="New message"><Icon name="edit" /></button>}
          />
          <label className="chat-search">
            <Icon name="search" />
            <input value={conversationQuery} onChange={(event) => setConversationQuery(event.target.value)} placeholder="Search people or chats..." />
          </label>
          <Tabs
            active={filter}
            onChange={setFilter}
            tabs={[
              { value: "all", label: "All" },
              { value: "unread", label: "Unread", count: unreadCount },
              { value: "groups", label: "Groups" }
            ]}
          />
          <Button variant="gradient" icon="edit" onClick={() => setNewMessageOpen((open) => !open)}>New Message</Button>

          {newMessageOpen ? (
            <form className="new-message-box" onSubmit={searchAccounts}>
              <label>
                <Icon name="search" />
                <input value={accountQuery} onChange={(event) => setAccountQuery(event.target.value)} placeholder="Search account by name or email" />
              </label>
              <Button variant="gradient" type="submit">Search</Button>
              <div className="account-result-list">
                {(accountResults.length ? accountResults : contacts.slice(0, 6)).map((contact) => (
                  <button key={contact.userId} type="button" onClick={() => openDirectConversationById(contact.userId)}>
                    <Avatar name={fullName(contact)} src={contact.profileImageUrl ? toMediaUrl(contact.profileImageUrl) : null} size="sm" online={isOnlineUser(contact)} />
                    <span>
                      {fullName(contact)}
                      <small>
                        <span className={`chat-presence-label ${isOnlineUser(contact) ? "online" : "offline"}`}>{isOnlineUser(contact) ? "Online" : "Offline"}</span>
                        {contact.email || `ID ${contact.userId}`}
                      </small>
                    </span>
                    <Icon name="send" />
                  </button>
                ))}
              </div>
            </form>
          ) : null}

          <div className="people-strip">
            <div className="strip-head"><strong>People you may know</strong><button type="button" onClick={() => setNewMessageOpen(true)}>See all</button></div>
            <div className="mini-avatar-row">
              {contacts.slice(0, 6).map((contact) => (
                <button key={`strip-${contact.userId}`} type="button" onClick={() => openDirectConversationById(contact.userId)}>
                  <Avatar name={contact.name} src={contact.profileImageUrl ? toMediaUrl(contact.profileImageUrl) : null} size="md" online={isOnlineUser(contact)} />
                  <span>{contact.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <ul className="conversation-list-v2">
            {filteredConversations.map((conversation) => {
              const conversationOnline = isOnlineConversation(conversation, user?.userId);
              return (
                <li key={conversation.conversationId}>
                  <button
                    type="button"
                    className={activeConversationId === conversation.conversationId ? "active" : ""}
                    onClick={() => setActiveConversationId(conversation.conversationId)}
                  >
                    <Avatar name={conversation.title || "Chat"} size="md" online={conversationOnline} />
                    <span>
                      <strong>{conversation.title || `Chat #${conversation.conversationId}`}</strong>
                      <small>
                        <span className={`chat-presence-label ${conversationOnline ? "online" : "offline"}`}>{conversationOnline ? "Online" : "Offline"}</span>
                        {conversation.lastMessage || "No messages yet"}
                      </small>
                    </span>
                    <time>{formatTime(conversation.lastMessageAt) || "Now"}</time>
                    {conversation.unreadCount > 0 ? <b>{conversation.unreadCount}</b> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="chat-thread-card">
          {activeConversation ? (
            <>
              <header className="thread-topbar">
                <Avatar name={activeConversation.title || "Chat"} src={selectedUser?.profileImageUrl ? toMediaUrl(selectedUser.profileImageUrl) : null} size="lg" online={selectedUserOnline} />
                <div>
                  <h2>{activeConversation.title || selectedUser?.fullName || `Conversation #${activeConversation.conversationId}`}</h2>
                  <p><span className={`chat-presence-label ${selectedUserOnline ? "online" : "offline"}`}>{selectedUserOnline ? "Online" : "Offline"}</span> - {activeConversation.type === "GROUP" ? "Group chat" : "Direct message"}</p>
                </div>
                <div className="thread-actions">
                  <button type="button" aria-label="Info" onClick={() => pushToast("Conversation details are shown in the right panel.", "success")}><Icon name="more" /></button>
                </div>
              </header>

              <div className="chat-messages-v2" ref={messageListRef}>
                <div className="day-separator">Today</div>
                {messages.length === 0 ? <EmptyPanel icon="chat" title="No messages yet" subtitle="Start with a quick hello or attach an image." /> : null}
                {messages.map((message) => {
                  const mine = Number(message.senderId) === Number(user?.userId);
                  const attachmentType = String(message.attachmentType || "").toLowerCase();
                  const attachmentUrl = message.attachmentUrl ? toMediaUrl(message.attachmentUrl) : "";
                  return (
                    <article key={message.id} className={`message-bubble-row ${mine ? "mine" : ""}`}>
                      {!mine ? <Avatar name={message.senderName} size="sm" /> : null}
                      <div className="message-bubble">
                        {message.content ? <p>{message.content}</p> : null}
                        {attachmentUrl ? (
                          attachmentType.startsWith("video") ? <video src={attachmentUrl} controls /> : <img src={attachmentUrl} alt="Message attachment" />
                        ) : null}
                        <small>{formatTime(message.createdAt)} {mine ? " - Sent" : ""}</small>
                        <div className="message-reaction-toolbar">
                          {QUICK_REACTIONS.map((label) => (
                            <button key={label} type="button" onClick={() => reactToMessage(message.id, label)} title={label} aria-label={`${label} reaction`}>
                              <span aria-hidden="true">{REACTION_EMOJI[label]}</span>
                              <small>{label}</small>
                            </button>
                          ))}
                        </div>
                        {(reactionsByMessage[message.id] || []).length ? (
                          <div className="message-reaction-stack">
                            {(reactionsByMessage[message.id] || []).map((reaction) => <span key={reaction.id}>{reaction.emoji}</span>)}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>

              {typingUser ? <p className="typing-indicator">{typingUser} is typing...</p> : null}
              {attachmentFile ? <p className="attachment-note">Attached: {attachmentFile.name}</p> : null}

              <form className="message-input-bar" onSubmit={sendMessage}>
                <button type="button" aria-label="Emoji" onClick={() => setMessageText((prev) => `${prev}${prev ? " " : ""}\uD83D\uDE0A`)}><Icon name="smile" /></button>
                <label aria-label="Attach file">
                  <Icon name="attach" />
                  <input type="file" accept="image/*,video/*" onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)} />
                </label>
                <label aria-label="Attach image">
                  <Icon name="image" />
                  <input type="file" accept="image/*" onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)} />
                </label>
                <button type="button" aria-label="Voice" onClick={() => pushToast("Voice messages need recorder permissions before sending.", "success")}><Icon name="mic" /></button>
                <input
                  value={messageText}
                  onChange={(event) => {
                    setMessageText(event.target.value);
                    sendTyping(event.target.value.length > 0);
                  }}
                  placeholder="Type a message..."
                />
                <button type="button" aria-label="More" onClick={() => pushToast("Use image or attachment buttons to add media.", "success")}><Icon name="plus" /></button>
                <Button variant="gradient" icon="send" type="submit">Send</Button>
              </form>
            </>
          ) : (
            <EmptyPanel icon="chat" title="Select a conversation" subtitle="Choose a chat or start a direct message from search." />
          )}
        </Card>

        <Card className="chat-profile-panel">
          {activeConversation ? (
            <>
              <div className="chat-profile-head">
                <Avatar name={activeConversation.title || "User"} src={selectedUser?.profileImageUrl ? toMediaUrl(selectedUser.profileImageUrl) : null} size="xl" online={selectedUserOnline} />
                <h2>{selectedUser?.fullName || activeConversation.title || "Conversation"}</h2>
                <p>{selectedUser?.email || activeConversation.type}</p>
                <StatusBadge status={selectedUserOnline ? "Online" : "Offline"} tone={selectedUserOnline ? "green" : "red"} />
              </div>
              <div className="profile-action-grid">
                <button type="button" onClick={() => navigate(selectedUser?.userId ? `/profile/${selectedUser.userId}` : "/profile")}><Icon name="user" />Profile</button>
                <button type="button" onClick={() => setNewMessageOpen(true)}><Icon name="search" />Search</button>
                <button type="button" onClick={() => pushToast("Conversation muted for this session", "success")}><Icon name="bell" />Mute</button>
              </div>
              <SectionHeader title="Shared Media" action={<button type="button" onClick={() => pushToast("Showing recent shared media", "success")}>See all</button>} />
              <div className="shared-media-grid">
                {messages.filter((message) => message.attachmentUrl).slice(-4).map((message) => (
                  <div key={`media-${message.id}`}>
                    {String(message.attachmentType || "").toLowerCase().startsWith("video")
                      ? <video src={toMediaUrl(message.attachmentUrl)} muted />
                      : <img src={toMediaUrl(message.attachmentUrl)} alt="Shared media" />}
                  </div>
                ))}
              </div>
              <SectionHeader title="Pinned Links" action={<button type="button" onClick={() => pushToast("Pinned links list is visible below", "success")}>See all</button>} />
              <ul className="panel-list">
                <li className="panel-row"><div><strong>Shared product board</strong><span>agrolinkhub.local/marketplace</span></div><Icon name="share" /></li>
                <li className="panel-row"><div><strong>Travel reel</strong><span>community reel link</span></div><Icon name="video" /></li>
              </ul>
              <SectionHeader title="Mutual Friends" />
              <div className="avatar-row">
                {contacts.slice(0, 7).map((contact) => <Avatar key={`mutual-${contact.userId}`} name={contact.name} size="sm" src={contact.profileImageUrl ? toMediaUrl(contact.profileImageUrl) : null} />)}
              </div>
            </>
          ) : <EmptyPanel icon="user" title="No conversation selected" subtitle="Profile details appear after selecting a chat." />}
        </Card>
      </div>
    </PageGrid>
  );
}
