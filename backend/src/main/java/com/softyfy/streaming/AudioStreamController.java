package com.softyfy.streaming;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.io.InputStream;
import java.util.Optional;
import java.util.UUID;

/**
 * Serves stored audio objects over HTTP with correct Range support, so a
 * browser {@code <audio>} element can play and seek without loading whole files.
 *
 * <p>Behavior:</p>
 * <ul>
 *     <li>no {@code Range} header -> {@code 200} full object, streamed incrementally;</li>
 *     <li>single {@code bytes} range -> {@code 206 Partial Content};</li>
 *     <li>unsatisfiable range -> {@code 416} with Content-Range of the form
 *     {@code bytes &#42;/TOTAL}.</li>
 * </ul>
 *
 * <p>Audio objects are immutable (UUID keys, never overwritten), so responses
 * are cacheable. The exact stored bytes are streamed - no transcoding.</p>
 */
@RestController
@RequestMapping("/api/songs/{id}/stream")
public class AudioStreamController {

    private static final String ACCEPT_RANGES_BYTES = "bytes";
    private static final String CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable";

    private final AudioStreamService streamService;

    public AudioStreamController(AudioStreamService streamService) {
        this.streamService = streamService;
    }

    @GetMapping
    public ResponseEntity<InputStreamResource> stream(
            @PathVariable UUID id,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) {
        StreamTarget target = streamService.resolve(id);
        long size = target.objectInfo().size();

        Optional<ByteRange> range = RangeParser.parse(rangeHeader, size);

        if (range.isEmpty()) {
            InputStream in = streamService.open(target.audioFile(), 0, -1);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(target.contentType()))
                    .header(HttpHeaders.ACCEPT_RANGES, ACCEPT_RANGES_BYTES)
                    .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_IMMUTABLE)
                    .contentLength(size)
                    .body(new InputStreamResource(in));
        }

        ByteRange byteRange = range.get();
        InputStream in = streamService.open(target.audioFile(), byteRange.start(), byteRange.length());
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .contentType(MediaType.parseMediaType(target.contentType()))
                .header(HttpHeaders.ACCEPT_RANGES, ACCEPT_RANGES_BYTES)
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_IMMUTABLE)
                .header(HttpHeaders.CONTENT_RANGE, contentRange(byteRange))
                .contentLength(byteRange.length())
                .body(new InputStreamResource(in));
    }

    /**
     * HEAD returns the metadata headers for the full object without a body,
     * which lets clients/probes discover size and type cheaply.
     */
    @RequestMapping(method = RequestMethod.HEAD)
    public ResponseEntity<Void> head(@PathVariable UUID id) {
        StreamTarget target = streamService.resolve(id);
        long size = target.objectInfo().size();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(target.contentType()))
                .header(HttpHeaders.ACCEPT_RANGES, ACCEPT_RANGES_BYTES)
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_IMMUTABLE)
                .contentLength(size)
                .build();
    }

    private String contentRange(ByteRange range) {
        return "bytes " + range.start() + "-" + range.end() + "/" + range.total();
    }
}
