package com.writerapp.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContentResponse {
    private Long id;
    private Integer sectionNumber;
    private String text;
    private LocalDateTime lastUpdated;
}