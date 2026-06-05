package com.socialApp.Lishare.modules.business.review.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String comment;
    private int rating; // 1 to 5
    private String status; // positive / neutral / negative
    private LocalDateTime createdAt;

    private Long userId;
    private String username;
    private Long businessPageId;
    private String businessPageName;
    private Long orderId;

    public Review() {}

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public Long getBusinessPageId() { return businessPageId; }
    public void setBusinessPageId(Long businessPageId) { this.businessPageId = businessPageId; }
    public String getBusinessPageName() { return businessPageName; }
    public void setBusinessPageName(String businessPageName) { this.businessPageName = businessPageName; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
}
