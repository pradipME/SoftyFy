package com.softyfy.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Tuning for audio file ingestion.
 */
@ConfigurationProperties(prefix = "softyfy.audio")
public class AudioProperties {

    /**
     * Maximum accepted upload size in megabytes.
     */
    private long maxFileSizeMb = 200;

    public long getMaxFileSizeMb() {
        return maxFileSizeMb;
    }

    public void setMaxFileSizeMb(long maxFileSizeMb) {
        this.maxFileSizeMb = maxFileSizeMb;
    }

    public long getMaxFileSizeBytes() {
        return maxFileSizeMb * 1024L * 1024L;
    }
}
