package com.softyfy.playlist;

import com.softyfy.common.api.PageResponse;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.common.exception.NotFoundException;
import com.softyfy.common.exception.ValidationException;
import com.softyfy.playlist.dto.PlaylistDetailDto;
import com.softyfy.playlist.dto.PlaylistSummaryDto;
import com.softyfy.song.Song;
import com.softyfy.song.SongMapper;
import com.softyfy.song.SongRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class PlaylistService {

    private static final int MAX_PAGE_SIZE = 100;

    private final PlaylistRepository playlistRepository;
    private final SongRepository songRepository;
    private final JdbcTemplate jdbcTemplate;

    public PlaylistService(PlaylistRepository playlistRepository, SongRepository songRepository,
                           JdbcTemplate jdbcTemplate) {
        this.playlistRepository = playlistRepository;
        this.songRepository = songRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public PlaylistDetailDto create(String name, String description) {
        Playlist playlist = playlistRepository.save(new Playlist(name, description));
        return PlaylistDetailDto.from(playlist, List.of());
    }

    @Transactional(readOnly = true)
    public PageResponse<PlaylistSummaryDto> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Order.asc("name").ignoreCase()));
        Page<Playlist> playlists = playlistRepository.findAll(pageable);
        return PageResponse.from(playlists.map(PlaylistSummaryDto::from));
    }

    @Transactional(readOnly = true)
    public PlaylistDetailDto findById(UUID id) {
        Playlist playlist = getPlaylistWithSongs(id);
        return PlaylistDetailDto.from(playlist, toSongSummaries(playlist));
    }

    @Transactional
    public PlaylistDetailDto addSongs(UUID playlistId, List<UUID> songIds) {
        Playlist playlist = getPlaylistWithSongs(playlistId);
        Set<UUID> existing = new HashSet<>();
        for (PlaylistSong entry : playlist.getSongs()) {
            existing.add(entry.getSong().getId());
        }

        List<Song> songs = songRepository.findAllById(songIds.stream().distinct().toList());
        Set<UUID> foundIds = new HashSet<>();
        for (Song song : songs) {
            foundIds.add(song.getId());
        }
        for (UUID songId : songIds.stream().distinct().toList()) {
            if (!foundIds.contains(songId)) {
                throw new NotFoundException(ErrorCode.SONG_NOT_FOUND, "Song not found: " + songId);
            }
        }

        int nextPosition = existing.size();
        for (UUID songId : songIds.stream().distinct().toList()) {
            if (existing.contains(songId)) {
                continue;
            }
            Song song = songRepository.getReferenceById(songId);
            playlist.getSongs().add(new PlaylistSong(playlist, song, nextPosition++));
        }
        playlistRepository.save(playlist);
        return PlaylistDetailDto.from(playlist, toSongSummaries(playlist));
    }

    @Transactional
    public void removeSong(UUID playlistId, UUID songId) {
        Playlist playlist = getPlaylistWithSongs(playlistId);
        boolean removed = playlist.getSongs().removeIf(entry -> entry.getSong().getId().equals(songId));
        if (removed) {
            reindexPositions(playlist);
            playlistRepository.save(playlist);
        }
    }

    @Transactional
    public PlaylistDetailDto reorder(UUID playlistId, List<UUID> requestedOrder) {
        Playlist playlist = getPlaylistWithSongs(playlistId);

        List<UUID> current = playlist.getSongs().stream()
                .map(entry -> entry.getSong().getId())
                .toList();

        if (current.isEmpty()) {
            if (!requestedOrder.isEmpty()) {
                throw invalidReorder("Playlist is empty; requested order must be empty");
            }
            return PlaylistDetailDto.from(playlist, toSongSummaries(playlist));
        }

        validateExactPermutation(current, requestedOrder);

        jdbcTemplate.update(buildReorderSql(requestedOrder.size(), playlistId), reorderArgs(requestedOrder, playlistId));
        playlistRepository.flush();

        return PlaylistDetailDto.from(playlist, summariesInOrder(playlist, requestedOrder));
    }

    private Playlist getPlaylistWithSongs(UUID id) {
        return playlistRepository.findByIdWithSongs(id).stream()
                .findFirst()
                .orElseThrow(() -> new NotFoundException(ErrorCode.PLAYLIST_NOT_FOUND, "Playlist not found: " + id));
    }

    private void validateExactPermutation(List<UUID> current, List<UUID> requestedOrder) {
        if (current.size() != requestedOrder.size()) {
            throw invalidReorder(
                    "Requested order must contain exactly " + current.size() + " song ids (got " + requestedOrder.size() + ")");
        }
        Set<UUID> currentSet = new HashSet<>(current);
        if (currentSet.size() != current.size()) {
            throw new IllegalStateException("Playlist contains duplicate songs; data integrity issue");
        }
        Set<UUID> requestedSet = new HashSet<>(requestedOrder);
        if (requestedSet.size() != requestedOrder.size()) {
            throw invalidReorder("Requested order contains duplicate song ids");
        }
        if (!requestedSet.equals(currentSet)) {
            throw invalidReorder("Requested order must be an exact permutation of the playlist's songs");
        }
    }

    private ValidationException invalidReorder(String message) {
        return new ValidationException(ErrorCode.INVALID_REORDER_REQUEST, message);
    }

    private String buildReorderSql(int size, UUID playlistId) {
        StringBuilder sql = new StringBuilder("update playlist_song set position = case song_id ");
        for (int i = 0; i < size; i++) {
            sql.append("when ? then ").append(i).append(" ");
        }
        sql.append("end where playlist_id = ?");
        return sql.toString();
    }

    private Object[] reorderArgs(List<UUID> requestedOrder, UUID playlistId) {
        List<Object> args = new ArrayList<>(requestedOrder);
        args.add(playlistId);
        return args.toArray();
    }

    private void reindexPositions(Playlist playlist) {
        int position = 0;
        for (PlaylistSong entry : playlist.getSongs()) {
            entry.setPosition(position++);
        }
    }

    private List<com.softyfy.song.dto.SongSummaryDto> summariesInOrder(Playlist playlist, List<UUID> order) {
        var byId = new java.util.LinkedHashMap<UUID, Song>();
        for (PlaylistSong entry : playlist.getSongs()) {
            byId.put(entry.getSong().getId(), entry.getSong());
        }
        return order.stream().map(byId::get).map(SongMapper::toSummary).toList();
    }

    private List<com.softyfy.song.dto.SongSummaryDto> toSongSummaries(Playlist playlist) {
        return playlist.getSongs().stream()
                .map(entry -> SongMapper.toSummary(entry.getSong()))
                .toList();
    }
}
