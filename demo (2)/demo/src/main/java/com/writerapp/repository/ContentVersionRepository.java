package com.writerapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.writerapp.model.ContentVersion;

public interface ContentVersionRepository extends JpaRepository<ContentVersion, Long> {

    List<ContentVersion> findByProjectIdOrderByEditedAtDesc(Long projectId);
}
