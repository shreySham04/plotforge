package com.writerapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SubjectCreateRequest {

    @NotBlank
    @Size(max = 80)
    private String name;
}
