package com.softyfy.streaming;

/**
 * A single satisfiable byte range over an object of known total size.
 *
 * @param start inclusive first byte offset
 * @param end   inclusive last byte offset
 * @param total total size of the object in bytes
 */
public record ByteRange(long start, long end, long total) {

    public ByteRange {
        if (start < 0 || end < start || total <= 0) {
            throw new IllegalArgumentException("Invalid byte range: start=" + start + ", end=" + end + ", total=" + total);
        }
    }

    /** Number of bytes covered by this range. */
    public long length() {
        return end - start + 1;
    }
}
