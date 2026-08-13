package com.softyfy.song;

import com.softyfy.artist.Artist;
import com.softyfy.song.dto.SongDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SongMapperTest {

    @Test
    void sortsArtistsCaseInsensitively() {
        Song song = new Song("Test Song", null, List.of(new Artist("Zed"), new Artist("abc"), new Artist("Beta")));

        SongDto dto = SongMapper.toDto(song);

        assertThat(dto.artists()).extracting(a -> a.name())
                .containsExactly("abc", "Beta", "Zed");
    }

    @Test
    void sortsAudioFilesPrimaryFirst() {
        Song song = new Song("Test Song", null, null);
        song.getAudioFiles().add(new AudioFile(song, "disk", "low", "mp3", 128, 1L, false));
        song.getAudioFiles().add(new AudioFile(song, "disk", "high", "flac", 1411, 2L, true));
        song.getAudioFiles().add(new AudioFile(song, "disk", "mid", "mp3", 320, 3L, false));

        SongDto dto = SongMapper.toDto(song);

        assertThat(dto.audioFiles()).extracting(a -> a.storageKey())
                .containsExactly("high", "low", "mid");
        assertThat(dto.audioFiles().get(0).primary()).isTrue();
    }
}
