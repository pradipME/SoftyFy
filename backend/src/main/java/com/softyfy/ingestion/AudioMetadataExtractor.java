package com.softyfy.ingestion;

import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.AudioFileIO;
import org.jaudiotagger.audio.AudioHeader;
import org.jaudiotagger.tag.FieldKey;
import org.jaudiotagger.tag.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts metadata from an uploaded audio file using jaudiotagger. Missing
 * optional fields fall back to sensible defaults (title from the file name,
 * artist "Unknown Artist") and a file that cannot be parsed still yields a
 * minimal record so the upload is never rejected purely for missing metadata.
 */
public class AudioMetadataExtractor {

    private static final Logger log = LoggerFactory.getLogger(AudioMetadataExtractor.class);
    private static final Pattern YEAR_PATTERN = Pattern.compile("(\\d{4})");
    private static final String UNKNOWN_ARTIST = "Unknown Artist";

    public AudioMetadata extract(Path file, String originalFilename) {
        String fallbackTitle = titleFromFileName(originalFilename);
        String format = AudioFileValidator.extensionOf(originalFilename);
        try {
            AudioFile audio = AudioFileIO.read(file.toFile());
            Tag tag = audio.getTag();
            AudioHeader header = audio.getAudioHeader();
            if (tag == null) {
                return minimal(header, fallbackTitle, format);
            }
            return fromTag(tag, header, fallbackTitle, format);
        } catch (Exception ex) {
            log.warn("Could not parse audio metadata for {}, using file name fallback", originalFilename, ex);
            return new AudioMetadata(fallbackTitle, List.of(UNKNOWN_ARTIST), null, null, null,
                    null, null, null, null, null, null, null, format, null);
        }
    }

    private AudioMetadata fromTag(Tag tag, AudioHeader header, String fallbackTitle, String format) {
        String title = firstNonBlank(tag.getFirst(FieldKey.TITLE));
        if (title == null) {
            title = fallbackTitle;
        }
        List<String> artists = artistNames(tag);
        String album = firstNonBlank(tag.getFirst(FieldKey.ALBUM));
        String albumArtist = firstNonBlank(tag.getFirst(FieldKey.ALBUM_ARTIST));
        Integer year = parseYear(tag.getFirst(FieldKey.YEAR));
        Integer track = parseInt(tag.getFirst(FieldKey.TRACK));
        Integer disc = parseInt(tag.getFirst(FieldKey.DISC_NO));
        Integer bitrate = header != null ? parseHeaderInt(header.getBitRate()) : null;
        Integer sampleRate = header != null ? parseHeaderInt(header.getSampleRate()) : null;
        Integer channels = header != null ? parseHeaderInt(header.getChannels()) : null;
        Integer duration = header != null ? positive(header.getTrackLength()) : null;
        Integer bitDepth = header != null ? positive(header.getBitsPerSample()) : null;
        return new AudioMetadata(title, artists, album, albumArtist, year, duration, track, disc,
                bitrate, sampleRate, channels, bitDepth, format, buildLabel(bitrate, sampleRate, bitDepth));
    }

    private AudioMetadata minimal(AudioHeader header, String fallbackTitle, String format) {
        Integer bitrate = header != null ? parseHeaderInt(header.getBitRate()) : null;
        Integer sampleRate = header != null ? parseHeaderInt(header.getSampleRate()) : null;
        Integer channels = header != null ? parseHeaderInt(header.getChannels()) : null;
        Integer duration = header != null ? positive(header.getTrackLength()) : null;
        Integer bitDepth = header != null ? positive(header.getBitsPerSample()) : null;
        return new AudioMetadata(fallbackTitle, List.of(UNKNOWN_ARTIST), null, null, null,
                duration, null, null, bitrate, sampleRate, channels, bitDepth,
                format, buildLabel(bitrate, sampleRate, bitDepth));
    }

    private List<String> artistNames(Tag tag) {
        List<String> result = new ArrayList<>();
        for (String raw : tag.getAll(FieldKey.ARTIST)) {
            if (raw == null) {
                continue;
            }
            for (String part : raw.split("[;/]")) {
                String name = part.trim();
                if (!name.isEmpty() && !result.contains(name)) {
                    result.add(name);
                }
            }
        }
        if (result.isEmpty()) {
            result.add(UNKNOWN_ARTIST);
        }
        return result;
    }

    private String titleFromFileName(String originalFilename) {
        String name = originalFilename == null ? "Untitled" : originalFilename.trim();
        if (name.isEmpty()) {
            return "Untitled";
        }
        int dot = name.lastIndexOf('.');
        String stem = dot > 0 ? name.substring(0, dot) : name;
        return stem.trim().isEmpty() ? "Untitled" : stem.trim();
    }

    private String firstNonBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private Integer parseYear(String value) {
        if (value == null) {
            return null;
        }
        Matcher matcher = YEAR_PATTERN.matcher(value);
        if (!matcher.find()) {
            return null;
        }
        return Integer.parseInt(matcher.group(1));
    }

    private Integer parseInt(String value) {
        if (value == null) {
            return null;
        }
        String cleaned = value.trim();
        int slash = cleaned.indexOf('/');
        if (slash >= 0) {
            cleaned = cleaned.substring(0, slash);
        }
        try {
            return Integer.parseInt(cleaned);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Integer parseHeaderInt(String value) {
        if (value == null) {
            return null;
        }
        String digits = value.replaceAll("\\D", "");
        if (digits.isEmpty()) {
            return null;
        }
        try {
            int parsed = Integer.parseInt(digits);
            return parsed > 0 ? parsed : null;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Integer positive(int value) {
        return value > 0 ? value : null;
    }

    private String buildLabel(Integer bitrate, Integer sampleRate, Integer bitDepth) {
        if (bitDepth != null && sampleRate != null) {
            return bitDepth + "-bit/" + (sampleRate / 1000) + " kHz";
        }
        if (bitrate != null) {
            return bitrate + " kbps";
        }
        return null;
    }
}
