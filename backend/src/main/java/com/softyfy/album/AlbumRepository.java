package com.softyfy.album;

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
}
