package com.trackmysubs.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Subscription> subscriptions = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SubscriptionHistory> histories = new ArrayList<>();

    public User() {}

    public User(Long id, String name, String email, String password) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public List<Subscription> getSubscriptions() {
        return subscriptions;
    }

    public void setSubscriptions(List<Subscription> subscriptions) {
        this.subscriptions = subscriptions;
    }

    public List<SubscriptionHistory> getHistories() {
        return histories;
    }

    public void setHistories(List<SubscriptionHistory> histories) {
        this.histories = histories;
    }

    @Column(name = "joined_date", updatable = false)
    private java.time.LocalDateTime joinedDate;

    @PrePersist
    protected void onCreate() {
        this.joinedDate = java.time.LocalDateTime.now();
    }

    public java.time.LocalDateTime getJoinedDate() {
        return joinedDate;
    }

    public void setJoinedDate(java.time.LocalDateTime joinedDate) {
        this.joinedDate = joinedDate;
    }
}
