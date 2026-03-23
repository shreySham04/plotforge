package com.writerapp.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.writerapp.dto.FanCommentCreateRequest;
import com.writerapp.dto.FanCommentResponse;
import com.writerapp.dto.FanFutureCreateRequest;
import com.writerapp.dto.FanFuturePostResponse;
import com.writerapp.model.FanMediaType;
import com.writerapp.service.FanFutureService;
import com.writerapp.service.FanFutureService.PostSort;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/fanfuture")
@Validated
@RequiredArgsConstructor
public class FanFutureController {

    private final FanFutureService fanFutureService;

    @GetMapping
    public ResponseEntity<List<FanFuturePostResponse>> getPosts(
            @RequestParam(required = false) FanMediaType mediaType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "RECENT") PostSort sort,
            @RequestParam(required = false) Integer limit
    ) {
        return ResponseEntity.ok(fanFutureService.getAllPosts(mediaType, search, sort, limit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FanFuturePostResponse> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(fanFutureService.getPostById(id));
    }

    @PostMapping
    public ResponseEntity<FanFuturePostResponse> createPost(@Valid @RequestBody FanFutureCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fanFutureService.createPost(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        fanFutureService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<FanFuturePostResponse> likePost(@PathVariable Long id) {
        return ResponseEntity.ok(fanFutureService.likePost(id));
    }

    @PostMapping("/comments")
    public ResponseEntity<FanCommentResponse> createComment(@Valid @RequestBody FanCommentCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fanFutureService.createComment(request));
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<List<FanCommentResponse>> getComments(@PathVariable Long postId) {
        return ResponseEntity.ok(fanFutureService.getComments(postId));
    }
}
