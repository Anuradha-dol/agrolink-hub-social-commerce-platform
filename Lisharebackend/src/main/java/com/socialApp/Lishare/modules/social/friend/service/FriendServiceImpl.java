package com.socialApp.Lishare.modules.social.friend.service;

import com.socialApp.Lishare.modules.social.friend.service.FriendService;
import com.socialApp.Lishare.modules.social.friend.dto.FriendActionResponse;
import com.socialApp.Lishare.modules.social.friend.dto.FriendStatus;
import com.socialApp.Lishare.modules.social.friend.entity.Friend;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.friend.repository.FriendRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements FriendService {

    private final FriendRepository friendRepository;
    private final UserRepo userRepository;
    private final NotificationService notificationService;

    @Override
    public FriendActionResponse sendFriendRequest(Long senderId, Long receiverId) {

        if (senderId.equals(receiverId)) {
            return new FriendActionResponse("You cannot send request to yourself");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Optional<Friend> existingFriendship = friendRepository.findFriendship(sender, receiver);
        if (existingFriendship.isPresent()) {
            Friend existing = existingFriendship.get();
            if (existing.getStatus() == FriendStatus.ACCEPTED) {
                return new FriendActionResponse("Already friends");
            }
            if (existing.getStatus() == FriendStatus.PENDING) {
                return new FriendActionResponse("Friend request already pending");
            }

            existing.setSender(sender);
            existing.setReceiver(receiver);
            existing.setStatus(FriendStatus.PENDING);
            existing.setCreatedAt(new Date());
            friendRepository.save(existing);
            publishFriendRequestNotification(sender, receiver);
            return new FriendActionResponse("Friend request sent successfully");
        }

        Friend friend = Friend.builder()
                .sender(sender)
                .receiver(receiver)
                .status(FriendStatus.PENDING)
                .createdAt(new Date())
                .build();

        friendRepository.save(friend);

        publishFriendRequestNotification(sender, receiver);

        return new FriendActionResponse("Friend request sent successfully");
    }

    @Override
    public FriendActionResponse acceptFriendRequest(Long senderId, Long receiverId) {

        User sender = userRepository.findById(senderId).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow();

        Friend friend = friendRepository.findFriendship(sender, receiver)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (friend.getStatus() != FriendStatus.PENDING) {
            return new FriendActionResponse("Request is not pending");
        }

        if (!friend.getReceiver().getUserId().equals(receiverId)) {
            return new FriendActionResponse("Only the request receiver can accept this request");
        }

        friend.setStatus(FriendStatus.ACCEPTED);
        friendRepository.save(friend);

        notificationService.publish(Notification.builder()
                .user(sender)
                .actorUser(receiver)
                .type(NotificationType.FRIEND_REQUEST)
                .referenceId(receiver.getUserId())
                .referenceType("USER")
                .message(receiver.getFirstname() + " " + receiver.getLastName() + " accepted your friend request")
                .read(false)
                .build());

        return new FriendActionResponse("Friend request accepted");
    }

    @Override
    public FriendActionResponse rejectFriendRequest(Long senderId, Long receiverId) {

        User sender = userRepository.findById(senderId).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow();

        Friend friend = friendRepository.findFriendship(sender, receiver)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (!friend.getReceiver().getUserId().equals(receiverId)) {
            return new FriendActionResponse("Only the request receiver can reject this request");
        }

        friend.setStatus(FriendStatus.REJECTED);
        friendRepository.save(friend);

        return new FriendActionResponse("Friend request rejected");
    }

    @Override
    public FriendActionResponse cancelFriendRequest(Long senderId, Long receiverId) {

        User sender = userRepository.findById(senderId).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow();

        Friend friend = friendRepository.findFriendship(sender, receiver)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        if (friend.getStatus() != FriendStatus.PENDING) {
            return new FriendActionResponse("Request is not pending");
        }

        if (!friend.getSender().getUserId().equals(senderId)) {
            return new FriendActionResponse("Only the request sender can cancel this request");
        }

        friendRepository.delete(friend);
        return new FriendActionResponse("Friend request cancelled");
    }

    @Override
    public FriendActionResponse unfriend(Long user1Id, Long user2Id) {

        User user1 = userRepository.findById(user1Id).orElseThrow();
        User user2 = userRepository.findById(user2Id).orElseThrow();

        Friend friend = friendRepository.findFriendship(user1, user2)
                .orElseThrow(() -> new RuntimeException("Friendship not found"));

        friendRepository.delete(friend);
        return new FriendActionResponse("Unfriended successfully");
    }

    @Override
    public List<User> getFriends(Long userId) {

        User user = userRepository.findById(userId).orElseThrow();

        return friendRepository.findAcceptedFriends(user)
                .stream()
                .map(f -> f.getSender().equals(user) ? f.getReceiver() : f.getSender())
                .toList();
    }

    @Override
    public List<User> getPendingRequests(Long userId) {

        User user = userRepository.findById(userId).orElseThrow();

        return friendRepository.findByReceiverAndStatus(user, FriendStatus.PENDING)
                .stream()
                .map(Friend::getSender)
                .toList();
    }

    @Override
    public List<User> getSentRequests(Long userId) {

        User user = userRepository.findById(userId).orElseThrow();

        return friendRepository.findBySenderAndStatus(user, FriendStatus.PENDING)
                .stream()
                .map(Friend::getReceiver)
                .toList();
    }

    private void publishFriendRequestNotification(User sender, User receiver) {
        notificationService.publish(Notification.builder()
                .user(receiver)
                .actorUser(sender)
                .type(NotificationType.FRIEND_REQUEST)
                .referenceId(sender.getUserId())
                .referenceType("USER")
                .message(sender.getFirstname() + " " + sender.getLastName() + " sent you a friend request")
                .read(false)
                .build());
    }
}
