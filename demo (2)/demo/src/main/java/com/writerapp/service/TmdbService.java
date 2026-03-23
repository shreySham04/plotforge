package com.writerapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
@RequiredArgsConstructor
public class TmdbService {

    private static final String TMDB_BASE_URL = "https://api.themoviedb.org/3";
    private static final int TMDB_MAX_ATTEMPTS = 5;
    private static final long TMDB_RETRY_DELAY_MS = 350;

    private final RestTemplate restTemplate;

    @Value("${app.tmdb.api-key:}")
    private String tmdbApiKey;

    public JsonNode searchMedia(String query) {
        requireApiKey();

        if (!StringUtils.hasText(query)) {
            throw new ResponseStatusException(BAD_REQUEST, "query is required");
        }

        String url = UriComponentsBuilder.fromHttpUrl(TMDB_BASE_URL + "/search/multi")
                .queryParam("api_key", tmdbApiKey)
                .queryParam("query", query.trim())
                .toUriString();

        return getJson(url);
    }

    public JsonNode getMovieDetails(Long id) {
        requireApiKey();
        String url = UriComponentsBuilder.fromHttpUrl(TMDB_BASE_URL + "/movie/{id}")
                .queryParam("api_key", tmdbApiKey)
                .buildAndExpand(id)
                .toUriString();
        return getJson(url);
    }

    public JsonNode getTvDetails(Long id) {
        requireApiKey();
        String url = UriComponentsBuilder.fromHttpUrl(TMDB_BASE_URL + "/tv/{id}")
                .queryParam("api_key", tmdbApiKey)
                .buildAndExpand(id)
                .toUriString();
        return getJson(url);
    }

    private JsonNode getJson(String url) {
        RestClientException lastException = null;

        for (int attempt = 1; attempt <= TMDB_MAX_ATTEMPTS; attempt++) {
            try {
                ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);
                return response.getBody();
            } catch (RestClientException ex) {
                lastException = ex;

                if (attempt < TMDB_MAX_ATTEMPTS) {
                    try {
                        Thread.sleep(TMDB_RETRY_DELAY_MS * attempt);
                    } catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        throw new ResponseStatusException(
                SERVICE_UNAVAILABLE,
                "TMDB service is temporarily unreachable. Please try again.",
                lastException
        );
    }

    private void requireApiKey() {
        if (!StringUtils.hasText(tmdbApiKey)) {
            throw new ResponseStatusException(BAD_REQUEST, "TMDB API key is not configured");
        }
    }
}
