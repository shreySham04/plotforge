package com.writerapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FanCommentCreateRequest {

    @NotNull
    private Long postId;

    @NotBlank
    @Size(max = 2000)
    private String text;
}
