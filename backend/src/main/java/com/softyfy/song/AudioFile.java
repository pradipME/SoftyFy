package com.softyfy.song;

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
@Table(name = "audio_file")
public class AudioFile extends AuditableEntity {

    @Id
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "song_id", nullable = false)
    private Song song;

    @Column(name = "storage_provider", nullable = false, length = 50)
    private String storageProvider;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    @Column(name = "format", length = 20)
    private String format;

    @Column(name = "bitrate_kbps")
    private Integer bitrateKbps;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    protected AudioFile() {
    }

    public AudioFile(Song song, String storageProvider, String storageKey, String format,
                     Integer bitrateKbps, Long sizeBytes, boolean primary) {
        this.song = song;
        this.storageProvider = storageProvider;
        this.storageKey = storageKey;
        this.format = format;
        this.bitrateKbps = bitrateKbps;
        this.sizeBytes = sizeBytes;
        this.primary = primary;
    }

    public UUID getId() {
        return id;
    }

    public Song getSong() {
        return song;
    }

    public String getStorageProvider() {
        return storageProvider;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public String getFormat() {
        return format;
    }

    public Integer getBitrateKbps() {
        return bitrateKbps;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public boolean isPrimary() {
        return primary;
    }
}
