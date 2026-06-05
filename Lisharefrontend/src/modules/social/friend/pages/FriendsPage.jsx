import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { friendService } from "../services/friendService";
import { followService } from "/src/modules/social/follow/services/followService";
import { feedService } from "/src/modules/social/post/services/feedService";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import {
  Avatar,
  Button,
  Card,
  EmptyPanel,
  Icon,
  Modal,
  PageGrid,
  SectionHeader,
  StatusBadge,
  Tabs
} from "/src/modules/platform/common/ui/DashboardUI";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".avi"];
const PEOPLE_FILTERS = ["People", "Creators", "Mutuals", "Verified"];
const ROLE_FILTERS = ["All Roles", "Farmer", "Business", "Creator"];

function fullName(user) {
  return `${user?.firstName ?? user?.firstname ?? ""} ${user?.lastName ?? user?.lastname ?? ""}`.trim()
    || user?.name
    || user?.email
    || "AgroLink User";
}

function isVideoAsset(url = "") {
  return VIDEO_EXTENSIONS.some((ext) => String(url).toLowerCase().split("?")[0].endsWith(ext));
}

function resolveAuthorId(item) {
  return [item?.authorId, item?.userId, item?.ownerId, item?.originalAuthorId, item?.sharedById]
    .find((value) => Number(value) > 0) || null;
}

function targetPostIdForItem(item) {
  const postId = item?.type === "SHARE" ? item?.originalPostId : item?.postId;
  return Number(postId) > 0 && !item?.originalPostDeleted ? Number(postId) : null;
}

function totalReactions(counts = {}) {
  return Object.values(counts || {}).reduce((total, value) => total + Number(value || 0), 0);
}

function buildCreatorIndex(feedItems = [], reactionCountsByPostId = {}) {
  const map = new Map();
  feedItems.forEach((item) => {
    const targetPostId = targetPostIdForItem(item);
    if (!targetPostId) return;
    const authorId = Number(resolveAuthorId(item));
    if (!authorId) return;
    const reactionCount = totalReactions(reactionCountsByPostId[targetPostId]);
    const createdAt = item.sharedAt || item.createdAt || "";
    const existing = map.get(authorId) || {
      userId: authorId,
      name: item.authorName || item.sharedByName || `User ${authorId}`,
      email: item.authorEmail || "",
      profileImageUrl: item.authorProfilePic || item.profileImageUrl || "",
      role: "Creator",
      mutual: 0,
      media: [],
      postCount: 0,
      reactionCount: 0,
      topPost: null
    };
    existing.postCount += 1;
    existing.reactionCount += reactionCount;
    if (item.imageUrl && existing.media.length < 5) existing.media.push(item.imageUrl);
    const topPostCandidate = {
      postId: targetPostId,
      imageUrl: item.imageUrl || "",
      mediaType: item.mediaType || "",
      content: item.content || "",
      createdAt,
      reactionCount
    };
    if (
      !existing.topPost
      || reactionCount > Number(existing.topPost.reactionCount || 0)
      || (reactionCount === Number(existing.topPost.reactionCount || 0) && new Date(createdAt) > new Date(existing.topPost.createdAt || 0))
    ) {
      existing.topPost = topPostCandidate;
    }
    map.set(authorId, existing);
  });
  return [...map.values()];
}

function hasVerifiedBadge(user) {
  return Boolean(user?.profileVerified || user?.verifiedBadge || Number(user?.verifiedXp || 0) >= 100);
}

function isOnlineUser(user) {
  return Boolean(user?.online || user?.isOnline || user?.presence === "ONLINE");
}

