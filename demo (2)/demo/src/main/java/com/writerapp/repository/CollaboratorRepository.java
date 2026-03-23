package com.writerapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.writerapp.model.Collaborator;
import com.writerapp.model.CollaboratorRole;

public interface CollaboratorRepository extends JpaRepository<Collaborator, Long> {

    List<Collaborator> findByProjectId(Long projectId);

    Optional<Collaborator> findByProjectIdAndUserId(Long projectId, Long userId);

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);

    boolean existsByProjectIdAndUserIdAndRole(Long projectId, Long userId, CollaboratorRole role);

    void deleteByProjectIdAndUserId(Long projectId, Long userId);
}