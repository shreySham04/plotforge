# Full Updated Code (Sequential Batches)

## Batch 1

### demo (2)/demo/src/main/java/com/writerapp/model/Project.java
```java
package com.writerapp.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "projects", indexes = {
    @Index(name = "idx_projects_owner", columnList = "owner_id"),
    @Index(name = "idx_projects_share_token", columnList = "share_token")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectType type;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "share_token", length = 64, unique = true)
    private String shareToken;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Content> contentSections = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Collaborator> collaborators = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();
}
```

### demo (2)/demo/src/main/java/com/writerapp/model/Content.java
```java
package com.writerapp.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "contents",
    uniqueConstraints = @UniqueConstraint(name = "uk_project_section", columnNames = {"project_id", "section_number"}),
    indexes = {
        @Index(name = "idx_contents_project", columnList = "project_id")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Content {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private Integer sectionNumber;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String text;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime lastUpdated;
}
```

### demo (2)/demo/src/main/java/com/writerapp/model/Collaborator.java
```java
package com.writerapp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "collaborators",
    uniqueConstraints = @UniqueConstraint(name = "uk_project_user", columnNames = {"project_id", "user_id"}),
    indexes = {
        @Index(name = "idx_collab_project", columnList = "project_id"),
        @Index(name = "idx_collab_user", columnList = "user_id")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Collaborator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CollaboratorRole role;
}
```

