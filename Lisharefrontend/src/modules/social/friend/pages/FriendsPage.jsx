import { useEffect, useState } from "react";
import { friendService } from "../services/friendService";
import { followService } from "/src/modules/social/follow/services/followService";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

function fullName(user) {
  const first = user?.firstName ?? user?.firstname ?? "";
  const last = user?.lastName ?? user?.lastname ?? "";
  return `${first} ${last}`.trim() || "Unknown user";
}

export default function FriendsPage() {
  const { pushToast } = useToast();
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, pendingRes, followingRes] = await Promise.all([
        friendService.getFriends(),
        friendService.getPending(),
        followService.following()
      ]);

      const followingList = Array.isArray(followingRes.data) ? followingRes.data : [];

      setFriends(Array.isArray(friendsRes.data) ? friendsRes.data : []);
      setPending(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setFollowingIds(followingList.map((user) => user.userId));
    } catch {
      pushToast("Failed to load friends", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const search = async () => {
    try {
      const response = await followService.searchUsers(searchQuery);
      setSearchResults(Array.isArray(response.data) ? response.data : []);
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
      <section className="card">
        <h2>People You May Know</h2>
        <div className="inline-form">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people"
          />
          <button className="btn btn-primary" type="button" onClick={search}>
            Search
          </button>
        </div>
        <ul className="user-list">
          {searchResults.map((user) => (
            <li key={user.userId} className="user-row">
              <div>
                <strong>{fullName(user)}</strong>
                <p>{user.email}</p>
              </div>
              <div className="row-actions">
                <button className="btn btn-secondary" type="button" onClick={() => followToggle(user.userId)}>
                  {followingIds.includes(user.userId) ? "Following" : "Follow"}
                </button>
                <button className="btn btn-primary" type="button" onClick={() => sendFriendRequest(user.userId)}>
                  Add Friend
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Pending Requests</h2>
        <ul className="user-list">
          {pending.map((user) => (
            <li key={user.userId} className="user-row">
              <div>
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
              <div>
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
