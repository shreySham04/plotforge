package com.writerapp.dto;

import java.time.LocalDateTime;

import com.writerapp.model.ProjectType;
import com.writerapp.model.ProjectRelationType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private String title;
    private ProjectType type;
    private String ownerUsername;
    private String accessRole;
    private boolean canEdit;
    private ProjectRelationType relationType;
    private Long relatedProjectId;
    private String relatedProjectTitle;
    private ProjectType relatedProjectType;
    private Long externalMediaId;
    private String externalMediaTitle;
    private Long linkedStoryId;
    private String linkedStoryTitle;
    private Long subjectId;
    private String subjectName;
    private LocalDateTime createdAt;
}