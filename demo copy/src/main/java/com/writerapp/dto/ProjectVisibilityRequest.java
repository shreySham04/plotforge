package com.writerapp.dto;

import lombok.Data;

@Data
public class ProjectVisibilityRequest {
    private Boolean isPublic;
    private Boolean isCompleted;
}
