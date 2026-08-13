package com.softyfy.ingestion;

import com.softyfy.album.Album;
import com.softyfy.album.AlbumRepository;
import com.softyfy.artist.Artist;
import com.softyfy.artist.ArtistRepository;
import com.softyfy.song.AudioFile;
import com.softyfy.song.AudioFileRepository;
import com.softyfy.song.Song;
import com.softyfy.song.SongRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Transactional part of the ingestion flow: resolves or creates the artists,
 * album and song for the extracted metadata and persists the new audio file.
 * Runs in its own transaction so a failure here can be rolled back while the
 * caller independently removes the already-stored object file.
 */
@Service
public class SongPersistenceService {

    private static final int DURATION_MATCH_TOLERANCE_SECONDS = 2;
    private static final String UNKNOWN_ARTIST = "Unknown Artist";

    private final SongRepository songRepository;
    private final AlbumRepository albumRepository;
    private final ArtistRepository artistRepository;
    private final AudioFileRepository audioFileRepository;

    public SongPersistenceService(SongRepository songRepository, AlbumRepository albumRepository,
                                  ArtistRepository artistRepository, AudioFileRepository audioFileRepository) {
        this.songRepository = songRepository;
        this.albumRepository = albumRepository;
        this.artistRepository = artistRepository;
        this.audioFileRepository = audioFileRepository;
    }

    @Transactional
    public Song persist(AudioFile audioFile, AudioMetadata metadata, UploadOverrides overrides) {
        String title = override(overrides != null ? overrides.title() : null, metadata.title());
        List<String> artistNames = artistNames(metadata, overrides);
        String albumName = override(overrides != null ? overrides.album() : null, metadata.albumName());

        List<Artist> artists = resolveArtists(artistNames);
        Album album = albumName != null ? resolveAlbum(albumName, metadata.albumArtistName(), metadata.year(), artists) : null;

        Song existing = findMatchingSong(title, artists, album, metadata.durationSeconds());
        if (existing != null) {
            audioFile.setPrimary(false);
            existing.addAudioFile(audioFile);
            audioFileRepository.save(audioFile);
            return existing;
        }

        Song song = new Song(title, album, artists);
        song.setDurationSeconds(metadata.durationSeconds());
        song.setTrackNumber(metadata.trackNumber());
        songRepository.save(song);
        song.addAudioFile(audioFile);
        audioFileRepository.save(audioFile);
        return song;
    }

    private List<String> artistNames(AudioMetadata metadata, UploadOverrides overrides) {
        String artistOverride = overrides != null ? overrides.artist() : null;
        if (artistOverride != null && !artistOverride.isBlank()) {
            return List.of(artistOverride.trim());
        }
        List<String> names = metadata.artistNames();
        if (names == null || names.isEmpty()) {
            return List.of(UNKNOWN_ARTIST);
        }
        return names;
    }

    private String override(String override, String metadataValue) {
        if (override != null && !override.isBlank()) {
            return override.trim();
        }
        return metadataValue;
    }

    private List<Artist> resolveArtists(List<String> names) {
        List<Artist> result = new ArrayList<>();
        for (String name : names) {
            Artist artist = artistRepository.findByNameIgnoreCase(name).stream()
                    .findFirst()
                    .orElseGet(() -> artistRepository.save(new Artist(name)));
            result.add(artist);
        }
        return result;
    }

    private Album resolveAlbum(String albumName, String albumArtistName, Integer year, List<Artist> songArtists) {
        Artist albumArtist = null;
        if (albumArtistName != null) {
            albumArtist = artistRepository.findByNameIgnoreCase(albumArtistName).stream()
                    .findFirst()
                    .orElse(null);
        }
        for (Album candidate : albumRepository.findByTitleIgnoreCase(albumName)) {
            if (matchesAlbumArtist(candidate, albumArtist, songArtists)) {
                return candidate;
            }
        }
        Artist owner = albumArtist != null ? albumArtist
                : songArtists.isEmpty() ? null : songArtists.get(0);
        Album album = new Album(albumName, year, owner);
        albumRepository.save(album);
        return album;
    }

    private boolean matchesAlbumArtist(Album candidate, Artist albumArtist, List<Artist> songArtists) {
        Artist candidateArtist = candidate.getArtist();
        if (albumArtist != null) {
            return Objects.equals(candidateArtist != null ? candidateArtist.getId() : null,
                    albumArtist.getId());
        }
        if (candidateArtist == null) {
            return true;
        }
        return songArtists.stream().anyMatch(a -> Objects.equals(a.getId(), candidateArtist.getId()));
    }

    private Song findMatchingSong(String title, List<Artist> artists, Album album, Integer durationSeconds) {
        for (Song song : songRepository.findByTitleIgnoreCase(title)) {
            if (!sameDuration(song.getDurationSeconds(), durationSeconds)) {
                continue;
            }
            if (!sameAlbum(song.getAlbum(), album)) {
                continue;
            }
            if (sameArtists(song.getArtists(), artists)) {
                return song;
            }
        }
        return null;
    }

    private boolean sameDuration(Integer existing, Integer incoming) {
        if (existing == null || incoming == null) {
            return existing == null && incoming == null;
        }
        return Math.abs(existing - incoming) <= DURATION_MATCH_TOLERANCE_SECONDS;
    }

    private boolean sameAlbum(Album existing, Album incoming) {
        if (existing == null || incoming == null) {
            return existing == null && incoming == null;
        }
        return existing.getTitle().equalsIgnoreCase(incoming.getTitle());
    }

    private boolean sameArtists(List<Artist> existing, List<Artist> incoming) {
        if (existing.size() != incoming.size()) {
            return false;
        }
        for (Artist artist : incoming) {
            boolean found = existing.stream()
                    .anyMatch(a -> a.getName().equalsIgnoreCase(artist.getName()));
            if (!found) {
                return false;
            }
        }
        return true;
    }
}
