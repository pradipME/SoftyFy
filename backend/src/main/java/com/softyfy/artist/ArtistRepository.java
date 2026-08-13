package com.softyfy.artist;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ArtistRepository extends JpaRepository<Artist, UUID> {

    List<Artist> findByNameIgnoreCase(String name);

    @Query("""
            select a.id, count(distinct s.id)
            from Artist a
            left join a.songs s
            where a.id in :ids
            group by a.id
            """)
    List<Object[]> countSongsByArtistIds(Collection<UUID> ids);

    @Query("""
            select a from Artist a
            where lower(a.name) like lower(concat('%', :term, '%'))
            order by lower(a.name) asc
            """)
    Page<Artist> searchByName(String term, Pageable pageable);
}
