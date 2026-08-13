package com.softyfy.streaming;

import com.softyfy.common.exception.InvalidRangeException;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RangeParserTest {

    @Test
    void absentHeaderMeansNoRange() {
        assertThat(RangeParser.parse(null, 1000)).isEmpty();
        assertThat(RangeParser.parse("", 1000)).isEmpty();
        assertThat(RangeParser.parse("   ", 1000)).isEmpty();
    }

    @Test
    void fullRangeStartToEnd() {
        Optional<ByteRange> range = RangeParser.parse("bytes=0-999", 1000);
        assertThat(range).contains(new ByteRange(0, 999, 1000));
        assertThat(range.get().length()).isEqualTo(1000);
    }

    @Test
    void openEndedRangeThroughEof() {
        Optional<ByteRange> range = RangeParser.parse("bytes=1000-", 2000);
        assertThat(range).contains(new ByteRange(1000, 1999, 2000));
        assertThat(range.get().length()).isEqualTo(1000);
    }

    @Test
    void suffixRangeIsFinalBytes() {
        Optional<ByteRange> range = RangeParser.parse("bytes=-500", 2000);
        assertThat(range).contains(new ByteRange(1500, 1999, 2000));
        assertThat(range.get().length()).isEqualTo(500);
    }

    @Test
    void suffixLargerThanFileReturnsWholeFile() {
        Optional<ByteRange> range = RangeParser.parse("bytes=-5000", 1000);
        assertThat(range).contains(new ByteRange(0, 999, 1000));
        assertThat(range.get().length()).isEqualTo(1000);
    }

    @Test
    void endBeyondFileIsClamped() {
        Optional<ByteRange> range = RangeParser.parse("bytes=500-9999", 1000);
        assertThat(range).contains(new ByteRange(500, 999, 1000));
        assertThat(range.get().length()).isEqualTo(500);
    }

    @Test
    void startBeyondFileIsRejected() {
        assertThatThrownBy(() -> RangeParser.parse("bytes=1000-", 1000))
                .isInstanceOf(InvalidRangeException.class);
    }

    @Test
    void endBeforeStartIsRejected() {
        assertThatThrownBy(() -> RangeParser.parse("bytes=100-50", 1000))
                .isInstanceOf(InvalidRangeException.class);
    }

    @Test
    void unknownUnitIsRejected() {
        assertThatThrownBy(() -> RangeParser.parse("items=0-100", 1000))
                .isInstanceOf(InvalidRangeException.class);
    }

    @Test
    void multipleRangesAreRejected() {
        assertThatThrownBy(() -> RangeParser.parse("bytes=0-1,2-3", 1000))
                .isInstanceOf(InvalidRangeException.class);
    }

    @Test
    void missingEqualsSignIsRejected() {
        assertThatThrownBy(() -> RangeParser.parse("bytes 0-100", 1000))
                .isInstanceOf(InvalidRangeException.class);
    }

    @Test
    void nonNumericValuesAreRejected() {
        assertThatThrownBy(() -> RangeParser.parse("bytes=abc-def", 1000))
                .isInstanceOf(InvalidRangeException.class);
        assertThatThrownBy(() -> RangeParser.parse("bytes=-", 1000))
                .isInstanceOf(InvalidRangeException.class);
        assertThatThrownBy(() -> RangeParser.parse("bytes=", 1000))
                .isInstanceOf(InvalidRangeException.class);
    }

    @Test
    void zeroSuffixIsRejected() {
        assertThatThrownBy(() -> RangeParser.parse("bytes=-0", 1000))
                .isInstanceOf(InvalidRangeException.class);
    }

    @Test
    void emptyObjectRejectsEveryRange() {
        assertThatThrownBy(() -> RangeParser.parse("bytes=0-", 0))
                .isInstanceOf(InvalidRangeException.class);
        assertThat(RangeParser.parse(null, 0)).isEmpty();
    }

    @Test
    void unitIsCaseInsensitive() {
        Optional<ByteRange> range = RangeParser.parse("Bytes=0-99", 1000);
        assertThat(range).contains(new ByteRange(0, 99, 1000));
    }
}
