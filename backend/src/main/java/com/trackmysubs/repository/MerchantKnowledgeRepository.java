package com.trackmysubs.repository;

import com.trackmysubs.entity.MerchantKnowledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface MerchantKnowledgeRepository extends JpaRepository<MerchantKnowledge, Long> {

    Optional<MerchantKnowledge> findByNormalizedName(String normalizedName);

    boolean existsByNormalizedName(String normalizedName);

    @Modifying
    @Transactional
    @Query("UPDATE MerchantKnowledge m SET m.lastUsedAt = :now WHERE m.normalizedName = :name")
    void touchLastUsed(@Param("name") String normalizedName, @Param("now") LocalDateTime now);
}
