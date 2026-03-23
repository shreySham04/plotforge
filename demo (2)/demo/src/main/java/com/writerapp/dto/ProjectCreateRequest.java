package com.writerapp.dto;

import com.writerapp.model.ProjectType;
import com.writerapp.model.ProjectRelationType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectCreateRequest {

    @NotBlank
    @Size(max = 120)
    private String title;

    @NotNull
    private ProjectType type;

    @NotNull
    private ProjectRelationType relationType = ProjectRelationType.NONE;

    private Long relatedProjectId;

    private Long externalMediaId;

    @Size(max = 255)
    private String externalMediaTitle;

    private Long subjectId;

    private Long linkedStoryId;
}