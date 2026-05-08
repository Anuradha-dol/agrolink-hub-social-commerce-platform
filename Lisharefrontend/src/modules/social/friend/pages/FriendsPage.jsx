import { useEffect, useMemo, useState } from "react";
import { friendService } from "../services/friendService";
import { followService } from "/src/modules/social/follow/services/followService";
import { feedService } from "/src/modules/social/post/services/feedService";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v", ".ogg", ".avi"];

function fullName(user) {
  const first = user?.firstName ?? user?.firstname ?? "";
  const last = user?.lastName ?? user?.lastname ?? "";
  return `${first} ${last}`.trim() || user?.name || "Unknown user";
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const second = parts[1]?.[0] || "";
  return `${first}${second}`.toUpperCase();
}

function isVideoAsset(url = "") {
  const normalized = String(url).toLowerCase().split("?")[0];
  return VIDEO_EXTENSIONS.some((ext) => normalized.endsWith(ext));
}

function resolveAuthorId(item) {
  const candidates = [
    item?.authorId,
    item?.userId,
    item?.ownerId,
    item?.originalAuthorId,
    item?.sharedById
  ];
  const resolved = candidates.find((value) => Number(value) > 0);
  return resolved ? Number(resolved) : null;
}

function buildCreatorIndex(feedItems = []) {
  const map = new Map();

  feedItems.forEach((item) => {
    const authorId = resolveAuthorId(item);
    if (!authorId) return;

    const existing = map.get(authorId) || {
      userId: authorId,
      name: item.authorName || item.sharedByName || `User ${authorId}`,
      email: item.authorEmail || "",
      profileImageUrl: item.authorProfilePic || item.authorProfileImage || item.profileImageUrl || "",
      media: [],
      postCount: 0
    };

    existing.postCount += 1;
    if (item.imageUrl && existing.media.length < 4) {
      existing.media.push(item.imageUrl);
    }

    map.set(authorId, existing);
  });

  return map;
}

