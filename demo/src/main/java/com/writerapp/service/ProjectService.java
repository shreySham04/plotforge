package com.writerapp.service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.writerapp.dto.CollaboratorInviteRequest;
import com.writerapp.dto.CollaboratorResponse;
import com.writerapp.dto.ContentResponse;
import com.writerapp.dto.PageResponse;
import com.writerapp.dto.ProjectCreateRequest;
import com.writerapp.dto.ProjectRelationLinkRequest;
import com.writerapp.dto.ProjectRelationsResponse;
import com.writerapp.dto.ProjectResponse;
import com.writerapp.dto.SharedProjectResponse;
import com.writerapp.model.Collaborator;
import com.writerapp.model.Content;
import com.writerapp.model.Project;
import com.writerapp.model.ProjectRelationType;
import com.writerapp.model.ProjectType;
import com.writerapp.model.Subject;
import com.writerapp.model.User;
import com.writerapp.repository.CollaboratorRepository;
import com.writerapp.repository.ContentRepository;
import com.writerapp.repository.ProjectRepository;
import com.writerapp.repository.SubjectRepository;
import com.writerapp.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ContentRepository contentRepository;
    private final CollaboratorRepository collaboratorRepository;
    private final SubjectRepository subjectRepository;
    private final CurrentUserService currentUserService;
    private final ProjectPermissionService projectPermissionService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> getProjectsForCurrentUser(int page, int size, Long subjectId) {
        User currentUser = currentUserService.getCurrentUser();
        var result = projectRepository.findAllAccessibleByUserIdAndSubjectId(
                currentUser.getId(),
                subjectId,
                PageRequest.of(page, size)
        );

        return PageResponse.<ProjectResponse>builder()
                .items(result.getContent().stream().map(project -> mapProject(project, currentUser)).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalItems(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .hasNext(result.hasNext())
                .hasPrevious(result.hasPrevious())
                .build();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsForCurrentUser() {
        User currentUser = currentUserService.getCurrentUser();
        return projectRepository.findAllAccessibleByUserId(currentUser.getId())
                .stream()
                .map(project -> mapProject(project, currentUser))
                .toList();
    }

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request) {
        User currentUser = currentUserService.getCurrentUser();

        Project project = Project.builder()
                .title(request.getTitle().trim())
                .type(request.getType())
                .relationType(request.getRelationType() == null ? ProjectRelationType.NONE : request.getRelationType())
                .owner(currentUser)
                .shareToken(UUID.randomUUID().toString().replace("-", ""))
                .build();

        applyProjectSubject(project, request.getSubjectId());
        applyProjectRelation(project, request.getRelationType(), request.getRelatedProjectId(), request.getExternalMediaId(), request.getExternalMediaTitle());
        applyStoryLink(project, request.getLinkedStoryId());

        Project saved = projectRepository.save(Objects.requireNonNull(project));
        return mapProject(saved, currentUser);
    }

    @Transactional
    public ProjectResponse updateProject(Long projectId, ProjectCreateRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanEdit(project, currentUser);

        if (request.getType() != project.getType()) {
            throw new ResponseStatusException(BAD_REQUEST, "Project type cannot be changed");
        }

        project.setTitle(request.getTitle().trim());
        applyProjectSubject(project, request.getSubjectId());
        applyProjectRelation(project, request.getRelationType(), request.getRelatedProjectId(), request.getExternalMediaId(), request.getExternalMediaTitle());
        applyStoryLink(project, request.getLinkedStoryId());

        Project saved = projectRepository.save(project);
        return mapProject(saved, currentUser);
    }

    @Transactional(readOnly = true)
    public ProjectRelationsResponse getRelations(Long projectId) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, currentUser);
        return mapRelations(project);
    }

    @Transactional
    public ProjectRelationsResponse linkProject(Long projectId, ProjectRelationLinkRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanEdit(project, currentUser);

        applyProjectRelation(
                project,
                request.getRelationType(),
                request.getRelatedProjectId(),
                request.getExternalMediaId(),
                request.getExternalMediaTitle()
        );

        Project saved = projectRepository.save(project);
        return mapRelations(saved);
    }

    @Transactional
    public ProjectRelationsResponse linkStory(Long projectId, Long storyId) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanEdit(project, currentUser);

        if (project.getType() != ProjectType.SCRIPT) {
            throw new ResponseStatusException(BAD_REQUEST, "Only SCRIPT projects can link to stories");
        }

        Project story = projectPermissionService.requireProject(storyId);
        projectPermissionService.requireCanView(story, currentUser);

        if (story.getType() != ProjectType.STORY) {
            throw new ResponseStatusException(BAD_REQUEST, "linked story must have STORY type");
        }

        if (Objects.equals(project.getId(), story.getId())) {
            throw new ResponseStatusException(BAD_REQUEST, "project cannot link to itself");
        }

        project.setLinkedStory(story);
        Project saved = projectRepository.save(project);
        return mapRelations(saved);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectForCurrentUser(Long projectId) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, currentUser);
        return mapProject(project, currentUser);
    }

    @Transactional
    public void deleteProject(Long projectId) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireOwner(project, currentUser);
        projectRepository.delete(Objects.requireNonNull(project));
    }

    @Transactional
    public CollaboratorResponse inviteCollaborator(Long projectId, CollaboratorInviteRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireOwner(project, currentUser);

        String username = request.getUsername() == null ? "" : request.getUsername().trim();
        String email = request.getEmail() == null ? "" : request.getEmail().trim();

        if (username.isEmpty() && email.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "username or email is required");
        }

        User invitedUser = userRepository.findByUsernameOrEmail(username, email)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Invited user not found"));

        if (invitedUser.getId().equals(project.getOwner().getId())) {
            throw new ResponseStatusException(BAD_REQUEST, "Owner is already part of project");
        }

        Collaborator collaborator = collaboratorRepository.findByProjectIdAndUserId(projectId, invitedUser.getId())
                .orElseGet(() -> Collaborator.builder()
                        .project(project)
                        .user(invitedUser)
                        .build());

        collaborator.setRole(request.getRole());
        Collaborator saved = collaboratorRepository.save(collaborator);
        return mapCollaborator(saved, false);
    }

    @Transactional(readOnly = true)
    public List<CollaboratorResponse> getCollaborators(Long projectId) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, currentUser);

        List<CollaboratorResponse> responses = collaboratorRepository.findByProjectId(projectId)
                .stream()
                .map(collaborator -> mapCollaborator(collaborator, false))
                .toList();

        CollaboratorResponse owner = CollaboratorResponse.builder()
                .id(0L)
                .userId(project.getOwner().getId())
                .username(project.getOwner().getUsername())
                .email(project.getOwner().getEmail())
                .role(null)
                .owner(true)
                .build();

        return java.util.stream.Stream.concat(java.util.stream.Stream.of(owner), responses.stream()).toList();
    }

    @Transactional
    public void removeCollaborator(Long projectId, Long userId) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireOwner(project, currentUser);

        if (project.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(BAD_REQUEST, "Owner cannot be removed");
        }

        if (!collaboratorRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ResponseStatusException(NOT_FOUND, "Collaborator not found");
        }

        collaboratorRepository.deleteByProjectIdAndUserId(projectId, userId);
    }

    @Transactional(readOnly = true)
    public String getShareLink(Long projectId) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, currentUser);

        if (project.getShareToken() == null || project.getShareToken().isBlank()) {
            project.setShareToken(UUID.randomUUID().toString().replace("-", ""));
            projectRepository.save(project);
        }

        return frontendBaseUrl + "/shared/" + project.getShareToken();
    }

    @Transactional(readOnly = true)
    public SharedProjectResponse getSharedProjectByToken(String token) {
        Project project = projectRepository.findByShareToken(token)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Shared project not found"));

        List<ContentResponse> content = contentRepository.findByProjectIdOrderBySectionNumberAsc(project.getId())
                .stream()
                .map(this::mapContent)
                .toList();

        return SharedProjectResponse.builder()
                .project(ProjectResponse.builder()
                        .id(project.getId())
                        .title(project.getTitle())
                        .type(project.getType())
                        .ownerUsername(project.getOwner().getUsername())
                        .accessRole("VIEWER")
                        .canEdit(false)
                        .createdAt(project.getCreatedAt())
                        .build())
                .content(content)
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] exportProjectAsPdf(Long projectId) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, currentUser);

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, output);
        document.open();

        Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
        document.add(new Paragraph(project.getTitle() + " (" + project.getType() + ")", titleFont));
        document.add(new Paragraph("\n"));

        List<Content> sections = contentRepository.findByProjectIdOrderBySectionNumberAsc(projectId);

        for (Content section : sections) {
            String sectionLabel = project.getType().name().equals("STORY") ? "Chapter " : "Scene ";
            document.add(new Paragraph(sectionLabel + section.getSectionNumber(), new Font(Font.HELVETICA, 14, Font.BOLD)));
            document.add(new Paragraph(section.getText() == null ? "" : section.getText()));
            document.add(new Paragraph("\n"));
        }

        document.close();
        return output.toByteArray();
    }

    @Transactional(readOnly = true)
    public byte[] exportProjectAsTxt(Long projectId) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, currentUser);

        StringBuilder builder = new StringBuilder();
        builder.append(project.getTitle()).append(" (").append(project.getType()).append(")\n\n");

        List<Content> sections = contentRepository.findByProjectIdOrderBySectionNumberAsc(projectId);
        for (Content section : sections) {
            String sectionLabel = project.getType().name().equals("STORY") ? "Chapter " : "Scene ";
            builder.append(sectionLabel)
                    .append(section.getSectionNumber())
                    .append("\n")
                    .append(section.getText() == null ? "" : section.getText())
                    .append("\n\n");
        }

        return builder.toString().getBytes(StandardCharsets.UTF_8);
    }

    private ProjectResponse mapProject(Project project, User currentUser) {
        String role = project.getOwner().getId().equals(currentUser.getId())
                ? "OWNER"
                : collaboratorRepository.findByProjectIdAndUserId(project.getId(), currentUser.getId())
                    .map(c -> c.getRole().name())
                    .orElse("VIEWER");

        Project relatedProject = project.getRelatedProject();
        Project linkedStory = project.getLinkedStory();
        Subject subject = project.getSubject();

        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .type(project.getType())
                .ownerUsername(project.getOwner().getUsername())
                .accessRole(role)
                .canEdit("OWNER".equals(role) || "EDITOR".equals(role))
                .relationType(project.getRelationType())
                .relatedProjectId(relatedProject == null ? null : relatedProject.getId())
                .relatedProjectTitle(relatedProject == null ? null : relatedProject.getTitle())
                .relatedProjectType(relatedProject == null ? null : relatedProject.getType())
                .externalMediaId(project.getExternalMediaId())
                .externalMediaTitle(project.getExternalMediaTitle())
                .linkedStoryId(linkedStory == null ? null : linkedStory.getId())
                .linkedStoryTitle(linkedStory == null ? null : linkedStory.getTitle())
                .subjectId(subject == null ? null : subject.getId())
                .subjectName(subject == null ? null : subject.getName())
                .createdAt(project.getCreatedAt())
                .build();
    }

    private ProjectRelationsResponse mapRelations(Project project) {
        Project relatedProject = project.getRelatedProject();
        Project linkedStory = project.getLinkedStory();

        return ProjectRelationsResponse.builder()
                .projectId(project.getId())
                .projectTitle(project.getTitle())
                .relationType(project.getRelationType())
                .relatedProjectId(relatedProject == null ? null : relatedProject.getId())
                .relatedProjectTitle(relatedProject == null ? null : relatedProject.getTitle())
                .relatedProjectType(relatedProject == null ? null : relatedProject.getType())
                .externalMediaId(project.getExternalMediaId())
                .externalMediaTitle(project.getExternalMediaTitle())
                .linkedStoryId(linkedStory == null ? null : linkedStory.getId())
                .linkedStoryTitle(linkedStory == null ? null : linkedStory.getTitle())
                .build();
    }

    private void applyProjectSubject(Project project, Long subjectId) {
        if (subjectId == null) {
            project.setSubject(null);
            return;
        }

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Subject not found"));
        project.setSubject(subject);
    }

    private void applyProjectRelation(
            Project project,
            ProjectRelationType relationType,
            Long relatedProjectId,
            Long externalMediaId,
            String externalMediaTitle
    ) {
        ProjectRelationType finalRelationType = relationType == null ? ProjectRelationType.NONE : relationType;
        project.setRelationType(finalRelationType);

        if (finalRelationType == ProjectRelationType.NONE) {
            project.setRelatedProject(null);
            project.setExternalMediaId(null);
            project.setExternalMediaTitle(null);
            return;
        }

        boolean hasRelatedProject = relatedProjectId != null;
        boolean hasExternalMedia = externalMediaId != null;

        if (hasRelatedProject == hasExternalMedia) {
            throw new ResponseStatusException(BAD_REQUEST, "Provide either relatedProjectId or externalMediaId");
        }

        if (hasRelatedProject) {
            Project relatedProject = projectPermissionService.requireProject(relatedProjectId);
            User currentUser = currentUserService.getCurrentUser();
            projectPermissionService.requireCanView(relatedProject, currentUser);

            if (project.getId() != null && project.getId().equals(relatedProject.getId())) {
                throw new ResponseStatusException(BAD_REQUEST, "project cannot relate to itself");
            }

            validateNoCircularRelation(project, relatedProject);
            project.setRelatedProject(relatedProject);
            project.setExternalMediaId(null);
            project.setExternalMediaTitle(null);
            return;
        }

        project.setRelatedProject(null);
        project.setExternalMediaId(externalMediaId);
        project.setExternalMediaTitle(externalMediaTitle == null ? null : externalMediaTitle.trim());
    }

    private void validateNoCircularRelation(Project project, Project candidate) {
        if (project.getId() == null) {
            return;
        }

        Project cursor = candidate;
        while (cursor != null) {
            if (project.getId().equals(cursor.getId())) {
                throw new ResponseStatusException(BAD_REQUEST, "Circular project relation is not allowed");
            }
            cursor = cursor.getRelatedProject();
        }
    }

    private void applyStoryLink(Project project, Long linkedStoryId) {
        if (linkedStoryId == null) {
            project.setLinkedStory(null);
            return;
        }

        if (project.getType() != ProjectType.SCRIPT) {
            throw new ResponseStatusException(BAD_REQUEST, "linkedStoryId is only valid for SCRIPT projects");
        }

        Project story = projectPermissionService.requireProject(linkedStoryId);
        User currentUser = currentUserService.getCurrentUser();
        projectPermissionService.requireCanView(story, currentUser);
        if (story.getType() != ProjectType.STORY) {
            throw new ResponseStatusException(BAD_REQUEST, "linkedStoryId must reference a STORY project");
        }
        project.setLinkedStory(story);
    }

    private CollaboratorResponse mapCollaborator(Collaborator collaborator, boolean owner) {
        return CollaboratorResponse.builder()
                .id(collaborator.getId())
                .userId(collaborator.getUser().getId())
                .username(collaborator.getUser().getUsername())
                .email(collaborator.getUser().getEmail())
                .role(collaborator.getRole())
                .owner(owner)
                .build();
    }

    private ContentResponse mapContent(Content content) {
        return ContentResponse.builder()
                .id(content.getId())
                .sectionNumber(content.getSectionNumber())
                .text(content.getText())
                .lastUpdated(content.getLastUpdated())
                .build();
    }
}
