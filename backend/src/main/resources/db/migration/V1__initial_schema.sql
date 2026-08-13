create extension if not exists pg_trgm;

create table artist (
    id         uuid primary key,
    name       varchar(200) not null,
    created_at timestamptz  not null,
    updated_at timestamptz  not null
);

create table album (
    id         uuid primary key,
    title      varchar(200) not null,
    year       integer,
    artist_id  uuid,
    created_at timestamptz  not null,
    updated_at timestamptz  not null,
    constraint fk_album_artist foreign key (artist_id) references artist (id)
);

create table song (
    id               uuid primary key,
    title            varchar(300) not null,
    duration_seconds integer,
    track_number     integer,
    album_id         uuid,
    created_at       timestamptz  not null,
    updated_at       timestamptz  not null,
    constraint fk_song_album foreign key (album_id) references album (id)
);

create table song_artist (
    song_id   uuid not null,
    artist_id uuid not null,
    primary key (song_id, artist_id),
    constraint fk_song_artist_song foreign key (song_id) references song (id),
    constraint fk_song_artist_artist foreign key (artist_id) references artist (id)
);

create table audio_file (
    id               uuid primary key,
    song_id          uuid         not null,
    storage_provider varchar(50)  not null,
    storage_key      varchar(500) not null,
    format           varchar(20),
    bitrate_kbps     integer,
    size_bytes       bigint,
    is_primary       boolean      not null default false,
    created_at       timestamptz  not null,
    updated_at       timestamptz  not null,
    constraint fk_audio_file_song foreign key (song_id) references song (id),
    constraint uq_audio_file_storage unique (storage_provider, storage_key)
);

create unique index uq_audio_file_primary_per_song
    on audio_file (song_id) where is_primary;

create table playlist (
    id          uuid primary key,
    name        varchar(200) not null,
    description varchar(500),
    created_at  timestamptz  not null,
    updated_at  timestamptz  not null
);

create table playlist_song (
    playlist_id uuid    not null,
    song_id     uuid    not null,
    position    integer not null,
    primary key (playlist_id, song_id),
    constraint fk_playlist_song_playlist foreign key (playlist_id) references playlist (id),
    constraint fk_playlist_song_song foreign key (song_id) references song (id),
    constraint uq_playlist_song_position unique (playlist_id, position) deferrable initially deferred
);

create table favorite (
    song_id    uuid primary key,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint fk_favorite_song foreign key (song_id) references song (id)
);

create index ix_artist_name_trgm on artist using gin (lower(name) gin_trgm_ops);
create index ix_album_title_trgm on album using gin (lower(title) gin_trgm_ops);
create index ix_song_title_trgm on song using gin (lower(title) gin_trgm_ops);
create index ix_song_artist_song_id on song_artist (song_id);
create index ix_song_artist_artist_id on song_artist (artist_id);
create index ix_album_artist_id on album (artist_id);
create index ix_song_album_id on song (album_id);
create index ix_audio_file_song_id on audio_file (song_id);
create index ix_playlist_song_song_id on playlist_song (song_id);
