package com.softyfy.playlist;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class PlaylistSongId implements Serializable {

    @Column(name = "playlist_id", nullable = false)
    private UUID playlistId;

    @Column(name = "song_id", nullable = false)
    private UUID songId;

    protected PlaylistSongId() {
    }

    public PlaylistSongId(UUID playlistId, UUID songId) {
        this.playlistId = playlistId;
        this.songId = songId;
    }

    public UUID getPlaylistId() {
        return playlistId;
    }

    public UUID getSongId() {
        return songId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PlaylistSongId that)) {
            return false;
        }
        return Objects.equals(playlistId, that.playlistId) && Objects.equals(songId, that.songId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(playlistId, songId);
    }
}
