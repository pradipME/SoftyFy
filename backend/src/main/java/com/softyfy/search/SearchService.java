package com.softyfy.search;

import com.softyfy.album.AlbumRepository;
import com.softyfy.album.dto.AlbumSummaryDto;
import com.softyfy.artist.ArtistRepository;
import com.softyfy.artist.dto.ArtistSummaryDto;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.ValidationException;
import com.softyfy.playlist.PlaylistRepository;
import com.softyfy.playlist.dto.PlaylistSummaryDto;
import com.softyfy.song.SongMapper;
import com.softyfy.song.SongRepository;
import com.softyfy.song.dto.SongSummaryDto;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SearchService {

    private static final int RESULTS_PER_TYPE = 10;

    private final SongRepository songRepository;
    private final ArtistRepository artistRepository;
    private final AlbumRepository albumRepository;
    private final PlaylistRepository playlistRepository;

    public SearchService(SongRepository songRepository, ArtistRepository artistRepository,
                         AlbumRepository albumRepository, PlaylistRepository playlistRepository) {
        this.songRepository = songRepository;
        this.artistRepository = artistRepository;
        this.albumRepository = albumRepository;
        this.playlistRepository = playlistRepository;
    }

    @Transactional(readOnly = true)
    public SearchResultsDto search(String term) {
        String query = term == null ? "" : term.trim();
        if (query.isEmpty()) {
            throw new ValidationException(ErrorCode.VALIDATION_FAILED, "q must not be blank");
        }
        Pageable limit = PageRequest.of(0, RESULTS_PER_TYPE);

        var songs = songRepository.search(query, limit).getContent().stream()
                .map(SongMapper::toSummary)
                .toList();
        var artists = artistRepository.searchByName(query, limit).getContent().stream()
                .map(ArtistSummaryDto::from)
                .toList();
        var albums = albumRepository.searchByTitle(query, limit).getContent().stream()
                .map(AlbumSummaryDto::from)
                .toList();
        var playlists = playlistRepository.searchByName(query, limit).getContent().stream()
                .map(PlaylistSummaryDto::from)
                .toList();

        return new SearchResultsDto(songs, artists, albums, playlists);
    }
}
