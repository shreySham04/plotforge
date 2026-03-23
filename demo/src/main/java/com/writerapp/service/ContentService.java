package com.writerapp.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.writerapp.dto.ContentResponse;
import com.writerapp.dto.ContentVersionResponse;
import com.writerapp.dto.ContentUpdateRequest;
import com.writerapp.model.Content;
import com.writerapp.model.ContentVersion;
import com.writerapp.model.Project;
import com.writerapp.model.User;
import com.writerapp.repository.ContentRepository;
import com.writerapp.repository.ContentVersionRepository;
import com.writerapp.repository.VersionHistoryRepository;
import com.writerapp.model.VersionHistory;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final ContentVersionRepository contentVersionRepository;
    private final VersionHistoryRepository versionHistoryRepository;
    private final CurrentUserService currentUserService;
    private final ProjectPermissionService projectPermissionService;

    @Transactional(readOnly = true)
    public List<ContentResponse> getProjectContent(Long projectId) {
    User currentUser = currentUserService.getCurrentUser();
    Project project = projectPermissionService.requireProject(projectId);
    projectPermissionService.requireCanView(project, currentUser);

        return contentRepository.findByProjectIdOrderBySectionNumberAsc(projectId)
                .stream()
                .map(this::mapContent)
                .toList();
    }

    @Transactional
    public ContentResponse upsertProjectContent(Long projectId, ContentUpdateRequest request) {
    User editor = currentUserService.getCurrentUser();
    Project project = projectPermissionService.requireProject(projectId);
    projectPermissionService.requireCanEdit(project, editor);

    Content existing = contentRepository.findByProjectIdAndSectionNumber(projectId, request.getSectionNumber())
        .orElse(null);

    if (existing != null && !existing.getText().equals(request.getText())) {
        VersionHistory history = VersionHistory.builder()
            .project(project)
            .user(editor)
            .contentSnapshot("Section " + existing.getSectionNumber() + "\n" + existing.getText())
            .build();
            versionHistoryRepository.save(Objects.requireNonNull(history));
    }

    Content content = existing != null
        ? existing
        : Content.builder()
            .project(project)
            .sectionNumber(request.getSectionNumber())
            .build();

        content.setText(request.getText());
        Content saved = contentRepository.save(content);

        ContentVersion version = ContentVersion.builder()
            .content(saved)
            .projectId(projectId)
            .sectionNumber(saved.getSectionNumber())
            .text(saved.getText())
            .editedBy(editor.getUsername())
            .build();
        contentVersionRepository.save(Objects.requireNonNull(version));

        return mapContent(saved);
    }

    @Transactional(readOnly = true)
    public List<ContentVersionResponse> getProjectContentHistory(Long projectId) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, currentUser);

        return contentVersionRepository.findByProjectIdOrderByEditedAtDesc(projectId)
            .stream()
            .map(version -> ContentVersionResponse.builder()
                .id(version.getId())
                .projectId(version.getProjectId())
                .sectionNumber(version.getSectionNumber())
                .text(version.getText())
                .editedBy(version.getEditedBy())
                .editedAt(version.getEditedAt())
                .build())
            .toList();
    }

    public boolean canEdit(Long projectId, Long userId) {
        Project project = projectPermissionService.requireProject(projectId);
        if (project.getOwner().getId().equals(userId)) {
            return true;
        }

        User user = User.builder().id(userId).build();
        try {
            projectPermissionService.requireCanEdit(project, user);
            return true;
        } catch (ResponseStatusException ex) {
            return false;
        }
    }

    @Transactional
    public ContentResponse restoreFromSnapshot(Long projectId, String snapshot) {
        String[] lines = snapshot.split("\\n", 2);
        if (lines.length == 0 || !lines[0].startsWith("Section ")) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid snapshot format");
        }

        int sectionNumber;
        try {
            sectionNumber = Integer.parseInt(lines[0].replace("Section ", "").trim());
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid section number in snapshot");
        }

        String text = lines.length > 1 ? lines[1] : "";
        ContentUpdateRequest request = new ContentUpdateRequest();
        request.setSectionNumber(sectionNumber);
        request.setText(text);
        return upsertProjectContent(projectId, request);
    }

    private ContentResponse mapContent(Content content) {
        return ContentResponse.builder()
                .id(content.getId())
                .sectionNumber(content.getSectionNumber())
                .text(content.getText())
                .lastUpdated(content.getLastUpdated())
                .build();
    }
}