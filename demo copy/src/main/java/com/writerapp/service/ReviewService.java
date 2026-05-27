package com.writerapp.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.writerapp.dto.ReviewCreateRequest;
import com.writerapp.dto.ReviewResponse;
import com.writerapp.model.Review;
import com.writerapp.model.User;
import com.writerapp.repository.ReviewRepository;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public ReviewResponse createReview(ReviewCreateRequest request) {
        User currentUser = currentUserService.getCurrentUser();

        Review review = Review.builder()
                .title(request.getTitle().trim())
                .reviewText(request.getReviewText().trim())
                .rating(request.getRating())
                .mediaId(request.getMediaId())
                .mediaTitle(request.getMediaTitle().trim())
                .posterPath(request.getPosterPath())
                .mediaType(request.getMediaType())
                .author(currentUser)
                .build();

        return mapReview(reviewRepository.save(review), currentUser);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAllReviews() {
        User currentUser = currentUserService.getCurrentUser();
        return reviewRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(review -> mapReview(review, currentUser))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews() {
        User currentUser = currentUserService.getCurrentUser();
        return reviewRepository.findByAuthorIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(review -> mapReview(review, currentUser))
                .toList();
    }

    @Transactional
    public void deleteReview(Long reviewId) {
        User currentUser = currentUserService.getCurrentUser();
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Review not found"));

        if (!review.getAuthor().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Only author can delete this review");
        }

        reviewRepository.delete(review);
    }

    private ReviewResponse mapReview(Review review, User currentUser) {
        return ReviewResponse.builder()
                .id(review.getId())
                .title(review.getTitle())
                .reviewText(review.getReviewText())
                .rating(review.getRating())
                .mediaId(review.getMediaId())
                .mediaTitle(review.getMediaTitle())
                .posterPath(review.getPosterPath())
                .mediaType(review.getMediaType())
                .authorId(review.getAuthor().getId())
                .authorUsername(review.getAuthor().getUsername())
                .createdAt(review.getCreatedAt())
                .canDelete(review.getAuthor().getId().equals(currentUser.getId()))
                .build();
    }
}