### demo (2)/demo/src/main/java/com/writerapp/model/VersionHistory.java
```java
package com.writerapp.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "version_history", indexes = {
        @Index(name = "idx_version_history_project", columnList = "project_id"),
        @Index(name = "idx_version_history_created", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VersionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String contentSnapshot;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

### demo (2)/demo/src/main/java/com/writerapp/model/Comment.java
```java
package com.writerapp.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "comments", indexes = {
        @Index(name = "idx_comments_project", columnList = "project_id"),
        @Index(name = "idx_comments_created", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 1000)
    private String text;

    @Column(nullable = false, length = 120)
    private String position;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

### demo (2)/demo/src/main/java/com/writerapp/repository/ProjectRepository.java
```java
package com.writerapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.writerapp.model.Project;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("""
            select distinct p
            from Project p
            left join p.collaborators c
            where p.owner.id = :userId or c.user.id = :userId
            """)
    List<Project> findAllAccessibleByUserId(@Param("userId") Long userId);

        @Query("""
            select distinct p
            from Project p
            left join p.collaborators c
            where p.owner.id = :userId or c.user.id = :userId
            """)
        Page<Project> findAllAccessibleByUserId(@Param("userId") Long userId, Pageable pageable);

        Optional<Project> findByShareToken(String shareToken);
}
```

### demo (2)/demo/src/main/java/com/writerapp/repository/VersionHistoryRepository.java
```java
package com.writerapp.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.writerapp.model.VersionHistory;

public interface VersionHistoryRepository extends JpaRepository<VersionHistory, Long> {

    Page<VersionHistory> findByProjectIdOrderByCreatedAtDesc(Long projectId, Pageable pageable);
}
```

### demo (2)/demo/src/main/java/com/writerapp/repository/CommentRepository.java
```java
package com.writerapp.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.writerapp.model.Comment;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    Page<Comment> findByProjectIdOrderByCreatedAtDesc(Long projectId, Pageable pageable);
}
```

## Batch 2

### demo (2)/demo/src/main/java/com/writerapp/dto/PageResponse.java
```java
package com.writerapp.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PageResponse<T> {
    private List<T> items;
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;
    private boolean hasNext;
    private boolean hasPrevious;
}
```

### demo (2)/demo/src/main/java/com/writerapp/dto/VersionHistoryResponse.java
```java
package com.writerapp.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VersionHistoryResponse {
    private Long id;
    private Long projectId;
    private Long userId;
    private String username;
    private String contentSnapshot;
    private LocalDateTime createdAt;
}
```

### demo (2)/demo/src/main/java/com/writerapp/dto/CommentCreateRequest.java
```java
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
```

### demo (2)/demo/src/main/java/com/writerapp/dto/CommentResponse.java
```java
package com.writerapp.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommentResponse {
    private Long id;
    private Long projectId;
    private Long userId;
    private String username;
    private String text;
    private String position;
    private LocalDateTime createdAt;
}
```

### demo (2)/demo/src/main/java/com/writerapp/dto/SharedProjectResponse.java
```java
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
```

### demo (2)/demo/src/main/java/com/writerapp/dto/ProjectResponse.java
```java
package com.writerapp.dto;

import java.time.LocalDateTime;

import com.writerapp.model.ProjectType;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private String title;
    private ProjectType type;
    private String ownerUsername;
    private String accessRole;
    private boolean canEdit;
    private LocalDateTime createdAt;
}
```

### demo (2)/demo/src/main/java/com/writerapp/dto/CollaboratorResponse.java
```java
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
```

### demo (2)/demo/src/main/java/com/writerapp/dto/CollaboratorInviteRequest.java
```java
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
```

## Batch 3

### demo (2)/demo/src/main/java/com/writerapp/dto/LoginRequest.java
```java
package com.writerapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank
    @Size(max = 50)
    private String username;

    @NotBlank
    @Size(min = 6, max = 100)
    private String password;
}
```

### demo (2)/demo/src/main/java/com/writerapp/service/ProjectPermissionService.java
```java
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
```

### demo (2)/demo/src/main/java/com/writerapp/service/ProjectService.java
```java
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
import com.writerapp.dto.ProjectResponse;
import com.writerapp.dto.SharedProjectResponse;
import com.writerapp.model.Collaborator;
import com.writerapp.model.Content;
import com.writerapp.model.Project;
import com.writerapp.model.User;
import com.writerapp.repository.CollaboratorRepository;
import com.writerapp.repository.ContentRepository;
import com.writerapp.repository.ProjectRepository;
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
    private final CurrentUserService currentUserService;
    private final ProjectPermissionService projectPermissionService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> getProjectsForCurrentUser(int page, int size) {
        User currentUser = currentUserService.getCurrentUser();
        var result = projectRepository.findAllAccessibleByUserId(currentUser.getId(), PageRequest.of(page, size));

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
                .owner(currentUser)
                .shareToken(UUID.randomUUID().toString().replace("-", ""))
                .build();

        Project saved = projectRepository.save(Objects.requireNonNull(project));
        return mapProject(saved, currentUser);
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

        return ProjectResponse.builder()
                .id(project.getId())
                .title(project.getTitle())
                .type(project.getType())
                .ownerUsername(project.getOwner().getUsername())
                .accessRole(role)
                .canEdit("OWNER".equals(role) || "EDITOR".equals(role))
                .createdAt(project.getCreatedAt())
                .build();
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
```

### demo (2)/demo/src/main/java/com/writerapp/service/ContentService.java
```java
package com.writerapp.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.writerapp.dto.ContentResponse;
import com.writerapp.dto.ContentVersionResponse;
import com.writerapp.dto.ContentUpdateRequest;
import com.writerapp.model.Content;
import com.writerapp.model.ContentVersion;
import com.writerapp.model.Project;
import com.writerapp.model.User;
import com.writerapp.repository.ContentRepository;
import com.writerapp.repository.ContentVersionRepository;
import com.writerapp.repository.VersionHistoryRepository;
import com.writerapp.model.VersionHistory;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final ContentVersionRepository contentVersionRepository;
    private final VersionHistoryRepository versionHistoryRepository;
    private final CurrentUserService currentUserService;
    private final ProjectPermissionService projectPermissionService;

    @Transactional(readOnly = true)
    public List<ContentResponse> getProjectContent(Long projectId) {
    User currentUser = currentUserService.getCurrentUser();
    Project project = projectPermissionService.requireProject(projectId);
    projectPermissionService.requireCanView(project, currentUser);

        return contentRepository.findByProjectIdOrderBySectionNumberAsc(projectId)
                .stream()
                .map(this::mapContent)
                .toList();
    }

    @Transactional
    public ContentResponse upsertProjectContent(Long projectId, ContentUpdateRequest request) {
    User editor = currentUserService.getCurrentUser();
    Project project = projectPermissionService.requireProject(projectId);
    projectPermissionService.requireCanEdit(project, editor);

    Content existing = contentRepository.findByProjectIdAndSectionNumber(projectId, request.getSectionNumber())
        .orElse(null);

    if (existing != null && !existing.getText().equals(request.getText())) {
        VersionHistory history = VersionHistory.builder()
            .project(project)
            .user(editor)
            .contentSnapshot("Section " + existing.getSectionNumber() + "\n" + existing.getText())
            .build();
            versionHistoryRepository.save(Objects.requireNonNull(history));
    }

    Content content = existing != null
        ? existing
        : Content.builder()
            .project(project)
            .sectionNumber(request.getSectionNumber())
            .build();

        content.setText(request.getText());
        Content saved = contentRepository.save(content);

        ContentVersion version = ContentVersion.builder()
            .content(saved)
            .projectId(projectId)
            .sectionNumber(saved.getSectionNumber())
            .text(saved.getText())
            .editedBy(editor.getUsername())
            .build();
        contentVersionRepository.save(Objects.requireNonNull(version));

        return mapContent(saved);
    }

    @Transactional(readOnly = true)
    public List<ContentVersionResponse> getProjectContentHistory(Long projectId) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, currentUser);

        return contentVersionRepository.findByProjectIdOrderByEditedAtDesc(projectId)
            .stream()
            .map(version -> ContentVersionResponse.builder()
                .id(version.getId())
                .projectId(version.getProjectId())
                .sectionNumber(version.getSectionNumber())
                .text(version.getText())
                .editedBy(version.getEditedBy())
                .editedAt(version.getEditedAt())
                .build())
            .toList();
    }

    public boolean canEdit(Long projectId, Long userId) {
        Project project = projectPermissionService.requireProject(projectId);
        if (project.getOwner().getId().equals(userId)) {
            return true;
        }

        User user = User.builder().id(userId).build();
        try {
            projectPermissionService.requireCanEdit(project, user);
            return true;
        } catch (ResponseStatusException ex) {
            return false;
        }
    }

    @Transactional
    public ContentResponse restoreFromSnapshot(Long projectId, String snapshot) {
        String[] lines = snapshot.split("\\n", 2);
        if (lines.length == 0 || !lines[0].startsWith("Section ")) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid snapshot format");
        }

        int sectionNumber;
        try {
            sectionNumber = Integer.parseInt(lines[0].replace("Section ", "").trim());
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid section number in snapshot");
        }

        String text = lines.length > 1 ? lines[1] : "";
        ContentUpdateRequest request = new ContentUpdateRequest();
        request.setSectionNumber(sectionNumber);
        request.setText(text);
        return upsertProjectContent(projectId, request);
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
```

### demo (2)/demo/src/main/java/com/writerapp/service/VersionHistoryService.java
```java
package com.writerapp.service;

import java.util.Objects;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.writerapp.dto.PageResponse;
import com.writerapp.dto.ContentResponse;
import com.writerapp.dto.VersionHistoryResponse;
import com.writerapp.model.Project;
import com.writerapp.model.User;
import com.writerapp.model.VersionHistory;
import com.writerapp.repository.VersionHistoryRepository;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class VersionHistoryService {

    private final VersionHistoryRepository versionHistoryRepository;
    private final CurrentUserService currentUserService;
    private final ProjectPermissionService projectPermissionService;
    private final ContentService contentService;

    @Transactional(readOnly = true)
    public PageResponse<VersionHistoryResponse> getProjectHistory(Long projectId, int page, int size) {
        User user = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, user);

        var result = versionHistoryRepository.findByProjectIdOrderByCreatedAtDesc(projectId, PageRequest.of(page, size));
        return PageResponse.<VersionHistoryResponse>builder()
                .items(result.getContent().stream().map(this::map).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalItems(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .hasNext(result.hasNext())
                .hasPrevious(result.hasPrevious())
                .build();
    }

    @Transactional(readOnly = true)
    public VersionHistoryResponse getProjectHistoryVersion(Long projectId, Long versionId) {
        User user = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, user);

        VersionHistory version = versionHistoryRepository.findById(Objects.requireNonNull(versionId))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Version not found"));

        if (!version.getProject().getId().equals(projectId)) {
            throw new ResponseStatusException(FORBIDDEN, "Version does not belong to the project");
        }

        return map(version);
    }

    @Transactional
    public ContentResponse restoreProjectHistoryVersion(Long projectId, Long versionId) {
        User user = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanEdit(project, user);

        VersionHistory version = versionHistoryRepository.findById(Objects.requireNonNull(versionId))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Version not found"));

        if (!version.getProject().getId().equals(projectId)) {
            throw new ResponseStatusException(FORBIDDEN, "Version does not belong to the project");
        }

        return contentService.restoreFromSnapshot(projectId, version.getContentSnapshot());
    }

    private VersionHistoryResponse map(VersionHistory history) {
        return VersionHistoryResponse.builder()
                .id(history.getId())
                .projectId(history.getProject().getId())
                .userId(history.getUser().getId())
                .username(history.getUser().getUsername())
                .contentSnapshot(history.getContentSnapshot())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
```

### demo (2)/demo/src/main/java/com/writerapp/service/CommentService.java
```java
package com.writerapp.service;

import java.util.Objects;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.writerapp.dto.CommentCreateRequest;
import com.writerapp.dto.CommentResponse;
import com.writerapp.dto.PageResponse;
import com.writerapp.model.Comment;
import com.writerapp.model.Project;
import com.writerapp.model.User;
import com.writerapp.repository.CommentRepository;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final CurrentUserService currentUserService;
    private final ProjectPermissionService projectPermissionService;

    @Transactional
    public CommentResponse createComment(CommentCreateRequest request) {
        User user = currentUserService.getCurrentUser();
        Long projectId = request.getProjectId();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, user);

        Comment comment = Comment.builder()
                .project(project)
                .user(user)
                .text(request.getText().trim())
                .position(request.getPosition().trim())
                .build();

        return map(commentRepository.save(Objects.requireNonNull(comment)));
    }

    @Transactional(readOnly = true)
    public PageResponse<CommentResponse> getComments(Long projectId, int page, int size) {
        User user = currentUserService.getCurrentUser();
        Project project = projectPermissionService.requireProject(projectId);
        projectPermissionService.requireCanView(project, user);

        var result = commentRepository.findByProjectIdOrderByCreatedAtDesc(projectId, PageRequest.of(page, size));
        return PageResponse.<CommentResponse>builder()
                .items(result.getContent().stream().map(this::map).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalItems(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .hasNext(result.hasNext())
                .hasPrevious(result.hasPrevious())
                .build();
    }

    @Transactional
    public void deleteComment(Long commentId) {
        User user = currentUserService.getCurrentUser();

        Comment comment = commentRepository.findById(Objects.requireNonNull(commentId))
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Comment not found"));

        Project project = comment.getProject();
        boolean isOwner = project.getOwner().getId().equals(user.getId());
        boolean isAuthor = comment.getUser().getId().equals(user.getId());
        if (!isOwner && !isAuthor) {
            throw new ResponseStatusException(FORBIDDEN, "You cannot delete this comment");
        }

        commentRepository.delete(comment);
    }

    private CommentResponse map(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .projectId(comment.getProject().getId())
                .userId(comment.getUser().getId())
                .username(comment.getUser().getUsername())
                .text(comment.getText())
                .position(comment.getPosition())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
```

### demo (2)/demo/src/main/java/com/writerapp/controller/ProjectController.java
```java
package com.writerapp.controller;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.writerapp.dto.CollaboratorInviteRequest;
import com.writerapp.dto.CollaboratorResponse;
import com.writerapp.dto.PageResponse;
import com.writerapp.dto.ProjectCreateRequest;
import com.writerapp.dto.ProjectResponse;
import com.writerapp.dto.VersionHistoryResponse;
import com.writerapp.dto.ContentResponse;
import com.writerapp.service.ProjectService;
import com.writerapp.service.VersionHistoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects")
@Validated
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final VersionHistoryService versionHistoryService;

    @GetMapping
    public ResponseEntity<PageResponse<ProjectResponse>> getProjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(projectService.getProjectsForCurrentUser(page, size));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectForCurrentUser(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<CollaboratorResponse> inviteCollaborator(
            @PathVariable Long id,
            @Valid @RequestBody CollaboratorInviteRequest request
    ) {
        return ResponseEntity.ok(projectService.inviteCollaborator(id, request));
    }

    @GetMapping("/{id}/collaborators")
    public ResponseEntity<List<CollaboratorResponse>> getCollaborators(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getCollaborators(id));
    }

    @DeleteMapping("/{id}/collaborators/{userId}")
    public ResponseEntity<Void> removeCollaborator(@PathVariable Long id, @PathVariable Long userId) {
        projectService.removeCollaborator(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/share-link")
    public ResponseEntity<Map<String, String>> getShareLink(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("link", projectService.getShareLink(id)));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<PageResponse<VersionHistoryResponse>> getProjectHistory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(versionHistoryService.getProjectHistory(id, page, size));
    }

    @GetMapping("/{id}/history/{versionId}")
    public ResponseEntity<VersionHistoryResponse> getProjectHistoryVersion(
            @PathVariable Long id,
            @PathVariable Long versionId
    ) {
        return ResponseEntity.ok(versionHistoryService.getProjectHistoryVersion(id, versionId));
    }

    @PostMapping("/{id}/history/{versionId}/restore")
    public ResponseEntity<ContentResponse> restoreHistoryVersion(
            @PathVariable Long id,
            @PathVariable Long versionId
    ) {
        return ResponseEntity.ok(versionHistoryService.restoreProjectHistoryVersion(id, versionId));
    }

    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportProjectAsPdf(@PathVariable Long id) {
        byte[] pdf = projectService.exportProjectAsPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=project-" + id + ".pdf")
            .contentType(Objects.requireNonNull(MediaType.APPLICATION_PDF))
                .body(pdf);
    }

    @GetMapping("/{id}/export/txt")
    public ResponseEntity<byte[]> exportProjectAsTxt(@PathVariable Long id) {
        byte[] txt = projectService.exportProjectAsTxt(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=project-" + id + ".txt")
                .contentType(Objects.requireNonNull(MediaType.TEXT_PLAIN))
                .body(txt);
    }
}
```

### demo (2)/demo/src/main/java/com/writerapp/controller/ShareController.java
```java
package com.writerapp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.writerapp.dto.SharedProjectResponse;
import com.writerapp.service.ProjectService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/share")
@RequiredArgsConstructor
public class ShareController {

    private final ProjectService projectService;

    @GetMapping("/{token}")
    public ResponseEntity<SharedProjectResponse> getSharedProject(@PathVariable String token) {
        return ResponseEntity.ok(projectService.getSharedProjectByToken(token));
    }
}
```

## Batch 4

### demo (2)/demo/src/main/java/com/writerapp/controller/CommentController.java
```java
package com.writerapp.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.writerapp.dto.CommentCreateRequest;
import com.writerapp.dto.CommentResponse;
import com.writerapp.dto.PageResponse;
import com.writerapp.service.CommentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/comments")
@Validated
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @Valid @RequestBody CommentCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.createComment(request));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<PageResponse<CommentResponse>> getComments(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(commentService.getComments(projectId, page, size));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }
}
```

### demo (2)/demo/src/main/java/com/writerapp/config/SecurityConfig.java
```java
package com.writerapp.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.writerapp.security.JwtAuthenticationFilter;
import com.writerapp.security.RestAccessDeniedHandler;
import com.writerapp.security.RestAuthenticationEntryPoint;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;
    private final RestAuthenticationEntryPoint restAuthenticationEntryPoint;
    private final RestAccessDeniedHandler restAccessDeniedHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                    .authenticationEntryPoint(restAuthenticationEntryPoint)
                    .accessDeniedHandler(restAccessDeniedHandler)
                )
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                        "/api/auth/**",
                        "/api/share/**",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/ws/**"
                    ).permitAll()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### demo (2)/demo/src/main/java/com/writerapp/websocket/EditorMessage.java
```java
package com.writerapp.websocket;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class EditorMessage {
    private Long projectId;
    private Integer sectionNumber;
    private String text;
    private String messageType;
    private String editedBy;
    private LocalDateTime updatedAt;
}
```

### demo (2)/demo/src/main/java/com/writerapp/websocket/CollaborationController.java
```java
package com.writerapp.websocket;

import java.time.LocalDateTime;

import org.springframework.lang.NonNull;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class CollaborationController {

    @MessageMapping("/project/{projectId}/edit")
    @SendTo("/topic/project/{projectId}")
    public com.writerapp.websocket.EditorMessage broadcastEdit(
            @DestinationVariable @NonNull Long projectId,
            @NonNull com.writerapp.websocket.EditorMessage message
    ) {
        message.setProjectId(projectId);
        if (message.getMessageType() == null || message.getMessageType().isBlank()) {
            message.setMessageType("EDIT");
        }
        if (message.getEditedBy() == null || message.getEditedBy().isBlank()) {
            message.setEditedBy("collaborator");
        }
        message.setUpdatedAt(LocalDateTime.now());
        return message;
    }
}
```

### demo (2)/demo/pom.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>3.3.9</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>
	<groupId>com.writerapp</groupId>
	<artifactId>demo</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>writerapp-backend</name>
	<description>Collaborative writing platform backend</description>
	<url/>
	<licenses>
		<license/>
	</licenses>
	<developers>
		<developer/>
	</developers>
	<scm>
		<connection/>
		<developerConnection/>
		<tag/>
		<url/>
	</scm>
	<properties>
		<java.version>21</java.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-security</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-validation</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-websocket</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springdoc</groupId>
			<artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
			<version>2.6.0</version>
		</dependency>
		<dependency>
			<groupId>com.github.librepdf</groupId>
			<artifactId>openpdf</artifactId>
			<version>1.3.39</version>
		</dependency>

		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-devtools</artifactId>
			<scope>runtime</scope>
			<optional>true</optional>
		</dependency>
		<dependency>
			<groupId>com.mysql</groupId>
			<artifactId>mysql-connector-j</artifactId>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<optional>true</optional>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-configuration-processor</artifactId>
			<optional>true</optional>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-api</artifactId>
			<version>0.12.6</version>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-impl</artifactId>
			<version>0.12.6</version>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-jackson</artifactId>
			<version>0.12.6</version>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>com.h2database</groupId>
			<artifactId>h2</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.security</groupId>
			<artifactId>spring-security-test</artifactId>
			<scope>test</scope>
		</dependency>
	</dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-compiler-plugin</artifactId>
				<configuration>
					<annotationProcessorPaths>
						<path>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</path>
					</annotationProcessorPaths>
				</configuration>
			</plugin>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
				<configuration>
					<excludes>
						<exclude>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</exclude>
					</excludes>
				</configuration>
			</plugin>
		</plugins>
	</build>

</project>
```

### docs/run-instructions.md
```markdown
# Run Instructions

## Backend (Spring Boot)

1. Open terminal in `demo (2)/demo`.
2. Ensure JDK 21 and Maven are available.
3. Run:

```powershell
mvn spring-boot:run
```

Backend URL: http://localhost:8080
Swagger UI: http://localhost:8080/swagger-ui.html

## Frontend (React + Vite)

1. Open terminal in `frontend`.
2. Install dependencies:

```bash
npm install
```

3. Start dev server:

```bash
npm run dev
```

Frontend URL: http://localhost:5173

## WebSocket

- Endpoint: `ws://localhost:8080/ws/editor`
- Topic subscription: `/topic/project/{projectId}`
- Client publish destination: `/app/project/{projectId}/edit`
```

### frontend/src/services/api.js
```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("writerapp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("writerapp_token");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    if (!error.response) {
      error.friendlyMessage = "Network error. Please check your connection and try again.";
    } else if (status === 403) {
      error.friendlyMessage = "You do not have permission to perform this action.";
    } else if (status === 401) {
      error.friendlyMessage = "Your session has expired. Please login again.";
    }

    return Promise.reject(error);
  }
);

