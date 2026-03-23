package com.writerapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.writerapp.model.FanFuturePost;
import com.writerapp.model.FanMediaType;

public interface FanFutureRepository extends JpaRepository<FanFuturePost, Long> {

    @Query("""
            select p from FanFuturePost p
            where (:mediaType is null or p.mediaType = :mediaType)
              and (:search is null or lower(p.title) like lower(concat('%', :search, '%'))
                   or lower(p.mediaTitle) like lower(concat('%', :search, '%')))
            order by p.createdAt desc
            """)
    List<FanFuturePost> findRecent(@Param("mediaType") FanMediaType mediaType, @Param("search") String search);

    @Query("""
            select p from FanFuturePost p
            where (:mediaType is null or p.mediaType = :mediaType)
              and (:search is null or lower(p.title) like lower(concat('%', :search, '%'))
                   or lower(p.mediaTitle) like lower(concat('%', :search, '%')))
            order by p.likes desc, p.createdAt desc
            """)
    List<FanFuturePost> findMostLiked(@Param("mediaType") FanMediaType mediaType, @Param("search") String search);

    @Query("""
            select p from FanFuturePost p
            where (:mediaType is null or p.mediaType = :mediaType)
              and (:search is null or lower(p.title) like lower(concat('%', :search, '%'))
                   or lower(p.mediaTitle) like lower(concat('%', :search, '%')))
            order by (p.likes * 3 + p.views) desc, p.createdAt desc
            """)
    List<FanFuturePost> findTrending(@Param("mediaType") FanMediaType mediaType, @Param("search") String search);

    Optional<FanFuturePost> findByIdAndAuthorId(Long id, Long authorId);
}
