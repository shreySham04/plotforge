package com.writerapp.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommentResponse {
    private Long id;
    private Long projectId;
    private Long userId;
    private String username;
    private String text;
    private String position;
    private LocalDateTime createdAt;
}
