package com.softyfy.streaming;

import com.softyfy.common.exception.InvalidRangeException;

import java.util.Optional;

/**
 * Parser for HTTP {@code Range} headers (RFC 7233, section 3.1) restricted to
 * a single {@code bytes} range, which is all that browser audio seeking
 * requires.
 *
 * <p>Supported forms for a total size {@code T}:</p>
 * <ul>
 *     <li>{@code bytes=start-end} - clamped so it never exceeds {@code T-1};</li>
 *     <li>{@code bytes=start-} - from {@code start} through {@code T-1};</li>
 *     <li>{@code bytes=-suffix} - the final {@code suffix} bytes.</li>
 * </ul>
 *
 * <p>An absent or blank header is treated as "no range". Any other value -
 * unknown unit, multiple ranges, malformed numbers, or a range that cannot be
 * satisfied - is rejected with {@link InvalidRangeException} (HTTP 416).</p>
 */
public final class RangeParser {

    private RangeParser() {
    }

    /**
     * @param rangeHeader raw {@code Range} header value, may be {@code null}
     * @param total       total size of the object in bytes
     * @return the satisfiable range, or {@link Optional#empty()} when no header was sent
     * @throws InvalidRangeException when the header is present but cannot be satisfied
     */
    public static Optional<ByteRange> parse(String rangeHeader, long total) {
        if (rangeHeader == null || rangeHeader.isBlank()) {
            return Optional.empty();
        }
        if (total <= 0) {
            throw new InvalidRangeException(total);
        }

        String header = rangeHeader.trim();
        int eq = header.indexOf('=');
        if (eq <= 0) {
            throw new InvalidRangeException(total);
        }
        String unit = header.substring(0, eq).trim();
        if (!"bytes".equalsIgnoreCase(unit)) {
            throw new InvalidRangeException(total);
        }

        String spec = header.substring(eq + 1).trim();
        if (spec.contains(",")) {
            // Multipart/byteranges is intentionally not supported.
            throw new InvalidRangeException(total);
        }
        String[] parts = spec.split("-", -1);
        if (parts.length != 2) {
            throw new InvalidRangeException(total);
        }

        String first = parts[0].trim();
        String last = parts[1].trim();
        try {
            if (first.isEmpty()) {
                return parseSuffixRange(last, total);
            }
            long start = Long.parseLong(first);
            if (start < 0 || start >= total) {
                throw new InvalidRangeException(total);
            }
            if (last.isEmpty()) {
                return Optional.of(new ByteRange(start, total - 1, total));
            }
            long end = Long.parseLong(last);
            if (end < start) {
                throw new InvalidRangeException(total);
            }
            return Optional.of(new ByteRange(start, Math.min(end, total - 1), total));
        } catch (NumberFormatException ex) {
            throw new InvalidRangeException(total);
        }
    }

    private static Optional<ByteRange> parseSuffixRange(String suffix, long total) {
        if (suffix.isEmpty()) {
            throw new InvalidRangeException(total);
        }
        long length;
        try {
            length = Long.parseLong(suffix);
        } catch (NumberFormatException ex) {
            throw new InvalidRangeException(total);
        }
        if (length <= 0) {
            throw new InvalidRangeException(total);
        }
        long start = Math.max(0, total - length);
        return Optional.of(new ByteRange(start, total - 1, total));
    }
}
