package com.writerapp.dto;

import com.writerapp.model.ProjectRelationType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectRelationLinkRequest {

    @NotNull
    private ProjectRelationType relationType = ProjectRelationType.NONE;

    private Long relatedProjectId;

    private Long externalMediaId;

    @Size(max = 255)
    private String externalMediaTitle;
}
