package com.softyfy.search;

import com.softyfy.album.dto.AlbumSummaryDto;
import com.softyfy.artist.dto.ArtistSummaryDto;
import com.softyfy.playlist.dto.PlaylistSummaryDto;
import com.softyfy.song.dto.SongSummaryDto;

import java.util.List;

public record SearchResultsDto(
        List<SongSummaryDto> songs,
        List<ArtistSummaryDto> artists,
        List<AlbumSummaryDto> albums,
        List<PlaylistSummaryDto> playlists) {
}
