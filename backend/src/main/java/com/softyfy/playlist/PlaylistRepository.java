package com.softyfy.playlist;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PlaylistRepository extends JpaRepository<Playlist, UUID> {

    @EntityGraph(attributePaths = {"songs.song.artists", "songs.song.album"})
    @Query("select p from Playlist p where p.id = :id")
    List<Playlist> findByIdWithSongs(UUID id);
}
