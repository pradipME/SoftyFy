package com.softyfy.favorite;

import com.softyfy.common.entity.AuditableEntity;
import com.softyfy.song.Song;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "favorite")
public class Favorite extends AuditableEntity {

    @Id
    @Column(name = "song_id", nullable = false)
    private UUID id;

    @MapsId
    @OneToOne
    @JoinColumn(name = "song_id", nullable = false)
    private Song song;

    protected Favorite() {
    }

    public Favorite(Song song) {
        this.song = song;
        this.id = song.getId();
    }

    public UUID getId() {
        return id;
    }

    public Song getSong() {
        return song;
    }
}
