package com.writerapp.dto;

import com.writerapp.model.FanMediaType;
import com.writerapp.model.FanFutureRelationType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FanFutureCreateRequest {

    @NotBlank
    @Size(max = 180)
    private String title;

    @NotBlank
    private String content;

    @Size(max = 1500)
    private String issuesOrProblems;

    @NotNull
    private Long mediaId;

    @NotBlank
    @Size(max = 255)
    private String mediaTitle;

    @Size(max = 255)
    private String posterPath;

    @NotNull
    private FanMediaType mediaType;

    @NotNull
    private FanFutureRelationType relationType = FanFutureRelationType.THEORY;

    private Long subjectId;
}
