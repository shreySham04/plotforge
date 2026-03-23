package com.writerapp.dto;

import com.writerapp.model.CollaboratorRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CollaboratorInviteRequest {

    @Size(max = 50)
    private String username;

    @Email
    @Size(max = 100)
    private String email;

    @NotNull
    private CollaboratorRole role;
}