package com.writerapp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.writerapp.service.TmdbService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tmdb")
@RequiredArgsConstructor
public class TmdbController {

    private final TmdbService tmdbService;

    @GetMapping("/search")
    public ResponseEntity<JsonNode> search(@RequestParam String query) {
        return ResponseEntity.ok(tmdbService.searchMedia(query));
    }

    @GetMapping("/movie/{id}")
    public ResponseEntity<JsonNode> movie(@PathVariable Long id) {
        return ResponseEntity.ok(tmdbService.getMovieDetails(id));
    }

    @GetMapping("/tv/{id}")
    public ResponseEntity<JsonNode> tv(@PathVariable Long id) {
        return ResponseEntity.ok(tmdbService.getTvDetails(id));
    }
}
