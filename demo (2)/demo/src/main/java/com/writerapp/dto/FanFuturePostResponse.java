package com.writerapp.dto;

import java.time.LocalDateTime;

import com.writerapp.model.FanMediaType;
import com.writerapp.model.FanFutureRelationType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FanFuturePostResponse {

    private Long id;
    private String title;
    private String content;
    private String issuesOrProblems;
    private Long mediaId;
    private String mediaTitle;
    private String posterPath;
    private FanMediaType mediaType;
    private FanFutureRelationType relationType;
    private Long subjectId;
    private String subjectName;
    private Long authorId;
    private String authorUsername;
    private LocalDateTime createdAt;
    private Long likes;
    private Long views;
    private Integer commentCount;
    private Boolean canDelete;
}
