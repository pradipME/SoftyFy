package com.softyfy.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configures the active audio storage provider and its options.
 */
@ConfigurationProperties(prefix = "softyfy.storage")
public class StorageProperties {

    /**
     * Identifier of the active provider (must match a registered AudioStorage bean).
     */
    private String provider = "local";

    /**
     * Root directory for the local disk provider.
     */
    private String localRoot = "./data/audio";

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getLocalRoot() {
        return localRoot;
    }

    public void setLocalRoot(String localRoot) {
        this.localRoot = localRoot;
    }
}
