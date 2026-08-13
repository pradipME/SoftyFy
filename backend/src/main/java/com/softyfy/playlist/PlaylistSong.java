package com.softyfy.playlist;

import com.softyfy.song.Song;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "playlist_song")
public class PlaylistSong {

    @EmbeddedId
    private PlaylistSongId id;

    @MapsId("playlistId")
    @ManyToOne
    @JoinColumn(name = "playlist_id", nullable = false)
    private Playlist playlist;

    @MapsId("songId")
    @ManyToOne
    @JoinColumn(name = "song_id", nullable = false)
    private Song song;

    @Column(name = "position", nullable = false)
    private int position;

    protected PlaylistSong() {
    }

    public PlaylistSong(Playlist playlist, Song song, int position) {
        this.id = new PlaylistSongId(playlist.getId(), song.getId());
        this.playlist = playlist;
        this.song = song;
        this.position = position;
    }

    public PlaylistSongId getId() {
        return id;
    }

    public Playlist getPlaylist() {
        return playlist;
    }

    public Song getSong() {
        return song;
    }

    public int getPosition() {
        return position;
    }

    public void setPosition(int position) {
        this.position = position;
    }
}
