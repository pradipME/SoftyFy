alter table audio_file
    add column label varchar(255);

alter table audio_file
    add column sample_rate_hz integer;

alter table audio_file
    add column channels integer;

alter table audio_file
    add column bit_depth integer;

alter table audio_file
    add column content_type varchar(255);

alter table audio_file
    add column sha256 varchar(64);

create unique index uq_audio_file_sha256
    on audio_file (sha256)
    where sha256 is not null;

create index ix_audio_file_song_id_primary
    on audio_file (song_id, is_primary);
