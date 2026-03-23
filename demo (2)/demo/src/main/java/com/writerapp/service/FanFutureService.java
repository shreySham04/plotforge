package com.writerapp.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.writerapp.dto.FanCommentCreateRequest;
import com.writerapp.dto.FanCommentResponse;
import com.writerapp.dto.FanFutureCreateRequest;
import com.writerapp.dto.FanFuturePostResponse;
import com.writerapp.model.FanComment;
import com.writerapp.model.FanFuturePost;
import com.writerapp.model.FanMediaType;
import com.writerapp.model.Subject;
import com.writerapp.model.User;
import com.writerapp.repository.FanCommentRepository;
import com.writerapp.repository.FanFutureRepository;
import com.writerapp.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class FanFutureService {

    @Value("${app.owner.username:}")
    private String ownerUsername;

    public enum PostSort {
        RECENT,
        MOST_LIKED,
        TRENDING
    }

    private final FanFutureRepository fanFutureRepository;
    private final FanCommentRepository fanCommentRepository;
    private final SubjectRepository subjectRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public FanFuturePostResponse createPost(FanFutureCreateRequest request) {
        User currentUser = currentUserService.getCurrentUser();

        FanFuturePost post = FanFuturePost.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
            .issuesOrProblems(request.getIssuesOrProblems() == null ? null : request.getIssuesOrProblems().trim())
                .mediaId(request.getMediaId())
                .mediaTitle(request.getMediaTitle().trim())
                .posterPath(request.getPosterPath())
                .mediaType(request.getMediaType())
            .relationType(request.getRelationType())
            .subject(resolveSubject(request.getSubjectId()))
                .author(currentUser)
                .build();

        return mapPost(fanFutureRepository.save(post), currentUser);
    }

    @Transactional(readOnly = true)
    public List<FanFuturePostResponse> getAllPosts(FanMediaType mediaType, String search, PostSort sort, Integer limit) {
        User currentUser = currentUserService.getCurrentUser();
        String searchValue = (search == null || search.isBlank()) ? null : search.trim();
        List<FanFuturePost> posts = switch (sort == null ? PostSort.RECENT : sort) {
            case MOST_LIKED -> fanFutureRepository.findMostLiked(mediaType, searchValue);
            case TRENDING -> fanFutureRepository.findTrending(mediaType, searchValue);
            default -> fanFutureRepository.findRecent(mediaType, searchValue);
        };

        int max = (limit == null || limit <= 0) ? posts.size() : Math.min(limit, posts.size());
        return posts.stream().limit(max).map(post -> mapPost(post, currentUser)).toList();
    }

    @Transactional(readOnly = true)
    public FanFuturePostResponse getPostById(Long id) {
        User currentUser = currentUserService.getCurrentUser();
        FanFuturePost post = fanFutureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Fan Future post not found"));

        return mapPost(post, currentUser);
    }

    @Transactional
    public void deletePost(Long id) {
        User currentUser = currentUserService.getCurrentUser();

        FanFuturePost post = fanFutureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Fan Future post not found"));

        if (!canDelete(post, currentUser)) {
            throw new ResponseStatusException(FORBIDDEN, "Only author or site owner can delete this post");
        }

        fanFutureRepository.delete(post);
    }

    @Transactional
    public FanFuturePostResponse likePost(Long id) {
        User currentUser = currentUserService.getCurrentUser();
        FanFuturePost post = fanFutureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Fan Future post not found"));

        post.setLikes(post.getLikes() + 1);
        return mapPost(fanFutureRepository.save(post), currentUser);
    }

    @Transactional
    public FanCommentResponse createComment(FanCommentCreateRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        FanFuturePost post = fanFutureRepository.findById(request.getPostId())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Fan Future post not found"));

        FanComment comment = FanComment.builder()
                .post(post)
                .user(currentUser)
                .text(request.getText().trim())
                .build();

        return mapComment(fanCommentRepository.save(comment));
    }

    @Transactional(readOnly = true)
    public List<FanCommentResponse> getComments(Long postId) {
        if (!fanFutureRepository.existsById(postId)) {
            throw new ResponseStatusException(NOT_FOUND, "Fan Future post not found");
        }

        return fanCommentRepository.findByPostIdOrderByCreatedAtDesc(postId)
                .stream()
                .map(this::mapComment)
                .toList();
    }

    private FanFuturePostResponse mapPost(FanFuturePost post, User currentUser) {
        Subject subject = post.getSubject();

        return FanFuturePostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .issuesOrProblems(post.getIssuesOrProblems())
                .mediaId(post.getMediaId())
                .mediaTitle(post.getMediaTitle())
                .posterPath(post.getPosterPath())
                .mediaType(post.getMediaType())
                .relationType(post.getRelationType())
                .subjectId(subject == null ? null : subject.getId())
                .subjectName(subject == null ? null : subject.getName())
                .authorId(post.getAuthor().getId())
                .authorUsername(post.getAuthor().getUsername())
                .createdAt(post.getCreatedAt())
                .likes(post.getLikes())
                .views(post.getViews())
                .commentCount(post.getComments() == null ? 0 : post.getComments().size())
                .canDelete(canDelete(post, currentUser))
                .build();
    }

    private boolean canDelete(FanFuturePost post, User currentUser) {
        if (post.getAuthor().getId().equals(currentUser.getId())) {
            return true;
        }

        String configuredOwner = ownerUsername == null ? "" : ownerUsername.trim();
        return !configuredOwner.isEmpty() && configuredOwner.equalsIgnoreCase(currentUser.getUsername());
    }

    private Subject resolveSubject(Long subjectId) {
        if (subjectId == null) {
            return null;
        }

        return subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Subject not found"));
    }

    private FanCommentResponse mapComment(FanComment comment) {
        return FanCommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .userId(comment.getUser().getId())
                .username(comment.getUser().getUsername())
                .text(comment.getText())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
