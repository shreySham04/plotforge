package com.writerapp.dto;

import com.writerapp.model.FanMediaType;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReviewCreateRequest {

    @NotBlank
    @Size(max = 180)
    private String title;

    @NotBlank
    private String reviewText;

    @NotNull
    @Min(1)
    @Max(10)
    private Integer rating;

    @NotNull
    private Long mediaId;

    @NotBlank
    @Size(max = 255)
    private String mediaTitle;

    @Size(max = 255)
    private String posterPath;

    @NotNull
    private FanMediaType mediaType;
}
