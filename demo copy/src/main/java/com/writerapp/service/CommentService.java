package com.writerapp.service;

import java.util.Objects;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.writerapp.dto.CommentCreateRequest;
import com.writerapp.dto.CommentResponse;
import com.writerapp.dto.PageResponse;
import com.writerapp.model.Comment;
import com.writerapp.model.Project;
import com.writerapp.model.User;
import com.writerapp.repository.CommentRepository;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final CurrentUserService currentUserService;
    private final ProjectPermissionService projectPermissionService;

    @Transactional
    public CommentResponse createComment(CommentCreateRequest request) {
        User user = currentUserService.getCurrentUser();
        Long projectId = request.getProjectId();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, user);

        Comment comment = Comment.builder()
                .project(project)
                .user(user)
                .text(request.getText().trim())
                .position(request.getPosition().trim())
                .build();

        return map(commentRepository.save(Objects.requireNonNull(comment)));
    }

    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getComments(Long projectId, int page, int size) {
        User user = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, user);

        var result = commentRepository.findByProjectIdOrderByCreatedAtDesc(projectId, PageRequest.of(page, size));
        return PageResponse.<CommentResponse>builder()
                .items(result.getContent().stream().map(this::map).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalItems(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .hasNext(result.hasNext())
                .hasPrevious(result.hasPrevious())
                .build();
    }

    @Transactional
    public void deleteComment(Long commentId) {
        User user = currentUserService.getCurrentUser();

        Comment comment = commentRepository.findById(Objects.requireNonNull(commentId))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Comment not found"));

        Project project = comment.getProject();
        boolean isOwner = project.getOwner().getId().equals(user.getId());
        boolean isAuthor = comment.getUser().getId().equals(user.getId());
        if (!isOwner && !isAuthor) {
            throw new ResponseStatusException(FORBIDDEN, "You cannot delete this comment");
        }

        commentRepository.delete(comment);
    }

    private CommentResponse map(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .projectId(comment.getProject().getId())
                .userId(comment.getUser().getId())
                .username(comment.getUser().getUsername())
                .text(comment.getText())
                .position(comment.getPosition())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
