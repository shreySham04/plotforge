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

                @Query("""
                        select distinct p
                        from Project p
                        left join p.collaborators c
                        where (p.owner.id = :userId or c.user.id = :userId)
                            and (:subjectId is null or p.subject.id = :subjectId)
                        """)
                Page<Project> findAllAccessibleByUserIdAndSubjectId(
                                @Param("userId") Long userId,
                                @Param("subjectId") Long subjectId,
                                Pageable pageable
                );

        Optional<Project> findByShareToken(String shareToken);
}