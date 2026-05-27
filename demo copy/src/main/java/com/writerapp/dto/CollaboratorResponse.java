package com.writerapp.dto;

import com.writerapp.model.CollaboratorRole;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CollaboratorResponse {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private CollaboratorRole role;
    private boolean owner;
}