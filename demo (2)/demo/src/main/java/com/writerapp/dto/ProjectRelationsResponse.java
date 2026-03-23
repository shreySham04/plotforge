package com.writerapp.dto;

import com.writerapp.model.ProjectRelationType;
import com.writerapp.model.ProjectType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectRelationsResponse {
    private Long projectId;
    private String projectTitle;
    private ProjectRelationType relationType;
    private Long relatedProjectId;
    private String relatedProjectTitle;
    private ProjectType relatedProjectType;
    private Long externalMediaId;
    private String externalMediaTitle;
    private Long linkedStoryId;
    private String linkedStoryTitle;
}
