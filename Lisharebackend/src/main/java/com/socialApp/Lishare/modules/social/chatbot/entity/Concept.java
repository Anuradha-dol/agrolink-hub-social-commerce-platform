package com.socialApp.Lishare.modules.social.chatbot.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "concepts")
public class Concept {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String topic;

    @Column(columnDefinition = "TEXT")
    private String keywords;

    @Column(columnDefinition = "TEXT")
    private String description;

    public Concept() {}

    public Concept(String topic, String description) {
        this.topic = topic;
        this.description = description;
    }

    public Concept(String topic, String keywords, String description) {
        this.topic = topic;
        this.keywords = keywords;
        this.description = description;
    }

    public Long getId() { return id; }
    public String getTopic() { return topic; }
    public String getKeywords() { return keywords; }
    public String getDescription() { return description; }

    public void setTopic(String topic) { this.topic = topic; }
    public void setKeywords(String keywords) { this.keywords = keywords; }
    public void setDescription(String description) { this.description = description; }
}
