package com.mikkytrionze.nkst.shared.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class ConstantsTest {

    @Test
    void shouldHaveValidInitPage() {
        assertEquals(0, Constants.INIT_PAGE);
    }

    @Test
    void shouldHaveValidPageSize() {
        assertEquals(20, Constants.PAGE_SIZE);
    }
}
