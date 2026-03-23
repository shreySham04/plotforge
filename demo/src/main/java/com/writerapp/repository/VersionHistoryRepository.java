package com.writerapp.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.writerapp.model.VersionHistory;

public interface VersionHistoryRepository extends JpaRepository<VersionHistory, Long> {

    Page<VersionHistory> findByProjectIdOrderByCreatedAtDesc(Long projectId, Pageable pageable);
}
