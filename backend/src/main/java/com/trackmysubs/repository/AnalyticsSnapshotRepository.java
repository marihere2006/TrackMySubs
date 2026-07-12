package com.trackmysubs.repository;

import com.trackmysubs.entity.AnalyticsSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AnalyticsSnapshotRepository extends JpaRepository<AnalyticsSnapshot, Long> {

    /** Find all snapshots for a user, ordered by date ascending */
    List<AnalyticsSnapshot> findByUserIdOrderBySnapshotDateAsc(Long userId);

    /** Find the most recent N snapshots for a user */
    @Query("SELECT a FROM AnalyticsSnapshot a WHERE a.userId = :userId ORDER BY a.snapshotDate DESC")
    List<AnalyticsSnapshot> findRecentByUserId(@Param("userId") Long userId, org.springframework.data.domain.Pageable pageable);

    /** Find a snapshot for a specific user and date */
    Optional<AnalyticsSnapshot> findByUserIdAndSnapshotDate(Long userId, LocalDate snapshotDate);

    /** Check if a snapshot already exists for a user on a given date */
    boolean existsByUserIdAndSnapshotDate(Long userId, LocalDate snapshotDate);

    /** Delete snapshots older than a given date for cleanup */
    void deleteByUserIdAndSnapshotDateBefore(Long userId, LocalDate cutoff);
}
