package com.writerapp.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FanCommentResponse {

    private Long id;
    private Long postId;
    private Long userId;
    private String username;
    private String text;
    private LocalDateTime createdAt;
}
