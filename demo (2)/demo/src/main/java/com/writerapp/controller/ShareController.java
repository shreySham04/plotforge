package com.writerapp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.writerapp.dto.SharedProjectResponse;
import com.writerapp.service.ProjectService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/share")
@RequiredArgsConstructor
public class ShareController {

    private final ProjectService projectService;

    @GetMapping("/{token}")
    public ResponseEntity<SharedProjectResponse> getSharedProject(@PathVariable String token) {
        return ResponseEntity.ok(projectService.getSharedProjectByToken(token));
    }
}
