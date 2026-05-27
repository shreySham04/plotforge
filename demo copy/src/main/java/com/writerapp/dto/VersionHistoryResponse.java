package com.writerapp.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VersionHistoryResponse {
    private Long id;
    private Long projectId;
    private Long userId;
    private String username;
    private String contentSnapshot;
    private LocalDateTime createdAt;
}
