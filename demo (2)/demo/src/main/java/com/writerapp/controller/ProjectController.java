package com.writerapp.controller;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.writerapp.dto.CollaboratorInviteRequest;
import com.writerapp.dto.CollaboratorResponse;
import com.writerapp.dto.PageResponse;
import com.writerapp.dto.ProjectCreateRequest;
import com.writerapp.dto.ProjectRelationLinkRequest;
import com.writerapp.dto.ProjectRelationsResponse;
import com.writerapp.dto.ProjectResponse;
import com.writerapp.dto.VersionHistoryResponse;
import com.writerapp.dto.ContentResponse;
import com.writerapp.service.ProjectService;
import com.writerapp.service.VersionHistoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects")
@Validated
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final VersionHistoryService versionHistoryService;

    @GetMapping
    public ResponseEntity<PageResponse<ProjectResponse>> getProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long subjectId
    ) {
        return ResponseEntity.ok(projectService.getProjectsForCurrentUser(page, size, subjectId));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectCreateRequest request
    ) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectForCurrentUser(id));
    }

    @GetMapping("/{id}/relations")
    public ResponseEntity<ProjectRelationsResponse> getProjectRelations(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getRelations(id));
    }

    @PostMapping("/{id}/link")
    public ResponseEntity<ProjectRelationsResponse> linkProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRelationLinkRequest request
    ) {
        return ResponseEntity.ok(projectService.linkProject(id, request));
    }

    @PostMapping("/{id}/link-story/{storyId}")
    public ResponseEntity<ProjectRelationsResponse> linkStory(
            @PathVariable Long id,
            @PathVariable Long storyId
    ) {
        return ResponseEntity.ok(projectService.linkStory(id, storyId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<CollaboratorResponse> inviteCollaborator(
            @PathVariable Long id,
            @Valid @RequestBody CollaboratorInviteRequest request
    ) {
        return ResponseEntity.ok(projectService.inviteCollaborator(id, request));
    }

    @GetMapping("/{id}/collaborators")
    public ResponseEntity<List<CollaboratorResponse>> getCollaborators(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getCollaborators(id));
    }

    @DeleteMapping("/{id}/collaborators/{userId}")
    public ResponseEntity<Void> removeCollaborator(@PathVariable Long id, @PathVariable Long userId) {
        projectService.removeCollaborator(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/share-link")
    public ResponseEntity<Map<String, String>> getShareLink(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("link", projectService.getShareLink(id)));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<PageResponse<VersionHistoryResponse>> getProjectHistory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(versionHistoryService.getProjectHistory(id, page, size));
    }

    @GetMapping("/{id}/history/{versionId}")
    public ResponseEntity<VersionHistoryResponse> getProjectHistoryVersion(
            @PathVariable Long id,
            @PathVariable Long versionId
    ) {
        return ResponseEntity.ok(versionHistoryService.getProjectHistoryVersion(id, versionId));
    }

    @PostMapping("/{id}/history/{versionId}/restore")
    public ResponseEntity<ContentResponse> restoreHistoryVersion(
            @PathVariable Long id,
            @PathVariable Long versionId
    ) {
        return ResponseEntity.ok(versionHistoryService.restoreProjectHistoryVersion(id, versionId));
    }

    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportProjectAsPdf(@PathVariable Long id) {
        byte[] pdf = projectService.exportProjectAsPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=project-" + id + ".pdf")
            .contentType(Objects.requireNonNull(MediaType.APPLICATION_PDF))
                .body(pdf);
    }

    @GetMapping("/{id}/export/txt")
    public ResponseEntity<byte[]> exportProjectAsTxt(@PathVariable Long id) {
        byte[] txt = projectService.exportProjectAsTxt(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=project-" + id + ".txt")
                .contentType(Objects.requireNonNull(MediaType.TEXT_PLAIN))
                .body(txt);
    }
}