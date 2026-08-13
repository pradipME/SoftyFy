package com.softyfy.album;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface AlbumRepository extends JpaRepository<Album, UUID> {

    @Query("""
            select a from Album a
            where a.artist.id = :artistId
            order by a.year desc nulls last, lower(a.title) asc
            """)
    List<Album> findByArtistIdOrdered(UUID artistId);

    @Query("""
            select a from Album a
            where lower(a.title) like lower(concat('%', :term, '%'))
            order by a.year desc nulls last, lower(a.title) asc
            """)
    Page<Album> searchByTitle(String term, Pageable pageable);

    List<Album> findByTitleIgnoreCase(String title);
}
