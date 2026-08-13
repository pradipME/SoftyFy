alter table song_artist
    drop constraint fk_song_artist_song;
alter table song_artist
    add constraint fk_song_artist_song foreign key (song_id) references song (id) on delete cascade;

alter table audio_file
    drop constraint fk_audio_file_song;
alter table audio_file
    add constraint fk_audio_file_song foreign key (song_id) references song (id) on delete cascade;

alter table playlist_song
    drop constraint fk_playlist_song_song;
alter table playlist_song
    add constraint fk_playlist_song_song foreign key (song_id) references song (id) on delete cascade;

alter table favorite
    drop constraint fk_favorite_song;
alter table favorite
    add constraint fk_favorite_song foreign key (song_id) references song (id) on delete cascade;
