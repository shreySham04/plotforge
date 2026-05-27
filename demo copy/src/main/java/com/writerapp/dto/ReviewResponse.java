package com.writerapp.dto;

import java.time.LocalDateTime;

import com.writerapp.model.FanMediaType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewResponse {

    private Long id;
    private String title;
    private String reviewText;
    private Integer rating;
    private Long mediaId;
    private String mediaTitle;
    private String posterPath;
    private FanMediaType mediaType;
    private Long authorId;
    private String authorUsername;
    private LocalDateTime createdAt;
    private Boolean canDelete;
}
