package com.writerapp.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.writerapp.model.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    List<Review> findAllByOrderByCreatedAtDesc();
}
