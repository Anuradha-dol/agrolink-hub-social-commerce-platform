package com.socialApp.Lishare.Service;

import com.socialApp.Lishare.Service.interfaces.FriendService;
import com.socialApp.Lishare.dtos.postdTOs.FriendActionResponse;
import com.socialApp.Lishare.dtos.FriendStatus;
import com.socialApp.Lishare.entities.Friend;
import com.socialApp.Lishare.entities.User;
import com.socialApp.Lishare.repos.FriendRepository;
import com.socialApp.Lishare.repos.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements FriendService {

    private final FriendRepository friendRepository;
    private final UserRepo userRepository;

    @Override
    public FriendActionResponse sendFriendRequest(Long senderId, Long receiverId) {

        if (senderId.equals(receiverId)) {
            return new FriendActionResponse("You cannot send request to yourself");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (friendRepository.findFriendship(sender, receiver).isPresent()) {
            return new FriendActionResponse("Friend request already exists");
        }

        Friend friend = Friend.builder()
                .sender(sender)
                .receiver(receiver)
                .status(FriendStatus.PENDING)
                .createdAt(new Date())
                .build();

        friendRepository.save(friend);
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

        friend.setStatus(FriendStatus.ACCEPTED);
        friendRepository.save(friend);

        return new FriendActionResponse("Friend request accepted");
    }

    @Override
    public FriendActionResponse rejectFriendRequest(Long senderId, Long receiverId) {

        User sender = userRepository.findById(senderId).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow();

        Friend friend = friendRepository.findFriendship(sender, receiver)
                .orElseThrow(() -> new RuntimeException("Friend request not found"));

        friend.setStatus(FriendStatus.REJECTED);
        friendRepository.save(friend);

        return new FriendActionResponse("Friend request rejected");
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
}