export default api;
```

### frontend/src/services/projectService.js
```javascript
import api from "./api";

function downloadBlob(responseData, mimeType, filename) {
  const blobUrl = URL.createObjectURL(new Blob([responseData], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}

export async function getProjects(page = 0, size = 10) {
  const { data } = await api.get("/projects", { params: { page, size } });
  return data;
}

export async function createProject(payload) {
  const { data } = await api.post("/projects", payload);
  return data;
}

export async function deleteProject(id) {
  await api.delete(`/projects/${id}`);
}

export async function getProject(id) {
  const { data } = await api.get(`/projects/${id}`);
  return data;
}

export async function inviteCollaborator(projectId, payload) {
  const { data } = await api.post(`/projects/${projectId}/invite`, payload);
  return data;
}

export async function getCollaborators(projectId) {
  const { data } = await api.get(`/projects/${projectId}/collaborators`);
  return data;
}

export async function removeCollaborator(projectId, userId) {
  await api.delete(`/projects/${projectId}/collaborators/${userId}`);
}

export async function getShareLink(projectId) {
  const { data } = await api.get(`/projects/${projectId}/share-link`);
  return data.link;
}

export async function exportProjectPdf(projectId) {
  const response = await api.get(`/projects/${projectId}/export/pdf`, {
    responseType: "blob"
  });

  downloadBlob(response.data, "application/pdf", `project-${projectId}.pdf`);
}

export async function exportProjectTxt(projectId) {
  const response = await api.get(`/projects/${projectId}/export/txt`, {
    responseType: "blob"
  });

  downloadBlob(response.data, "text/plain", `project-${projectId}.txt`);
}

export async function getProjectVersionHistory(projectId, page = 0, size = 20) {
  const { data } = await api.get(`/projects/${projectId}/history`, { params: { page, size } });
  return data;
}

export async function getProjectVersion(projectId, versionId) {
  const { data } = await api.get(`/projects/${projectId}/history/${versionId}`);
  return data;
}

export async function restoreProjectVersion(projectId, versionId) {
  const { data } = await api.post(`/projects/${projectId}/history/${versionId}/restore`);
  return data;
}

export async function getSharedProject(token) {
  const { data } = await api.get(`/share/${token}`);
  return data;
}
```

## Batch 5

### frontend/src/services/contentService.js
```javascript
import api from "./api";

export async function getProjectContent(projectId) {
  const { data } = await api.get(`/content/${projectId}`);
  return data;
}

export async function updateProjectContent(projectId, payload) {
  const { data } = await api.put(`/content/${projectId}`, payload);
  return data;
}

export async function getProjectHistory(projectId) {
  const { data } = await api.get(`/content/${projectId}/history`);
  return data;
}

export async function getComments(projectId, page = 0, size = 20) {
  const { data } = await api.get(`/comments/${projectId}`, { params: { page, size } });
  return data;
}

export async function addComment(payload) {
  const { data } = await api.post(`/comments`, payload);
  return data;
}

export async function deleteComment(commentId) {
  await api.delete(`/comments/${commentId}`);
}
```

### frontend/src/services/wsService.js
```javascript
import { Client } from "@stomp/stompjs";

export function createEditorSocket(projectId, onMessage) {
  const client = new Client({
    brokerURL: "ws://localhost:8080/ws/editor",
    reconnectDelay: 3000,
    onConnect: () => {
      client.subscribe(`/topic/project/${projectId}`, (message) => {
        try {
          onMessage(JSON.parse(message.body));
        } catch {
          // Ignore malformed websocket messages.
        }
      });
    }
  });

  client.activate();
  return client;
}

export function publishEdit(client, projectId, payload) {
  if (!client || !client.connected) return;
  client.publish({
    destination: `/app/project/${projectId}/edit`,
    body: JSON.stringify({ ...payload, messageType: payload.messageType || "EDIT" })
  });
}

export function publishTyping(client, projectId, payload) {
  if (!client || !client.connected) return;
  client.publish({
    destination: `/app/project/${projectId}/edit`,
    body: JSON.stringify({ ...payload, messageType: "TYPING" })
  });
}
```

### frontend/src/hooks/useApiRequest.js
```javascript
import { useCallback, useState } from "react";

export default function useApiRequest(asyncFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError("");
      try {
        return await asyncFn(...args);
      } catch (err) {
        const message =
          err?.friendlyMessage ||
          err?.response?.data?.message ||
          err?.message ||
          "Request failed";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { execute, loading, error, setError };
}
```

### frontend/src/hooks/useAuthUser.js
```javascript
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";

export default function useAuthUser() {
  const { user, token, loading, logout } = useAuth();

  return useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      logout
    }),
    [user, token, loading, logout]
  );
}
```

### frontend/src/utils/errors.js
```javascript
export function extractApiError(error, fallback = "Request failed") {
  if (error?.friendlyMessage) return error.friendlyMessage;
  if (!error?.response) return "Network error. Please check your internet connection.";

  const data = error?.response?.data;
  if (!data) return fallback;

  if (error.response.status === 401) {
    return "Your session expired. Please login again.";
  }
  if (error.response.status === 403) {
    return "You do not have permission to do that.";
  }

  if (Array.isArray(data.details) && data.details.length > 0) {
    return data.details.join(" | ");
  }

  if (typeof data.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }

  return fallback;
}
```

### frontend/src/components/ProjectCard.jsx
```jsx
import { Link } from "react-router-dom";

