package com.writerapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ContentUpdateRequest {

    @NotNull
    @Positive
    private Integer sectionNumber;

    @NotBlank
    private String text;
}