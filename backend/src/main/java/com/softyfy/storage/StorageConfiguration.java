package com.softyfy.storage;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Path;

@Configuration
@EnableConfigurationProperties({StorageProperties.class, AudioProperties.class})
public class StorageConfiguration {

    @Bean
    public AudioStorage audioStorage(StorageProperties properties) {
        return new LocalAudioStorage(Path.of(properties.getLocalRoot()));
    }
}
