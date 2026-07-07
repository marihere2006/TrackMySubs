package com.trackmysubs.repository;

import com.trackmysubs.entity.Subscription;
import com.trackmysubs.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, String> {
    List<Subscription> findByUser(User user);
    Optional<Subscription> findByIdAndUser(String id, User user);
}