export default function FriendsPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [creatorIndex, setCreatorIndex] = useState({});
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [requestedIds, setRequestedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, pendingRes, followingRes, feedRes] = await Promise.all([
        friendService.getFriends(),
        friendService.getPending(),
        followService.following(),
        feedService.getFeed()
      ]);

      const followingList = Array.isArray(followingRes.data) ? followingRes.data : [];
      const friendsList = Array.isArray(friendsRes.data) ? friendsRes.data : [];
      const pendingList = Array.isArray(pendingRes.data) ? pendingRes.data : [];
      const feedItems = Array.isArray(feedRes.data) ? feedRes.data : [];
      const creatorMap = buildCreatorIndex(feedItems);

      setFriends(friendsList);
      setPending(pendingList);
      setFollowingIds(followingList.map((user) => user.userId));
      setPendingIds(pendingList.map((u) => u.userId));
      setCreatorIndex(Object.fromEntries(creatorMap.entries()));
    } catch {
      pushToast("Failed to load friends", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const discoverSuggestions = useMemo(() => {
    const connectedUserIds = new Set([
      user?.userId,
      ...friends.map((friend) => friend.userId),
      ...followingIds
    ]);

    return Object.values(creatorIndex)
      .filter((item) => !connectedUserIds.has(item.userId))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 18);
  }, [creatorIndex, friends, followingIds, user?.userId]);

  const discoverResults = searchResults.length > 0 ? searchResults : discoverSuggestions;

  const search = async (event) => {
    event?.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await followService.searchUsers(searchQuery);
      const payload = Array.isArray(response.data) ? response.data : [];
      const enriched = payload.map((entry) => {
        const indexed = creatorIndex[entry.userId] || {};
        return {
          ...entry,
          media: indexed.media || [],
          postCount: indexed.postCount || 0
        };
      }).filter((entry) => Number(entry.userId) > 0 && entry.userId !== user?.userId);
      setSearchResults(enriched);
    } catch {
      pushToast("Failed to search users", "error");
    }
  };

  const accept = async (userId) => {
    try {
      await friendService.accept(userId);
      pushToast("Friend request accepted", "success");
      loadData();
    } catch {
      pushToast("Failed to accept friend request", "error");
    }
  };

  const reject = async (userId) => {
    try {
      await friendService.reject(userId);
      pushToast("Friend request rejected", "success");
      loadData();
    } catch {
      pushToast("Failed to reject friend request", "error");
    }
  };

  const followToggle = async (userId) => {
    try {
      if (followingIds.includes(userId)) {
        await followService.unfollow(userId);
      } else {
        await followService.follow(userId);
      }
      await loadData();
    } catch {
      pushToast("Failed to update follow status", "error");
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await friendService.request(userId);
      setRequestedIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      pushToast("Friend request sent", "success");
      loadData();
    } catch {
      pushToast("Failed to send friend request", "error");
    }
  };

  const unfriend = async (userId) => {
    if (!window.confirm("Remove this friend?")) return;
    try {
      await friendService.unfriend(userId);
      pushToast("Friend removed", "success");
      loadData();
    } catch {
      pushToast("Failed to unfriend", "error");
    }
  };

  if (loading) return <LoadingState text="Loading friends..." />;

  return (
    <div className="friends-page">
      <section className="page-hero">
        <div>
          <h2>Friends & Network</h2>
          <p>Grow your circle, manage requests and keep your social graph active.</p>
        </div>
        <div className="hero-stats">
          <article>
            <strong>{friends.length}</strong>
            <span>Friends</span>
          </article>
          <article>
            <strong>{pending.length}</strong>
            <span>Pending</span>
          </article>
          <article>
            <strong>{discoverSuggestions.length}</strong>
            <span>Suggestions</span>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Discover People</h2>
        <form className="friend-search-bar" onSubmit={search}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name or email"
          />
          <div className="friend-search-actions">
            <button className="btn btn-primary" type="submit">Search</button>
            <button className="btn btn-secondary" type="button" onClick={() => { setSearchQuery(""); setSearchResults([]); }}>
              Reset
            </button>
          </div>
        </form>

        {selectedProfile ? (
          <article className="profile-preview-card">
            <div className="profile-preview-head">
              <div className="discover-avatar">{initials(fullName(selectedProfile))}</div>
              <div>
                <strong>{fullName(selectedProfile)}</strong>
                <p className="muted">{selectedProfile.email || `User ID: ${selectedProfile.userId}`}</p>
              </div>
            </div>
            <p className="muted">
              {selectedProfile.postCount || 0} recent post{(selectedProfile.postCount || 0) === 1 ? "" : "s"} in discover feed
            </p>
            {selectedProfile.media?.length ? (
              <div className="reels-grid">
                {selectedProfile.media.slice(0, 3).map((media, index) => (
                  <div key={`${selectedProfile.userId}-${index}`} className="suggestion-media">
                    {isVideoAsset(media) ? (
                      <video src={toMediaUrl(media)} controls preload="metadata" />
                    ) : (
                      <img src={toMediaUrl(media)} alt={fullName(selectedProfile)} />
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ) : null}

        <ul className="discover-grid">
          {discoverResults.map((entry) => {
            const userData = {
              ...entry,
              firstName: entry.firstName ?? entry.firstname ?? entry.name?.split(" ")?.[0] ?? "",
              lastName: entry.lastName ?? entry.lastname ?? entry.name?.split(" ")?.slice(1).join(" ") ?? ""
            };
            const media = entry.media || [];
            const topMedia = media[0] || "";
            const hasMedia = Boolean(topMedia);
            const following = followingIds.includes(entry.userId);
            const requestSent = pendingIds.includes(entry.userId) || requestedIds.includes(entry.userId);

            return (
            <li key={entry.userId} className="discover-card">
              <div className="suggestion-media">
                {hasMedia ? (
                  isVideoAsset(topMedia) ? (
                    <video src={toMediaUrl(topMedia)} preload="metadata" muted controls />
                  ) : (
                    <img src={toMediaUrl(topMedia)} alt={fullName(userData)} />
                  )
                ) : (
                  <div className="discover-avatar" style={{ width: "100%", height: "176px", borderRadius: 0 }}>
                    {initials(fullName(userData))}
                  </div>
                )}
                <span className="suggestion-badge">{hasMedia && isVideoAsset(topMedia) ? "Video" : "Photo"}</span>
              </div>
              <div className="discover-body">
                <strong>{fullName(userData)}</strong>
                <p>{entry.email || `User ID: ${entry.userId}`}</p>
                <div className="discover-metrics">
                  <span className="chip">{entry.postCount || 0} posts</span>
                  <span className="chip">{following ? "Following" : "Not Following"}</span>
                </div>
              </div>
              <div className="row-actions discover-actions">
                <button className="btn btn-secondary" type="button" onClick={() => setSelectedProfile(userData)}>
                  View
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => followToggle(entry.userId)}>
                  {following ? "Unfollow" : "Follow"}
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => sendFriendRequest(entry.userId)}
                  disabled={requestSent}
                >
                  {requestSent ? "Requested" : "Add Friend"}
                </button>
              </div>
            </li>
          );
          })}
        </ul>
      </section>

      <section className="card">
        <h2>Pending Requests</h2>
        <ul className="user-list">
          {pending.map((user) => (
            <li key={user.userId} className="user-row">
              <div className="row-identity">
                <span className="user-mini-avatar">{initials(fullName(user))}</span>
                <strong>{fullName(user)}</strong>
              </div>
              <div className="row-actions">
                <button className="btn btn-primary" type="button" onClick={() => accept(user.userId)}>
                  Accept
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => reject(user.userId)}>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Friends</h2>
        <ul className="user-list">
          {friends.map((user) => (
            <li key={user.userId} className="user-row">
              <div className="row-identity">
                <span className="user-mini-avatar">{initials(fullName(user))}</span>
                <strong>{fullName(user)}</strong>
              </div>
              <div className="row-actions">
                <button className="btn btn-secondary" type="button" onClick={() => unfriend(user.userId)}>
                  Unfriend
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
