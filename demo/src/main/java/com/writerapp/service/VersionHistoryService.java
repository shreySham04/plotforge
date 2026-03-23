package com.writerapp.service;

import java.util.Objects;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.writerapp.dto.PageResponse;
import com.writerapp.dto.ContentResponse;
import com.writerapp.dto.VersionHistoryResponse;
import com.writerapp.model.Project;
import com.writerapp.model.User;
import com.writerapp.model.VersionHistory;
import com.writerapp.repository.VersionHistoryRepository;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class VersionHistoryService {

    private final VersionHistoryRepository versionHistoryRepository;
    private final CurrentUserService currentUserService;
    private final ProjectPermissionService projectPermissionService;
    private final ContentService contentService;

    @Transactional(readOnly = true)
    public PageResponse<VersionHistoryResponse> getProjectHistory(Long projectId, int page, int size) {
        User user = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, user);

        var result = versionHistoryRepository.findByProjectIdOrderByCreatedAtDesc(projectId, PageRequest.of(page, size));
        return PageResponse.<VersionHistoryResponse>builder()
                .items(result.getContent().stream().map(this::map).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalItems(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .hasNext(result.hasNext())
                .hasPrevious(result.hasPrevious())
                .build();
    }

    @Transactional(readOnly = true)
    public VersionHistoryResponse getProjectHistoryVersion(Long projectId, Long versionId) {
        User user = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, user);

        VersionHistory version = versionHistoryRepository.findById(Objects.requireNonNull(versionId))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Version not found"));

        if (!version.getProject().getId().equals(projectId)) {
            throw new ResponseStatusException(FORBIDDEN, "Version does not belong to the project");
        }

        return map(version);
    }

    @Transactional
    public ContentResponse restoreProjectHistoryVersion(Long projectId, Long versionId) {
        User user = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanEdit(project, user);

        VersionHistory version = versionHistoryRepository.findById(Objects.requireNonNull(versionId))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Version not found"));

        if (!version.getProject().getId().equals(projectId)) {
            throw new ResponseStatusException(FORBIDDEN, "Version does not belong to the project");
        }

        return contentService.restoreFromSnapshot(projectId, version.getContentSnapshot());
    }

    private VersionHistoryResponse map(VersionHistory history) {
        return VersionHistoryResponse.builder()
                .id(history.getId())
                .projectId(history.getProject().getId())
                .userId(history.getUser().getId())
                .username(history.getUser().getUsername())
                .contentSnapshot(history.getContentSnapshot())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
