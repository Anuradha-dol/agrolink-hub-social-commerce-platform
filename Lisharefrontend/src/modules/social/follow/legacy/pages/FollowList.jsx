import React, { useEffect, useState } from "react";
import { getFollowers, getFollowing, followUser, unfollowUser } from "/src/legacy/followApi";

const FollowList = () => {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const followersData = await getFollowers();
      const followingData = await getFollowing();
      setFollowers(followersData);
      setFollowing(followingData);
    } catch (err) {
      setError("Failed to load follow data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFollow = async (userId) => {
    try {
      await followUser(userId);
      fetchData();
    } catch (err) {
      console.error(err);
      console.warn("Follow action failed");
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await unfollowUser(userId);
      fetchData();
    } catch (err) {
      console.error(err);
      console.warn("Unfollow action failed");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ display: "flex", gap: "3rem", padding: "2rem" }}>
      <div>
        <h2>Followers</h2>
        {followers.length === 0 ? <p>No followers yet</p> : null}
        <ul>
          {followers.map((user) => (
            <li key={user.userId} style={{ marginBottom: "0.5rem" }}>
              {user.firstName} {user.lastName}
              {!following.some((f) => f.userId === user.userId) && (
                <button
                  style={{ marginLeft: "1rem" }}
                  onClick={() => handleFollow(user.userId)}
                >
                  Follow
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Following</h2>
        {following.length === 0 ? <p>Not following anyone</p> : null}
        <ul>
          {following.map((user) => (
            <li key={user.userId} style={{ marginBottom: "0.5rem" }}>
              {user.firstName} {user.lastName}
              <button
                style={{ marginLeft: "1rem" }}
                onClick={() => handleUnfollow(user.userId)}
              >
                Unfollow
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FollowList;
