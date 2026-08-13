package com.softyfy.song;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AudioFileRepository extends JpaRepository<AudioFile, UUID> {

    Optional<AudioFile> findBySha256(String sha256);

    List<AudioFile> findBySongId(UUID songId);
}
