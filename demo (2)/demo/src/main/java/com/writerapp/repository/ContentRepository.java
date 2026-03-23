package com.writerapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.writerapp.model.Content;

public interface ContentRepository extends JpaRepository<Content, Long> {

    List<Content> findByProjectIdOrderBySectionNumberAsc(Long projectId);

    Optional<Content> findByProjectIdAndSectionNumber(Long projectId, Integer sectionNumber);
}