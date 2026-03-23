package com.writerapp.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SharedProjectResponse {
    private ProjectResponse project;
    private List<ContentResponse> content;
}
