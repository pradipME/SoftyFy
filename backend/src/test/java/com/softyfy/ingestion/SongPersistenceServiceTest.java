package com.softyfy.ingestion;

import com.softyfy.album.Album;
import com.softyfy.album.AlbumRepository;
import com.softyfy.artist.Artist;
import com.softyfy.artist.ArtistRepository;
import com.softyfy.song.AudioFile;
import com.softyfy.song.AudioFileRepository;
import com.softyfy.song.Song;
import com.softyfy.song.SongRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SongPersistenceServiceTest {

    @Mock
    private SongRepository songRepository;
    @Mock
    private AlbumRepository albumRepository;
    @Mock
    private ArtistRepository artistRepository;
    @Mock
    private AudioFileRepository audioFileRepository;

    private SongPersistenceService service;

    @BeforeEach
    void setUp() {
        service = new SongPersistenceService(songRepository, albumRepository, artistRepository,
                audioFileRepository);
    }

    private AudioMetadata metadata(int durationSeconds) {
        return new AudioMetadata("Song", List.of("Artist"), "Album", "Artist", 2020,
                durationSeconds, 1, null, 320, 44100, 2, 16, "mp3", "320 kbps");
    }

    private AudioFile newAudioFile() {
        AudioFile audioFile = new AudioFile();
        audioFile.setFormat("mp3");
        audioFile.setPrimary(true);
        return audioFile;
    }

    @Test
    void createsSongWhenNoMatchExists() {
        Artist artist = new Artist("Artist");
        when(artistRepository.findByNameIgnoreCase("Artist")).thenReturn(List.of(artist));
        when(albumRepository.findByTitleIgnoreCase("Album")).thenReturn(List.of());
        when(songRepository.findByTitleIgnoreCase("Song")).thenReturn(List.of());

        Song result = service.persist(newAudioFile(), metadata(200), new UploadOverrides(null, null, null));

        assertThat(result.getTitle()).isEqualTo("Song");
        verify(songRepository).save(any(Song.class));
        verify(audioFileRepository).save(any(AudioFile.class));
    }

    @Test
    void attachesToExistingSongWhenMetadataMatches() {
        Artist artist = new Artist("Artist");
        Album album = new Album("Album", 2020, artist);
        Song existing = new Song("Song", album, List.of(artist));
        existing.setDurationSeconds(200);
        when(artistRepository.findByNameIgnoreCase("Artist")).thenReturn(List.of(artist));
        when(albumRepository.findByTitleIgnoreCase("Album")).thenReturn(List.of(album));
        when(songRepository.findByTitleIgnoreCase("Song")).thenReturn(List.of(existing));

        AudioFile audioFile = newAudioFile();
        Song result = service.persist(audioFile, metadata(201), new UploadOverrides(null, null, null));

        assertThat(result).isSameAs(existing);
        assertThat(audioFile.isPrimary()).isFalse();
        verify(songRepository, never()).save(any(Song.class));
        verify(audioFileRepository).save(audioFile);
    }

    @Test
    void createsNewSongWhenDurationDiffersBeyondTolerance() {
        Artist artist = new Artist("Artist");
        Song existing = new Song("Song", null, List.of(artist));
        existing.setDurationSeconds(60);
        when(artistRepository.findByNameIgnoreCase("Artist")).thenReturn(List.of(artist));
        when(songRepository.findByTitleIgnoreCase("Song")).thenReturn(List.of(existing));

        Song result = service.persist(newAudioFile(), metadata(300), new UploadOverrides(null, null, null));

        assertThat(result.getTitle()).isEqualTo("Song");
        verify(songRepository).save(any(Song.class));
    }

    @Test
    void overrideWinsOverMetadata() {
        when(artistRepository.findByNameIgnoreCase("Custom Artist")).thenReturn(List.of());
        when(artistRepository.save(any(Artist.class))).thenAnswer(inv -> inv.getArgument(0));
        when(albumRepository.findByTitleIgnoreCase("Custom Album")).thenReturn(List.of());
        when(songRepository.findByTitleIgnoreCase("Custom Title")).thenReturn(List.of());

        Song result = service.persist(newAudioFile(), metadata(200),
                new UploadOverrides("Custom Title", "Custom Artist", "Custom Album"));

        assertThat(result.getTitle()).isEqualTo("Custom Title");
        assertThat(result.getArtists()).extracting(Artist::getName).containsExactly("Custom Artist");
        assertThat(result.getAlbum().getTitle()).isEqualTo("Custom Album");
    }

    @Test
    void defaultsToUnknownArtistWhenNoneProvided() {
        when(artistRepository.findByNameIgnoreCase("Unknown Artist")).thenReturn(List.of());
        when(artistRepository.save(any(Artist.class))).thenAnswer(inv -> inv.getArgument(0));
        when(songRepository.findByTitleIgnoreCase("Song")).thenReturn(List.of());

        AudioMetadata noArtist = new AudioMetadata("Song", List.of(), null, null, null,
                200, null, null, null, null, null, null, "mp3", null);
        Song result = service.persist(newAudioFile(), noArtist, new UploadOverrides(null, null, null));

        assertThat(result.getArtists()).extracting(Artist::getName).containsExactly("Unknown Artist");
    }
}
