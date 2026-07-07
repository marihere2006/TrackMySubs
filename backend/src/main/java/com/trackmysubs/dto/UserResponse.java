package com.trackmysubs.dto;

public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private java.time.LocalDateTime joinedDate;

    public UserResponse() {}

    public UserResponse(Long id, String name, String email, java.time.LocalDateTime joinedDate) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.joinedDate = joinedDate;
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

    public java.time.LocalDateTime getJoinedDate() {
        return joinedDate;
    }

    public void setJoinedDate(java.time.LocalDateTime joinedDate) {
        this.joinedDate = joinedDate;
    }
}