function normalizeRoleLabel(value = "") {
  const text = String(value || "").replace(/^ROLE_/i, "").trim();
  if (!text) return "";
  return text.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function roleText(user) {
  const roles = Array.isArray(user?.roles) ? user.roles.join(" ") : "";
  return `${user?.role || ""} ${roles} ${user?.title || ""}`.toLowerCase();
}

function matchesRoleFilter(user, filter) {
  if (filter === "All Roles") return true;
  if (filter === "Creator") {
    return Number(user?.postCount || 0) > 0 || roleText(user).includes("creator");
  }
  return roleText(user).includes(filter.toLowerCase());
}

export default function FriendsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("discover");
  const [peopleFilter, setPeopleFilter] = useState("People");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [sentPending, setSentPending] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [creators, setCreators] = useState([]);
  const [requestedIds, setRequestedIds] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [removeFriendTarget, setRemoveFriendTarget] = useState(null);

  const followingIds = useMemo(() => following.map((item) => Number(item.userId)), [following]);
  const friendIds = useMemo(() => friends.map((item) => Number(item.userId)), [friends]);
  const pendingIds = useMemo(() => pending.map((item) => Number(item.userId)), [pending]);
  const sentPendingIds = useMemo(() => sentPending.map((item) => Number(item.userId)), [sentPending]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, pendingRes, sentRes, followersRes, followingRes, feedRes] = await Promise.all([
        friendService.getFriends(),
        friendService.getPending(),
        friendService.getSent(),
        followService.followers(),
        followService.following(),
        feedService.getFeed()
      ]);
      setFriends(Array.isArray(friendsRes.data) ? friendsRes.data : []);
      setPending(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setSentPending(Array.isArray(sentRes.data) ? sentRes.data : []);
      setFollowers(Array.isArray(followersRes.data) ? followersRes.data : []);
      setFollowing(Array.isArray(followingRes.data) ? followingRes.data : []);
      const feedItems = Array.isArray(feedRes.data) ? feedRes.data : [];
      const targetPostIds = [...new Set(feedItems.map(targetPostIdForItem).filter(Boolean))];
      const reactionEntries = await Promise.all(
        targetPostIds.map(async (postId) => {
          try {
            const response = await feedService.getReactions(postId);
            return [postId, response.data || {}];
          } catch {
            return [postId, {}];
          }
        })
      );
      setCreators(buildCreatorIndex(feedItems, Object.fromEntries(reactionEntries)));
    } catch {
      pushToast("Failed to load network", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const urlQuery = new URLSearchParams(location.search).get("query") || "";
    if (!urlQuery.trim()) return;
    let active = true;
    setQuery(urlQuery);
    setPeopleFilter("People");
    setRoleFilter("All Roles");
    followService.searchUsers(urlQuery.trim())
      .then((response) => {
        if (!active) return;
        const data = Array.isArray(response.data) ? response.data : [];
        setSearchResults(data.filter((item) => Number(item.userId) !== Number(user?.userId)));
        setTab("discover");
      })
      .catch(() => {
        if (active) pushToast("Failed to search users", "error");
      });
    return () => {
      active = false;
    };
  }, [location.search, pushToast, user?.userId]);

  const discoverUsers = useMemo(() => {
    const connected = new Set([Number(user?.userId), ...friendIds]);
    return searchResults
      .filter((item) => Number(item.userId) > 0 && !connected.has(Number(item.userId)))
      .map((item) => ({
        ...item,
        displayName: fullName(item),
        profileImageUrl: item.profileImageUrl ? toMediaUrl(item.profileImageUrl) : "",
        imageUrl: item.imageUrl ? toMediaUrl(item.imageUrl) : "",
        handle: item.username ? `@${item.username}` : item.email || `@${String(fullName(item)).toLowerCase().replace(/[^a-z0-9]+/g, "")}`,
        role: normalizeRoleLabel(item.role || item.title || ""),
        mutual: Number(item.mutual || item.mutualFriends || 0)
      }));
  }, [friendIds, searchResults, user?.userId]);

  const filteredDiscoverUsers = useMemo(() => {
    const filteredByPeople = discoverUsers.filter((item) => {
      if (peopleFilter === "Creators") {
        return Number(item.postCount || 0) > 0 || roleText(item).includes("creator");
      }
      if (peopleFilter === "Mutuals") {
        return Number(item.mutual || item.mutualFriends || 0) > 0;
      }
      if (peopleFilter === "Verified") {
        return hasVerifiedBadge(item);
      }
      return true;
    });

    return filteredByPeople.filter((item) => matchesRoleFilter(item, roleFilter));
  }, [discoverUsers, peopleFilter, roleFilter]);

  const runSearch = async (event) => {
    event?.preventDefault();
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setPeopleFilter("People");
    setRoleFilter("All Roles");
    try {
      const response = await followService.searchUsers(query.trim());
      const data = Array.isArray(response.data) ? response.data : [];
      setSearchResults(data.filter((item) => Number(item.userId) !== Number(user?.userId)));
      setTab("discover");
    } catch {
      pushToast("Failed to search users", "error");
    }
  };

  const followToggle = async (targetId) => {
    setBusyId(`follow-${targetId}`);
    try {
      if (followingIds.includes(Number(targetId))) {
        await followService.unfollow(targetId);
        pushToast("Unfollowed", "success");
      } else {
        await followService.follow(targetId);
        pushToast("Followed", "success");
      }
      await loadData();
    } catch {
      pushToast("Failed to update follow", "error");
    } finally {
      setBusyId("");
    }
  };

  const sendRequest = async (targetId) => {
    const normalizedId = Number(targetId);
    setBusyId(`request-${normalizedId}`);
    try {
      const response = await friendService.request(normalizedId);
      const message = String(response?.data?.message || "");
      const requestIsPending = /sent|pending/i.test(message);
      if (requestIsPending) {
        setRequestedIds((prev) => (prev.includes(normalizedId) ? prev : [...prev, normalizedId]));
      }
      pushToast(message || (requestIsPending ? "Friend request sent" : "Request not sent"), requestIsPending ? "success" : "error");
      await loadData();
    } catch {
      pushToast("Failed to send request", "error");
    } finally {
      setBusyId("");
    }
  };

  const accept = async (targetId) => {
    setBusyId(`accept-${targetId}`);
    try {
      const response = await friendService.accept(targetId);
      const message = String(response?.data?.message || "");
      const accepted = /accepted/i.test(message);
      pushToast(message || (accepted ? "Request accepted" : "Request not accepted"), accepted ? "success" : "error");
      await loadData();
    } catch {
      pushToast("Failed to accept request", "error");
    } finally {
      setBusyId("");
    }
  };

  const reject = async (targetId) => {
    setBusyId(`reject-${targetId}`);
    try {
      const response = await friendService.reject(targetId);
      const message = String(response?.data?.message || "");
      const rejected = /rejected/i.test(message);
      pushToast(message || (rejected ? "Request rejected" : "Request not rejected"), rejected ? "success" : "error");
      await loadData();
    } catch {
      pushToast("Failed to ignore request", "error");
    } finally {
      setBusyId("");
    }
  };

  const unfriend = async () => {
    const targetId = removeFriendTarget?.userId;
    if (!targetId) return;
    setBusyId(`unfriend-${targetId}`);
    try {
      await friendService.unfriend(targetId);
      pushToast("Friend removed", "success");
      setRemoveFriendTarget(null);
      await loadData();
    } catch {
      pushToast("Failed to remove friend", "error");
    } finally {
      setBusyId("");
    }
  };

  const openChat = (targetId) => {
    navigate("/chat", { state: { startUserId: targetId } });
  };

  const openProfile = (targetId) => {
    const normalizedId = Number(targetId);
    if (!normalizedId) return;
    navigate(normalizedId === Number(user?.userId) ? "/profile" : `/profile/${normalizedId}`);
  };

  const openSuggestedPost = (creator) => {
    const postId = Number(creator?.topPost?.postId || 0);
    if (!postId) return;
    navigate("/home", {
      state: {
        openPostId: postId,
        mode: isVideoAsset(creator?.topPost?.imageUrl || "") || String(creator?.topPost?.mediaType || "").toUpperCase() === "VIDEO" ? "reels" : "posts"
      }
    });
  };

  const networkStats = [
    { label: "Friends", value: friends.length, trend: "Active network", icon: "users", tone: "blue" },
    { label: "Pending", value: pending.length, trend: "Awaiting review", icon: "bell", tone: "pink" },
    { label: "Followers", value: followers.length, trend: "Audience", icon: "users", tone: "purple" },
    { label: "Following", value: following.length, trend: "Creators", icon: "user", tone: "orange" }
  ];

  const activeAccounts = tab === "followers" ? followers : tab === "following" ? following : tab === "friends" ? friends : [];
  const activeAccountsTitle = tab === "followers" ? "No followers yet" : tab === "following" ? "Not following anyone yet" : "Your friend list is empty";
  const activeAccountsSubtitle = tab === "followers"
    ? "People who follow you will appear here."
    : tab === "following"
      ? "Creators and people you follow will appear here."
      : "Add friends and start connecting to see them here.";

  if (loading) return <LoadingState text="Loading friends..." />;

  return (
    <PageGrid className="friends-dashboard">
      <section className="friends-network-hero" aria-label="Friends and network summary">
        <div className="friends-hero-copy">
          <span className="friends-hero-icon"><Icon name="users" /></span>
          <div>
            <p className="eyebrow">Friends & Network</p>
            <h2>Grow your circle, manage requests and keep your social graph active.</h2>
            <p>Search people, discover creators, review requests, and jump into conversations from one clean workspace.</p>
          </div>
        </div>
        <div className="friends-hero-stats">
          {networkStats.map((stat) => (
            <article key={stat.label} className={`friends-stat-tile friends-stat-${stat.tone}`}>
              <span><Icon name={stat.icon} /></span>
              <small>{stat.label}</small>
              <strong>{stat.value}</strong>
              <em>{stat.trend}</em>
            </article>
          ))}
        </div>
      </section>

      <Card className="network-discovery-card">
        <Tabs
          active={tab}
          onChange={setTab}
          className="network-tabs"
          tabs={[
            { value: "discover", label: "Discover", icon: "search", count: filteredDiscoverUsers.length },
            { value: "requests", label: "Requests", icon: "bell", count: pending.length },
            { value: "followers", label: "Followers", icon: "users", count: followers.length },
            { value: "following", label: "Following", icon: "user", count: following.length },
            { value: "friends", label: "Friends", icon: "chat", count: friends.length }
          ]}
        />

        <form className="network-search-row" onSubmit={runSearch}>
          <label>
            <Icon name="search" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPeopleFilter("People");
                setRoleFilter("All Roles");
              }}
              placeholder="Search by name, username, email, or role"
            />
          </label>
          <Button variant="gradient" icon="search" type="submit">Search</Button>
          <Button onClick={() => { setQuery(""); setSearchResults([]); setPeopleFilter("People"); setRoleFilter("All Roles"); }}>Reset</Button>
        </form>

        <div className="friends-filter-stack">
          <div className="filter-pills">
            {PEOPLE_FILTERS.map((item, index) => (
              <button key={item} type="button" className={peopleFilter === item ? "active" : ""} onClick={() => setPeopleFilter(item)}>
                <Icon name={index === 0 ? "user" : index === 3 ? "check" : "spark"} />
                {item}
              </button>
            ))}
          </div>
          <div className="filter-pills role-filter-pills">
            {ROLE_FILTERS.map((item, index) => (
              <button key={item} type="button" className={roleFilter === item ? "active" : ""} onClick={() => setRoleFilter(item)}>
                <Icon name={index === 0 ? "grid" : index === 1 ? "spark" : index === 2 ? "bag" : "users"} />
                {item}
              </button>
            ))}
          </div>
        </div>

        {tab === "discover" ? (
          filteredDiscoverUsers.length ? (
            <div className="people-card-grid">
              {filteredDiscoverUsers.slice(0, 8).map((entry) => {
                const entryUserId = Number(entry.userId);
                const requested = requestedIds.includes(entryUserId) || sentPendingIds.includes(entryUserId);
                const incomingRequest = pendingIds.includes(Number(entry.userId));
                return (
                  <article key={entry.userId} className="friends-person-row">
                    <button type="button" className="friends-person-main" onClick={() => openProfile(entry.userId)}>
                      <Avatar name={entry.displayName} src={entry.profileImageUrl || entry.imageUrl || null} size="xl" online={isOnlineUser(entry)} />
                      <span>
                        <strong>
                          {entry.displayName}
                          {hasVerifiedBadge(entry) ? <StatusBadge status="Verified XP" tone="blue" /> : null}
                        </strong>
                        <small>{entry.handle}</small>
                        {entry.role || Number(entry.mutual || 0) > 0 ? (
                          <em>
                            {entry.role}
                            {entry.role && Number(entry.mutual || 0) > 0 ? " - " : ""}
                            {Number(entry.mutual || 0) > 0 ? `${entry.mutual} mutual connection${Number(entry.mutual) === 1 ? "" : "s"}` : ""}
                          </em>
                        ) : null}
                      </span>
                    </button>
                    <div className="friends-person-actions">
                      {incomingRequest ? (
                        <Button icon="bell" onClick={() => setTab("requests")}>Review Request</Button>
                      ) : (
                        <Button
                          icon="users"
                          variant="gradient"
                          disabled={requested || busyId === `request-${entry.userId}`}
                          onClick={() => sendRequest(entry.userId)}
                        >
                          {requested ? "Request Sent" : "Add Friend"}
                        </Button>
                      )}
                      <Button
                        icon="user"
                        disabled={busyId === `follow-${entry.userId}`}
                        onClick={() => followToggle(entry.userId)}
                      >
                        {followingIds.includes(Number(entry.userId)) ? "Unfollow" : "Follow"}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyPanel
              icon="search"
              title={query.trim() ? "No matching users found" : "Search registered users"}
              subtitle={query.trim() ? "Try another username, email, name, or role from registered users." : "Type a username, email, name, or role above. Only matching registered users will appear here."}
            />
          )
        ) : null}

        {tab === "requests" ? (
          pending.length ? (
            <div className="request-list">
              {pending.map((entry) => (
                <article key={entry.userId} className="request-row">
                  <Avatar name={fullName(entry)} src={entry.profileImageUrl ? toMediaUrl(entry.profileImageUrl) : null} online={isOnlineUser(entry)} />
                  <div>
                    <strong>{fullName(entry)}</strong>
                    <p>
                      {entry.email || "Wants to connect"}
                      {entry.role ? ` - ${normalizeRoleLabel(entry.role)}` : ""}
                      {Number(entry.mutualFriends || 0) > 0 ? ` - ${entry.mutualFriends} mutual friend${Number(entry.mutualFriends) === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <Button variant="gradient" disabled={busyId === `accept-${entry.userId}`} onClick={() => accept(entry.userId)}>Accept</Button>
                  <Button disabled={busyId === `reject-${entry.userId}`} onClick={() => reject(entry.userId)}>Ignore</Button>
                </article>
              ))}
            </div>
          ) : <EmptyPanel icon="bell" title="No pending requests" subtitle="New requests will appear here." />
        ) : null}

        {["followers", "following", "friends"].includes(tab) ? (
          activeAccounts.length ? (
            <div className="account-list-grid">
              {activeAccounts.map((entry) => (
                <article key={entry.userId} className="account-row-card">
                  <Avatar name={fullName(entry)} src={entry.profileImageUrl ? toMediaUrl(entry.profileImageUrl) : null} online={isOnlineUser(entry)} />
                  <div>
                    <strong>{fullName(entry)}{hasVerifiedBadge(entry) ? <StatusBadge status="Verified XP" tone="blue" /> : null}</strong>
                    <p>
                      {entry.username ? `@${entry.username}` : entry.email || `@${String(fullName(entry)).toLowerCase().replace(/[^a-z0-9]+/g, "")}`}
                      {entry.role ? ` - ${normalizeRoleLabel(entry.role)}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={tab === "friends" ? "Friend" : tab} tone="blue" />
                  <Button icon="chat" onClick={() => openChat(entry.userId)}>Chat</Button>
                  <Button icon="user" onClick={() => openProfile(entry.userId)}>Profile</Button>
                  {tab === "following" ? (
                    <Button
                      variant="danger"
                      icon="user"
                      disabled={busyId === `follow-${entry.userId}`}
                      onClick={() => followToggle(entry.userId)}
                    >
                      Unfollow
                    </Button>
                  ) : null}
                  {tab === "followers" ? (
                    <Button
                      icon="user"
                      disabled={busyId === `follow-${entry.userId}`}
                      onClick={() => followToggle(entry.userId)}
                    >
                      {entry.isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  ) : null}
                  {tab === "friends" ? <Button variant="danger" icon="trash" onClick={() => setRemoveFriendTarget(entry)}>Remove</Button> : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyPanel icon={tab === "friends" ? "users" : "user"} title={activeAccountsTitle} subtitle={activeAccountsSubtitle} />
          )
        ) : null}
      </Card>

      <div className="friends-bottom-grid">
        <Card className="friends-suggested-card">
          <SectionHeader
            title="Suggested from your network"
            subtitle="Posts and reels from creators with strong engagement."
            action={creators.length ? <button type="button" className="text-link" onClick={() => setTab("discover")}>View all</button> : null}
          />
          {creators.length ? (
            <div className="suggested-media-grid">
              {creators.slice(0, 3).map((creator) => {
                const media = creator.topPost?.imageUrl || creator.media?.[0];
                return (
                  <button key={`media-${creator.userId}`} type="button" className="suggested-media-card" onClick={() => openSuggestedPost(creator)}>
                    <div>
                      {media ? (
                        isVideoAsset(media) ? <video src={toMediaUrl(media)} muted /> : <img src={toMediaUrl(media)} alt={creator.name} />
                      ) : <Icon name="image" />}
                    </div>
                    <strong>{creator.name}</strong>
                    <span><Icon name="image" /> {creator.postCount} post{creator.postCount === 1 ? "" : "s"}</span>
                    <span><Icon name="heart" /> {Number(creator.topPost?.reactionCount || 0)} reaction{Number(creator.topPost?.reactionCount || 0) === 1 ? "" : "s"}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyPanel icon="image" title="No network posts yet" subtitle="Search creators or follow people to see suggested posts here." />
          )}
        </Card>

        <Card className="friends-side-card">
          <SectionHeader title="Your Friends" subtitle="Quick profile and chat actions." />
          {friends.length ? (
            <ul className="panel-list">
              {friends.slice(0, 6).map((entry) => (
                <li key={`friend-side-${entry.userId}`} className="panel-row friend-side-row">
                  <Avatar name={fullName(entry)} size="sm" online={isOnlineUser(entry)} />
                  <div>
                    <strong>{fullName(entry)}</strong>
                    <span>{isOnlineUser(entry) ? "Online" : "Friend"}</span>
                  </div>
                  <button type="button" className="icon-button" onClick={() => openChat(entry.userId)} aria-label="Open chat">
                    <Icon name="chat" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="friends-empty-state">
              <div className="friends-empty-art" aria-hidden="true">
                <span className="friends-empty-person friends-empty-person-blue"><Icon name="user" /></span>
                <span className="friends-empty-person friends-empty-person-pink"><Icon name="user" /></span>
                <span className="friends-empty-chat"><Icon name="chat" /></span>
              </div>
              <strong>Your friend list is empty</strong>
              <p>Add friends and start connecting to see them here.</p>
              <Button onClick={() => setTab("discover")}>Discover People</Button>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={Boolean(removeFriendTarget)}
        title="Remove Friend"
        subtitle="This removes the person from your friend list but keeps profile and follow options available."
        onClose={busyId ? undefined : () => setRemoveFriendTarget(null)}
        footer={(
          <>
            <Button onClick={() => setRemoveFriendTarget(null)} disabled={Boolean(busyId)}>Cancel</Button>
            <Button variant="danger" icon="trash" onClick={unfriend} disabled={Boolean(busyId)}>
              {busyId ? "Removing..." : "Remove Friend"}
            </Button>
          </>
        )}
      >
        <div className="confirmation-panel">
          <Avatar name={fullName(removeFriendTarget || {})} src={removeFriendTarget?.profileImageUrl ? toMediaUrl(removeFriendTarget.profileImageUrl) : null} size="lg" />
          <div>
            <strong>{fullName(removeFriendTarget || {})}</strong>
            <p>{removeFriendTarget?.email || "Friend connection"}</p>
          </div>
        </div>
      </Modal>
    </PageGrid>
  );
}