export default function ProjectCard({ project, onDelete, onShare, onExportPdf, onExportTxt }) {
  const isOwner = project.accessRole === "OWNER";

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{project.title}</h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-blue-300">{project.type}</p>
          <p className="mt-1 text-xs text-slate-400">Role: {project.accessRole}</p>
        </div>
        <Link to={`/project/${project.id}`} className="btn">
          Open
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200" onClick={onShare}>
          Share Link
        </button>
        <button className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200" onClick={onExportPdf}>
          Export PDF
        </button>
        <button className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200" onClick={onExportTxt}>
          Export TXT
        </button>
        {isOwner && (
          <button className="rounded bg-red-700 px-3 py-1 text-sm text-white" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
```

### frontend/src/components/StoryEditor.jsx
```jsx
import { sectionLabel } from "../utils/screenplay";

export default function StoryEditor({ sectionNumber, text, onSectionChange, onTextChange, onSave, readOnly, saving }) {
  return (
    <div className="card flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-slate-400">Chapter</label>
        <input
          type="number"
          className="input max-w-28"
          min={1}
          value={sectionNumber}
          onChange={(e) => onSectionChange(Number(e.target.value))}
          disabled={readOnly}
        />
        <span className="text-xs text-slate-500">{sectionLabel("STORY", sectionNumber)}</span>
      </div>
      <div
        key={sectionNumber}
        className="input h-[60vh] flex-1 overflow-auto"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={(e) => onTextChange(e.currentTarget.innerText)}
        dangerouslySetInnerHTML={{ __html: text }}
      >
      </div>
      <button className="btn mt-3 self-end" onClick={onSave} disabled={readOnly || saving}>
        {saving ? "Saving..." : "Save Chapter"}
      </button>
    </div>
  );
}
```

### frontend/src/components/ScriptEditor.jsx
```jsx
import { sectionLabel, screenplayTemplate } from "../utils/screenplay";

export default function ScriptEditor({ sectionNumber, text, onSectionChange, onTextChange, onSave, readOnly, saving }) {
  return (
    <div className="card flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-slate-400">Scene</label>
        <input
          type="number"
          className="input max-w-28"
          min={1}
          value={sectionNumber}
          onChange={(e) => onSectionChange(Number(e.target.value))}
          disabled={readOnly}
        />
        <span className="text-xs text-slate-500">{sectionLabel("SCRIPT", sectionNumber)}</span>
      </div>

      <textarea
        className="input h-[60vh] flex-1 resize-none font-mono"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={screenplayTemplate()}
        readOnly={readOnly}
      />

      <button className="btn mt-3 self-end" onClick={onSave} disabled={readOnly || saving}>
        {saving ? "Saving..." : "Save Scene"}
      </button>
    </div>
  );
}
```

## Batch 6

### frontend/src/components/Navbar.jsx
```jsx
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="text-lg font-bold text-blue-400">
          Writer App
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-slate-300">{user.username}</span>
              <button className="btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
```

### frontend/src/pages/DashboardPage.jsx
```jsx
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ProjectCard from "../components/ProjectCard";
import {
  createProject,
  deleteProject,
  exportProjectPdf,
  exportProjectTxt,
  getProjects,
  getShareLink
} from "../services/projectService";
import { extractApiError } from "../utils/errors";

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(0);
  const [pageInfo, setPageInfo] = useState({ totalPages: 1, hasNext: false, hasPrevious: false });
  const [form, setForm] = useState({ title: "", type: "STORY" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadProjects(targetPage = page) {
    setLoading(true);
    setError("");
    try {
      const data = await getProjects(targetPage, 9);
      setProjects(data.items || []);
      setPage(targetPage);
      setPageInfo({
        totalPages: data.totalPages || 1,
        hasNext: data.hasNext,
        hasPrevious: data.hasPrevious
      });
    } catch (err) {
      setError(extractApiError(err, "Could not load projects"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function onCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await createProject(form);
      setForm({ title: "", type: "STORY" });
      await loadProjects(0);
    } catch (err) {
      setError(extractApiError(err, "Could not create project"));
    }
  }

  async function onDelete(id) {
    await deleteProject(id);
    await loadProjects(page);
  }

  async function onShare(id) {
    const link = await getShareLink(id);
    try {
      await navigator.clipboard.writeText(link);
      alert("Share link copied");
    } catch {
      window.prompt("Copy share link:", link);
    }
  }

  async function onExport(id) {
    await exportProjectPdf(id);
  }

  async function onExportTxt(id) {
    await exportProjectTxt(id);
  }

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="card mb-6">
          <h2 className="mb-3 text-xl font-semibold">Create Project</h2>
          <form className="flex flex-wrap gap-3" onSubmit={onCreate}>
            <input
              className="input max-w-xl flex-1"
              placeholder="Project title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <select
              className="input max-w-44"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="STORY">STORY</option>
              <option value="SCRIPT">SCRIPT</option>
            </select>
            <button className="btn" type="submit">Create</button>
          </form>
          {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading && <div className="card col-span-full text-center text-slate-300">Loading projects...</div>}
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={() => onDelete(project.id)}
              onShare={() => onShare(project.id)}
              onExportPdf={() => onExport(project.id)}
              onExportTxt={() => onExportTxt(project.id)}
            />
          ))}
        </section>

        <section className="mt-4 flex items-center justify-end gap-2">
          <button
            className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200 disabled:opacity-50"
            disabled={!pageInfo.hasPrevious}
            onClick={() => loadProjects(Math.max(0, page - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-slate-300">Page {page + 1} / {Math.max(pageInfo.totalPages, 1)}</span>
          <button
            className="rounded bg-slate-800 px-3 py-1 text-sm text-slate-200 disabled:opacity-50"
            disabled={!pageInfo.hasNext}
            onClick={() => loadProjects(page + 1)}
          >
            Next
          </button>
        </section>
      </main>
    </div>
  );
}
```

### frontend/src/pages/LoginPage.jsx
```jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractApiError } from "../utils/errors";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(extractApiError(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form className="card w-full" onSubmit={onSubmit}>
        <h1 className="mb-4 text-2xl font-bold text-slate-100">Login</h1>
        <input className="input mb-3" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="input mb-3" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}
        <button className="btn w-full" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <p className="mt-3 text-sm text-slate-300">
          No account? <Link className="text-blue-400" to="/register">Register</Link>
        </p>
      </form>
    </main>
  );
}
```

### frontend/src/pages/RegisterPage.jsx
```jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractApiError } from "../utils/errors";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(extractApiError(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <form className="card w-full" onSubmit={onSubmit}>
        <h1 className="mb-4 text-2xl font-bold text-slate-100">Register</h1>
        <input className="input mb-3" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="input mb-3" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input mb-3" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}
        <button className="btn w-full" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
        <p className="mt-3 text-sm text-slate-300">
          Already registered? <Link className="text-blue-400" to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
```

### frontend/src/pages/ProjectEditorPage.jsx
```jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import StoryEditor from "../components/StoryEditor";
import ScriptEditor from "../components/ScriptEditor";
import useWebSocket from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";
import {
  addComment,
  deleteComment,
  getComments,
  getProjectContent,
  getProjectHistory,
  updateProjectContent
} from "../services/contentService";
import {
  getCollaborators,
  getProject,
  getProjectVersionHistory,
  inviteCollaborator,
  removeCollaborator,
  restoreProjectVersion
} from "../services/projectService";
import { publishEdit, publishTyping } from "../services/wsService";
import { extractApiError } from "../utils/errors";

function sectionPosition(sectionNumber) {
  return `section:${sectionNumber}`;
}

export default function ProjectEditorPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const projectId = Number(id);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [sectionNumber, setSectionNumber] = useState(1);
  const [text, setText] = useState("");
  const [content, setContent] = useState([]);
  const [history, setHistory] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const typingTimeoutRef = useRef(null);
  const [dirty, setDirty] = useState(false);

  const [invite, setInvite] = useState({ username: "", email: "", role: "EDITOR" });

  const canEdit = Boolean(project?.canEdit);
  const canManageCollaborators = project?.accessRole === "OWNER";

  const onSocketMessage = useCallback(
    (msg) => {
      if (msg.editedBy && msg.editedBy === user?.username) {
        return;
      }

      if (msg.messageType === "TYPING") {
        if (msg.editedBy) {
          setTypingUser(`${msg.editedBy} is typing...`);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUser(""), 1800);
        }
        return;
      }

      if (msg.sectionNumber === sectionNumber) {
        setText(msg.text || "");
      }

      setContent((prev) => {
        const next = [...prev];
        const existing = next.find((item) => item.sectionNumber === msg.sectionNumber);
        if (existing) {
          existing.text = msg.text;
        } else {
          next.push({ sectionNumber: msg.sectionNumber, text: msg.text });
        }
        return next.sort((a, b) => a.sectionNumber - b.sectionNumber);
      });
    },
    [sectionNumber, user?.username]
  );

  const socketRef = useWebSocket(projectId, onSocketMessage);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [projectData, contentData, collabData, commentsPage, historyPage] = await Promise.all([
        getProject(projectId),
        getProjectContent(projectId),
        getCollaborators(projectId),
        getComments(projectId, 0, 30),
        getProjectVersionHistory(projectId, 0, 20)
      ]);
      setProject(projectData);
      setContent(contentData);
      setCollaborators(collabData);
      setComments(commentsPage.items || []);
      setHistory(historyPage.items || []);
      const initial = contentData.find((item) => item.sectionNumber === 1);
      setText(initial?.text || "");
      setSectionNumber(1);
      setDirty(false);
    } catch (err) {
      setError(extractApiError(err, "Could not load project"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const selected = content.find((item) => item.sectionNumber === sectionNumber);
    setText(selected?.text || "");
    setDirty(false);
  }, [sectionNumber, content]);

  const doSave = useCallback(async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const updated = await updateProjectContent(projectId, { sectionNumber, text });
      setContent((prev) => {
        const next = prev.filter((item) => item.sectionNumber !== sectionNumber);
        next.push(updated);
        return next.sort((a, b) => a.sectionNumber - b.sectionNumber);
      });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [canEdit, projectId, sectionNumber, text]);

  useEffect(() => {
    if (!canEdit || !dirty) return;

    const timer = setTimeout(() => {
      doSave();
    }, 2000);

    return () => clearTimeout(timer);
  }, [text, sectionNumber, canEdit, dirty, doSave]);

  const onTextChange = useCallback(
    (value) => {
      setText(value);
      setDirty(true);
      publishTyping(socketRef.current, projectId, {
        projectId,
        sectionNumber,
        editedBy: user?.username || "collaborator"
      });
      publishEdit(socketRef.current, projectId, {
        projectId,
        sectionNumber,
        text: value,
        editedBy: user?.username || "collaborator"
      });
    },
    [projectId, sectionNumber, socketRef, user?.username]
  );

  async function refreshSidebarData() {
    const [commentsPage, historyPage, collabData] = await Promise.all([
      getComments(projectId, 0, 30),
      getProjectVersionHistory(projectId, 0, 20),
      getCollaborators(projectId)
    ]);
    setComments(commentsPage.items || []);
    setHistory(historyPage.items || []);
    setCollaborators(collabData);
  }

  async function onInvite(e) {
    e.preventDefault();
    if (!canManageCollaborators) return;
    await inviteCollaborator(projectId, invite);
    setInvite({ username: "", email: "", role: "EDITOR" });
    await refreshSidebarData();
  }

  async function onRemove(userId) {
    if (!canManageCollaborators) return;
    await removeCollaborator(projectId, userId);
    await refreshSidebarData();
  }

  async function onAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment({
      projectId,
      text: commentText.trim(),
      position: sectionPosition(sectionNumber)
    });
    setCommentText("");
    const commentsPage = await getComments(projectId, 0, 30);
    setComments(commentsPage.items || []);
  }

  async function onDeleteComment(commentId) {
    await deleteComment(commentId);
    const commentsPage = await getComments(projectId, 0, 30);
    setComments(commentsPage.items || []);
  }

  async function onRestoreVersion(versionId) {
    if (!canEdit) return;
    await restoreProjectVersion(projectId, versionId);
    await loadAll();
  }

  const editorProps = useMemo(
    () => ({
      sectionNumber,
      text,
      onSectionChange: setSectionNumber,
      onTextChange,
      onSave: doSave,
      readOnly: !canEdit,
      saving
    }),
    [sectionNumber, text, onTextChange, doSave, canEdit, saving]
  );

  const editor = useMemo(() => {
    if (project?.type === "SCRIPT") {
      return <ScriptEditor {...editorProps} />;
    }
    return <StoryEditor {...editorProps} />;
  }, [project, editorProps]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base text-slate-100">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 text-center text-slate-300">Loading project...</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-3">
          {typingUser && <p className="text-sm text-blue-300">{typingUser}</p>}
          {error && <p className="text-sm text-rose-400">{error}</p>}
          {!canEdit && <p className="text-sm text-amber-300">Read-only access: viewer permissions.</p>}
          {saving && <p className="text-xs text-slate-400">Auto-saving...</p>}
          {editor}
        </section>

        <aside className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold">{project?.title}</h2>
            <p className="text-sm text-blue-300">{project?.type}</p>
            <p className="mt-1 text-xs text-slate-400">Role: {project?.accessRole}</p>
          </div>

          <div className="card">
            <h3 className="mb-2 font-semibold">Collaborators</h3>
            <form onSubmit={onInvite} className="space-y-2">
              <input
                className="input"
                placeholder="Username"
                value={invite.username}
                onChange={(e) => setInvite({ ...invite, username: e.target.value })}
                disabled={!canManageCollaborators}
              />
              <input
                className="input"
                placeholder="Email"
                type="email"
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                disabled={!canManageCollaborators}
              />
              <select
                className="input"
                value={invite.role}
                onChange={(e) => setInvite({ ...invite, role: e.target.value })}
                disabled={!canManageCollaborators}
              >
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
              <button className="btn w-full" type="submit" disabled={!canManageCollaborators}>
                Invite
              </button>
            </form>

            <ul className="mt-3 space-y-2 text-sm">
              {collaborators.map((c) => (
                <li key={c.id || c.userId} className="flex items-center justify-between rounded bg-slate-800 px-2 py-1">
                  <span>{c.username} ({c.owner ? "OWNER" : c.role})</span>
                  {!c.owner && canManageCollaborators && (
                    <button className="text-rose-400" onClick={() => onRemove(c.userId)}>
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Version History</h3>
              <button className="rounded bg-slate-800 px-2 py-1 text-xs" onClick={() => setHistoryOpen((v) => !v)}>
                {historyOpen ? "Hide" : "Show"}
              </button>
            </div>
            {historyOpen && (
              <ul className="max-h-56 space-y-2 overflow-auto text-xs text-slate-300">
                {history.map((h) => (
                  <li key={h.id} className="rounded bg-slate-800 px-2 py-1">
                    <div>{h.username} saved snapshot</div>
                    <div className="text-[11px] text-slate-400">{new Date(h.createdAt).toLocaleString()}</div>
                    {canEdit && (
                      <button className="mt-1 text-blue-300" onClick={() => onRestoreVersion(h.id)}>
                        Restore
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3 className="mb-2 font-semibold">Comments</h3>
            <form onSubmit={onAddComment} className="space-y-2">
              <textarea
                className="input h-20 resize-none"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Comment for ${sectionPosition(sectionNumber)}`}
              />
              <button className="btn w-full" type="submit">Add Comment</button>
            </form>

            <ul className="mt-3 max-h-60 space-y-2 overflow-auto text-xs text-slate-300">
              {comments.map((comment) => (
                <li key={comment.id} className="rounded bg-slate-800 px-2 py-1">
                  <div className="font-semibold text-slate-200">{comment.username}</div>
                  <div className="text-[11px] text-blue-300">{comment.position}</div>
                  <div className="mt-1 whitespace-pre-wrap">{comment.text}</div>
                  {(project?.accessRole === "OWNER" || comment.userId === user?.id) && (
                    <button className="mt-1 text-rose-400" onClick={() => onDeleteComment(comment.id)}>
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
```

### frontend/src/pages/SharedProjectPage.jsx
```jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getSharedProject } from "../services/projectService";
import { extractApiError } from "../utils/errors";

export default function SharedProjectPage() {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getSharedProject(token);
        setProject(data.project);
        setContent(data.content || []);
      } catch (err) {
        setError(extractApiError(err, "Could not load shared project"));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  return (
    <div className="min-h-screen bg-base text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading && <div className="card text-center text-slate-300">Loading shared project...</div>}
        {error && <div className="card text-rose-400">{error}</div>}

        {!loading && !error && project && (
          <section className="space-y-4">
            <div className="card">
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <p className="mt-1 text-sm text-blue-300">{project.type} â€¢ Shared read-only</p>
            </div>

            {content.map((section) => (
              <article key={section.id ?? section.sectionNumber} className="card">
                <h3 className="mb-2 text-sm font-semibold text-blue-300">
                  {project.type === "SCRIPT" ? "Scene" : "Chapter"} {section.sectionNumber}
                </h3>
                <pre className="whitespace-pre-wrap text-sm text-slate-200">{section.text}</pre>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
```

### frontend/src/App.jsx
```jsx
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import SharedProjectPage from "./pages/SharedProjectPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <ProjectEditorPage />
          </ProtectedRoute>
        }
      />
      <Route path="/shared/:token" element={<SharedProjectPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
```

