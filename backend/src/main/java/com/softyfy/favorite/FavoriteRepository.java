package com.softyfy.favorite;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {

    @EntityGraph(attributePaths = {"song.artists", "song.album"})
    @Query("select f from Favorite f order by f.createdAt desc")
    Page<Favorite> findAllWithSong(Pageable pageable);

    boolean existsBySongId(UUID songId);

    void deleteBySongId(UUID songId);
}
