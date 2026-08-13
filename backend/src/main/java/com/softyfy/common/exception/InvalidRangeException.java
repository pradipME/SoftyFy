package com.softyfy.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Raised when an HTTP {@code Range} header is present but cannot be satisfied.
 * Maps to HTTP 416 and is rendered as a standards-compliant empty response
 * with a Content-Range header of the form {@code bytes &#42;/TOTAL} rather than
 * a JSON body, so media clients stay compatible.
 */
public class InvalidRangeException extends ApiException {

    private final long totalSize;

    public InvalidRangeException(long totalSize) {
        super(ErrorCode.INVALID_RANGE, HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
                "The requested byte range cannot be satisfied");
        this.totalSize = totalSize;
    }

    public long getTotalSize() {
        return totalSize;
    }
}
