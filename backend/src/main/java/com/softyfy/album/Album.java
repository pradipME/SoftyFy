package com.softyfy.album;

import com.softyfy.artist.Artist;
import com.softyfy.common.entity.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "album")
public class Album extends AuditableEntity {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "year")
    private Integer year;

    @ManyToOne
    @JoinColumn(name = "artist_id")
    private Artist artist;

    protected Album() {
    }

    public Album(String title, Integer year, Artist artist) {
        this.title = title;
        this.year = year;
        this.artist = artist;
    }

    public UUID getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public Integer getYear() {
        return year;
    }

    public Artist getArtist() {
        return artist;
    }
}
