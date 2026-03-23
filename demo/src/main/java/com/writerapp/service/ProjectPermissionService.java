package com.writerapp.service;

import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.writerapp.model.Collaborator;
import com.writerapp.model.CollaboratorRole;
import com.writerapp.model.Project;
import com.writerapp.model.User;
import com.writerapp.repository.CollaboratorRepository;
import com.writerapp.repository.ProjectRepository;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class ProjectPermissionService {

    private final ProjectRepository projectRepository;
    private final CollaboratorRepository collaboratorRepository;

    @Transactional(readOnly = true)
    public Project requireProject(Long projectId) {
        return projectRepository.findById(Objects.requireNonNull(projectId))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Project not found"));
    }

    @Transactional(readOnly = true)
    public String accessRole(Project project, User user) {
        if (project.getOwner().getId().equals(user.getId())) {
            return "OWNER";
        }

        Collaborator collaborator = collaboratorRepository.findByProjectIdAndUserId(project.getId(), user.getId())
                .orElse(null);

        if (collaborator == null) {
            throw new ResponseStatusException(FORBIDDEN, "You do not have access to this project");
        }

        return collaborator.getRole().name();
    }

    @Transactional(readOnly = true)
    public void requireCanView(Project project, User user) {
        accessRole(project, user);
    }

    @Transactional(readOnly = true)
    public void requireCanEdit(Project project, User user) {
        String role = accessRole(project, user);
        if (!"OWNER".equals(role) && CollaboratorRole.EDITOR.name().equals(role) == false) {
            throw new ResponseStatusException(FORBIDDEN, "You do not have edit access to this project");
        }
    }

    @Transactional(readOnly = true)
    public void requireOwner(Project project, User user) {
        if (!project.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Only owner can perform this action");
        }
    }

    @Transactional(readOnly = true)
    public boolean canEdit(Project project, User user) {
        try {
            requireCanEdit(project, user);
            return true;
        } catch (ResponseStatusException ex) {
            return false;
        }
    }
}
