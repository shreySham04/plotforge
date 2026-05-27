package com.writerapp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.writerapp.dto.ContentResponse;
import com.writerapp.dto.ContentVersionResponse;
import com.writerapp.dto.ContentUpdateRequest;
import com.writerapp.service.ContentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/content")
@Validated
@RequiredArgsConstructor
public class ContentController {

    private final ContentService contentService;

    @GetMapping("/{projectId}")
    public ResponseEntity<List<ContentResponse>> getProjectContent(@PathVariable Long projectId) {
        return ResponseEntity.ok(contentService.getProjectContent(projectId));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ContentResponse> updateProjectContent(
            @PathVariable Long projectId,
            @Valid @RequestBody ContentUpdateRequest request
    ) {
        return ResponseEntity.ok(contentService.upsertProjectContent(projectId, request));
    }

    @GetMapping("/{projectId}/history")
    public ResponseEntity<List<ContentVersionResponse>> getProjectContentHistory(@PathVariable Long projectId) {
        return ResponseEntity.ok(contentService.getProjectContentHistory(projectId));
    }
}