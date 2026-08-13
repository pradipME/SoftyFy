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

    @Column(name = "label", length = 255)
    private String label;

    @Column(name = "bitrate_kbps")
    private Integer bitrateKbps;

    @Column(name = "sample_rate_hz")
    private Integer sampleRateHz;

    @Column(name = "channels")
    private Integer channels;

    @Column(name = "bit_depth")
    private Integer bitDepth;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(name = "content_type", length = 255)
    private String contentType;

    @Column(name = "sha256", length = 64)
    private String sha256;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    public AudioFile() {
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

    public void setId(UUID id) {
        this.id = id;
    }

    public Song getSong() {
        return song;
    }

    public void setSong(Song song) {
        this.song = song;
    }

    public void setStorageProvider(String storageProvider) {
        this.storageProvider = storageProvider;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public void setBitrateKbps(Integer bitrateKbps) {
        this.bitrateKbps = bitrateKbps;
    }

    public void setSizeBytes(Long sizeBytes) {
        this.sizeBytes = sizeBytes;
    }

    public void setPrimary(boolean primary) {
        this.primary = primary;
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

    public String getLabel() {
        return label;
    }

    public Integer getSampleRateHz() {
        return sampleRateHz;
    }

    public Integer getChannels() {
        return channels;
    }

    public Integer getBitDepth() {
        return bitDepth;
    }

    public String getContentType() {
        return contentType;
    }

    public String getSha256() {
        return sha256;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }

    public boolean isPrimary() {
        return primary;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public void setSampleRateHz(Integer sampleRateHz) {
        this.sampleRateHz = sampleRateHz;
    }

    public void setChannels(Integer channels) {
        this.channels = channels;
    }

    public void setBitDepth(Integer bitDepth) {
        this.bitDepth = bitDepth;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public void setSha256(String sha256) {
        this.sha256 = sha256;
    }
}
