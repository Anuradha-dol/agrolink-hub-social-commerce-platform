export const ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    verifyOtp: "/auth/verify-code",
    resendOtp: "/auth/resend-otp"
  },
  forgotPassword: {
    sendOtp: "/forgotpass/send-otp",
    resendOtp: "/forgotpass/resend-otp",
    verifyOtp: "/forgotpass/verify-otp",
    changePassword: "/forgotpass/change-password"
  },
  user: {
    me: "/user/me",
    publicProfile: (userId) => `/api/users/${userId}/profile`,
    updateName: "/user/update-name",
    updateProfileDetails: "/user/profile-details",
    updateEmail: "/user/update-email",
    verifyNewEmail: "/user/verify-new-email",
    updatePassword: "/user/update-password",
    deleteAccount: "/user/delete",
    requestDeleteOtp: "/user/delete-forgot-request",
    verifyDeleteOtp: "/user/delete-forgot-verify",
    uploadProfileImage: "/user/upload-profile-image",
    uploadCoverImage: "/user/upload-cover-image"
  },
  feed: {
    postsFeed: "/posts/feed",
    myPosts: "/posts/my",
    createPost: "/posts/create",
    deletePost: (postId) => `/posts/delete/${postId}`,
    commentAdd: (postId) => `/comments/${postId}/add`,
    commentReply: (postId, parentCommentId) => `/comments/${postId}/reply/${parentCommentId}`,
    commentUpdate: (commentId) => `/comments/${commentId}/update`,
    commentDelete: (commentId) => `/comments/${commentId}/delete`,
    comments: (postId) => `/comments/${postId}/all`,
    reaction: (postId) => `/reactions/${postId}`,
    reactionCounts: (postId) => `/reactions/${postId}/counts`,
    reactionUsers: (postId) => `/reactions/${postId}/users`,
    share: (postId) => `/shares/${postId}/share`,
    shareDelete: (shareId) => `/shares/${shareId}`,
    sharedFeed: "/shares/feed",
    savePost: (postId) => `/api/posts/${postId}/save`,
    savedPosts: "/api/posts/saved",
    reportPost: (postId) => `/api/posts/${postId}/report`
  },
  follow: {
    search: "/follow/search",
    follow: (userId) => `/follow/${userId}/follow`,
    unfollow: (userId) => `/follow/${userId}/unfollow`,
    followers: "/follow/followers",
    following: "/follow/following",
    followersForUser: (userId) => `/follow/${userId}/followers`,
    followingForUser: (userId) => `/follow/${userId}/following`,
    followersCount: "/follow/followers/count",
    followingCount: "/follow/following/count",
    followersCountForUser: (userId) => `/follow/${userId}/followers/count`,
    followingCountForUser: (userId) => `/follow/${userId}/following/count`
  },
  friend: {
    all: "/api/friends/all",
    allForUser: (userId) => `/api/friends/${userId}/all`,
    pending: "/api/friends/pending",
    request: (userId) => `/api/friends/${userId}/request`,
    accept: (userId) => `/api/friends/${userId}/accept`,
    reject: (userId) => `/api/friends/${userId}/reject`,
    unfriend: (userId) => `/api/friends/${userId}/unfriend`
  },
  notifications: {
    list: "/api/notifications",
    unreadCount: "/api/notifications/unread-count",
    markRead: (id) => `/api/notifications/${id}/read`,
    readAll: "/api/notifications/read-all",
    clearAll: "/api/notifications"
  },
  business: {
    pages: "/api/business/pages",
    myPages: "/api/business/pages/mine"
  },
  products: {
    list: "/api/products",
    item: (id) => `/api/products/${id}`,
    byBusiness: (businessPageId) => `/api/products/business/${businessPageId}`
  },
  orders: {
    create: "/api/orders",
    mine: "/api/orders/my",
    business: "/api/orders/business",
    get: (id) => `/api/orders/${id}`,
    cancel: (id) => `/api/orders/${id}`,
    updateStatus: (id) => `/api/orders/${id}/status`
  },
  admin: {
    users: "/api/admin/users",
    updateRole: (userId) => `/api/admin/users/${userId}/role`,
    updateModeration: (userId) => `/api/admin/users/${userId}/moderation`,
    deleteUser: (userId) => `/api/admin/users/${userId}`,
    stats: "/api/admin/stats",
    reports: "/api/admin/reports",
    reportStatus: (reportId) => `/api/admin/reports/${reportId}/status`
  },
  reviews: {
    list: "/reviews",
    mine: "/reviews/gets",
    create: "/reviews",
    update: (id) => `/reviews/${id}`,
    delete: (id) => `/reviews/${id}`
  },
  support: {
    list: "/support",
    mine: "/support/my",
    create: "/support",
    respond: (id) => `/support/${id}/respond`,
    delete: (id) => `/support/${id}`
  },
  chat: {
    conversations: "/api/chat/conversations",
    directConversation: (otherUserId) => `/api/chat/conversations/direct/${otherUserId}`,
    groupConversation: "/api/chat/conversations/group",
    messages: (conversationId) => `/api/chat/conversations/${conversationId}/messages`,
    seen: (conversationId) => `/api/chat/conversations/${conversationId}/seen`,
    addMember: (conversationId) => `/api/chat/conversations/${conversationId}/members`,
    removeMember: (conversationId, userId) => `/api/chat/conversations/${conversationId}/members/${userId}`,
    attachments: "/api/chat/attachments",
    reactions: (messageId) => `/api/chat/messages/${messageId}/reactions`,
    reaction: (messageId) => `/api/chat/messages/${messageId}/reaction`
  },
  stories: {
    create: "/api/stories",
    feed: "/api/stories/feed",
    share: (storyId) => `/api/stories/${storyId}/share`,
    react: (storyId) => `/api/stories/${storyId}/reactions`,
    view: (storyId) => `/api/stories/${storyId}/view`,
    reply: (storyId) => `/api/stories/${storyId}/reply`,
    delete: (storyId) => `/api/stories/${storyId}`
  },
  userBlocks: {
    block: (userId) => `/api/users/${userId}/block`,
    unblock: (userId) => `/api/users/${userId}/block`,
    list: "/api/users/blocks"
  }
};
