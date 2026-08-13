package com.softyfy.ingestion;

import com.softyfy.common.exception.ApiException;
import com.softyfy.common.exception.ErrorCode;
import com.softyfy.storage.AudioProperties;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Set;

/**
 * Validates that an uploaded file is a plausible audio file we are willing to
 * accept: a known extension, a declared size within limits, and matching magic
 * bytes. File name checks prevent any path-traversal attempt from reaching
 * storage.
 */
public final class AudioFileValidator {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("mp3", "flac", "wav", "m4a", "ogg");

    private AudioFileValidator() {
    }

    public static void validate(MultipartFile file, AudioProperties properties) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(ErrorCode.INVALID_FILE, HttpStatus.BAD_REQUEST,
                    "No audio file was provided");
        }
        String filename = file.getOriginalFilename();
        if (isSuspiciousFilename(filename)) {
            throw new ApiException(ErrorCode.INVALID_FILE, HttpStatus.BAD_REQUEST,
                    "Invalid file name");
        }
        String extension = extensionOf(filename);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ApiException(ErrorCode.UNSUPPORTED_MEDIA_TYPE, HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Unsupported audio format: " + extension);
        }
        if (file.getSize() > properties.getMaxFileSizeBytes()) {
            throw new ApiException(ErrorCode.FILE_TOO_LARGE, HttpStatus.PAYLOAD_TOO_LARGE,
                    "File exceeds the maximum size of " + properties.getMaxFileSizeMb() + " MB");
        }
        if (!matchesMagicBytes(file, extension)) {
            throw new ApiException(ErrorCode.INVALID_FILE, HttpStatus.BAD_REQUEST,
                    "File content does not match the declared audio format");
        }
    }

    public static String extensionOf(String filename) {
        String name = filename == null ? "" : filename.trim();
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) {
            return "";
        }
        return name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static boolean isSuspiciousFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return true;
        }
        String name = filename.trim();
        return name.contains("/")
                || name.contains("\\")
                || name.contains("..")
                || name.startsWith(".")
                || name.length() > 255;
    }

    private static boolean matchesMagicBytes(MultipartFile file, String extension) {
        try (InputStream in = file.getInputStream()) {
            byte[] head = in.readNBytes(12);
            return switch (extension) {
                case "mp3" -> isMp3(head);
                case "flac" -> startsWith(head, "fLaC");
                case "wav" -> startsWith(head, "RIFF") && lengthAtLeast(head, 12) && bytesAt(head, 8, "WAVE");
                case "m4a" -> lengthAtLeast(head, 8) && bytesAt(head, 4, "ftyp");
                case "ogg" -> startsWith(head, "OggS");
                default -> false;
            };
        } catch (IOException ex) {
            return false;
        }
    }

    private static boolean isMp3(byte[] head) {
        if (startsWith(head, "ID3")) {
            return true;
        }
        if (head.length >= 2) {
            int b0 = head[0] & 0xFF;
            int b1 = head[1] & 0xFF;
            return b0 == 0xFF && (b1 & 0xE0) == 0xE0;
        }
        return false;
    }

    private static boolean startsWith(byte[] data, String prefix) {
        byte[] expected = prefix.getBytes();
        if (data.length < expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if (data[i] != expected[i]) {
                return false;
            }
        }
        return true;
    }

    private static boolean bytesAt(byte[] data, int offset, String value) {
        byte[] expected = value.getBytes();
        if (data.length < offset + expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if (data[offset + i] != expected[i]) {
                return false;
            }
        }
        return true;
    }

    private static boolean lengthAtLeast(byte[] data, int n) {
        return data.length >= n;
    }
}
