package com.writerapp.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContentVersionResponse {
    private Long id;
    private Long projectId;
    private Integer sectionNumber;
    private String text;
    private String editedBy;
    private LocalDateTime editedAt;
}
