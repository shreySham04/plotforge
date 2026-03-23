package com.writerapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommentCreateRequest {

    @NotNull
    @Positive
    private Long projectId;

    @NotBlank
    @Size(min = 1, max = 1000)
    private String text;

    @NotBlank
    @Size(max = 120)
    private String position;
}
