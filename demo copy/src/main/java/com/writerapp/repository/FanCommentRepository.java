package com.writerapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.writerapp.model.FanComment;

public interface FanCommentRepository extends JpaRepository<FanComment, Long> {

    List<FanComment> findByPostIdOrderByCreatedAtDesc(Long postId);
}
