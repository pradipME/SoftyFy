package com.softyfy.song;

import com.softyfy.album.Album;
import com.softyfy.album.AlbumRepository;
import com.softyfy.artist.Artist;
import com.softyfy.artist.ArtistRepository;
import com.softyfy.common.api.PageResponse;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.common.exception.ValidationException;
import com.softyfy.song.dto.CreateSongRequest;
import com.softyfy.song.dto.SongDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class SongService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> SORT_OPTIONS = Set.of("title", "artist", "album", "created");

    private final SongRepository songRepository;
    private final AlbumRepository albumRepository;
    private final ArtistRepository artistRepository;

    public SongService(SongRepository songRepository, AlbumRepository albumRepository,
                       ArtistRepository artistRepository) {
        this.songRepository = songRepository;
        this.albumRepository = albumRepository;
        this.artistRepository = artistRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<SongDto> findAll(int page, int size, String sort) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        String normalizedSort = sort == null ? "title" : sort.toLowerCase(Locale.ROOT);
        Page<Song> songs = switch (normalizedSort) {
            case "artist" -> songRepository.findAllOrderByArtist(pageable);
            case "album" -> songRepository.findAllOrderByAlbum(pageable);
            case "created" -> songRepository.findAllOrderByCreated(pageable);
            case "title" -> songRepository.findAllOrderByTitle(pageable);
            default -> throw new ValidationException(ErrorCode.INVALID_SORT,
                    "Invalid sort option: '" + sort + "'. Allowed: title, artist, album, created");
        };
        return PageResponse.from(songs.map(SongMapper::toDto));
    }

    @Transactional(readOnly = true)
    public SongDto findById(UUID id) {
        return songRepository.findByIdWithGraph(id).stream()
                .findFirst()
                .map(SongMapper::toDto)
                .orElseThrow(() -> new NotFoundException(ErrorCode.SONG_NOT_FOUND, "Song not found: " + id));
    }

    @Transactional
    public SongDto create(CreateSongRequest request) {
        Album album = null;
        if (request.albumId() != null) {
            album = albumRepository.findById(request.albumId())
                    .orElseThrow(() -> new NotFoundException(ErrorCode.ALBUM_NOT_FOUND,
                            "Album not found: " + request.albumId()));
        }
        List<Artist> artists = resolveOrCreateArtists(request.artistNames());
        Song song = new Song(request.title(), album, artists);
        songRepository.save(song);
        return SongMapper.toDto(song);
    }

    private List<Artist> resolveOrCreateArtists(List<String> artistNames) {
        List<Artist> result = new ArrayList<>();
        if (artistNames == null) {
            return result;
        }
        for (String name : artistNames) {
            result.add(artistRepository.findByNameIgnoreCase(name).stream()
                    .findFirst()
                    .orElseGet(() -> artistRepository.save(new Artist(name))));
        }
        return result;
    }
}
