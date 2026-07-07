package com.trackmysubs.service;

import com.trackmysubs.dto.ProfileRequest;
import com.trackmysubs.dto.UserResponse;
import com.trackmysubs.entity.User;
import com.trackmysubs.exception.InvalidRequestException;
import com.trackmysubs.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;

    public UserResponse getProfile(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getJoinedDate());
    }

    @Transactional
    public UserResponse updateProfile(ProfileRequest request, User currentUser) {
        // Check if email is already used by another user
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent() && !existingUser.get().getId().equals(currentUser.getId())) {
            throw new InvalidRequestException("Email is already in use by another user");
        }

        currentUser.setName(request.getName());
        currentUser.setEmail(request.getEmail());

        User savedUser = userRepository.save(currentUser);
        return new UserResponse(savedUser.getId(), savedUser.getName(), savedUser.getEmail(), savedUser.getJoinedDate());
    }

    @Transactional
    public void deleteProfile(User currentUser) {
        userRepository.delete(currentUser);
    }
}
