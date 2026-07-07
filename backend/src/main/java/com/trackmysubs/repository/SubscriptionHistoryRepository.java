package com.trackmysubs.repository;

import com.trackmysubs.entity.SubscriptionHistory;
import com.trackmysubs.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubscriptionHistoryRepository extends JpaRepository<SubscriptionHistory, String> {
    List<SubscriptionHistory> findByUser(User user);
}
