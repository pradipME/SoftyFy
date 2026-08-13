package com.softyfy.song;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface SongRepository extends JpaRepository<Song, UUID> {

    @EntityGraph(attributePaths = {"artists", "album", "audioFiles"})
    @Query("""
            select distinct s from Song s
            left join s.artists a
            order by lower(a.name) asc, lower(s.title) asc
            """)
    Page<Song> findAllOrderByArtist(Pageable pageable);

    @EntityGraph(attributePaths = {"artists", "album", "audioFiles"})
    @Query("""
            select s from Song s
            order by lower(s.album.title) asc nulls last, lower(s.title) asc
            """)
    Page<Song> findAllOrderByAlbum(Pageable pageable);

    @EntityGraph(attributePaths = {"artists", "album", "audioFiles"})
    @Query("select s from Song s order by lower(s.title) asc")
    Page<Song> findAllOrderByTitle(Pageable pageable);

    @EntityGraph(attributePaths = {"artists", "album", "audioFiles"})
    @Query("select s from Song s order by s.createdAt desc")
    Page<Song> findAllOrderByCreated(Pageable pageable);

    @EntityGraph(attributePaths = {"artists", "album", "audioFiles"})
    @Query("select s from Song s where s.id = :id")
    List<Song> findByIdWithGraph(UUID id);

    @EntityGraph(attributePaths = {"artists", "album"})
    @Query("""
            select s from Song s
            where s.album.id = :albumId
            order by s.trackNumber asc nulls last, lower(s.title) asc
            """)
    List<Song> findByAlbumId(UUID albumId);

    @EntityGraph(attributePaths = {"artists", "album"})
    @Query("""
            select s from Song s
            join s.artists a
            where a.id = :artistId
            order by lower(s.title) asc
            """)
    List<Song> findByArtistId(UUID artistId);

    @EntityGraph(attributePaths = {"artists", "album", "audioFiles"})
    @Query("""
            select distinct s from Song s
            left join s.artists a
            where lower(s.title) like lower(concat('%', :term, '%'))
               or lower(a.name) like lower(concat('%', :term, '%'))
            order by lower(s.title) asc
            """)
    Page<Song> search(String term, Pageable pageable);
}
