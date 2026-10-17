package com.mikkytrionze.nkst.pastor.domain.model;

import static org.junit.jupiter.api.Assertions.*;

import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.member.domain.model.Member;
import org.junit.jupiter.api.Test;

class PastorTest {

    @Test
    void shouldCreatePastorUsingBuilder() {
        PastorRole pastorRole = PastorRole.builder().name("Associate Pastor").build();

        Pastor pastor = Pastor.builder()
                .member(Member.builder()
                        .tel("1234567890")
                        .lastName("Doe")
                        .firstName("John")
                        .middleName("M")
                        .emailAddress("john@test.com")
                        .build())
                .pastorRole(pastorRole)
                .build();

        assertNull(pastor.getId());
        assertEquals("1234567890", pastor.getMember().getTel());
        assertEquals("Doe", pastor.getMember().getLastName());
        assertEquals("John", pastor.getMember().getFirstName());
        assertEquals("M", pastor.getMember().getMiddleName());
        assertEquals("john@test.com", pastor.getMember().getEmailAddress());
        assertEquals(pastorRole, pastor.getPastorRole());
        assertNull(pastor.getChurch());
        assertFalse(pastor.isDeleted());
    }

    @Test
    void shouldSetAndGetChurch() {
        Church church = Church.builder()
                .name("Main Church")
                .build();

        Pastor pastor = Pastor.builder()
                .member(Member.builder()
                        .tel("1234567890")
                        .lastName("Doe")
                        .firstName("John")
                        .build())
                .build();

        pastor.setChurch(church);
        assertEquals(church, pastor.getChurch());
    }

    @Test
    void shouldSetDeletedFlag() {
        Pastor pastor = Pastor.builder()
                .member(Member.builder()
                        .tel("1234567890")
                        .lastName("Doe")
                        .firstName("John")
                        .build())
                .build();

        assertFalse(pastor.isDeleted());
        pastor.setDeleted(true);
        assertTrue(pastor.isDeleted());
    }
}
