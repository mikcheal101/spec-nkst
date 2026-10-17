package com.mikkytrionze.nkst.church.domain.model;

import static org.junit.jupiter.api.Assertions.*;

import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.pastor.domain.model.Pastor;
import com.mikkytrionze.nkst.pastor.domain.model.PastorRole;

import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ChurchTest {

    @Test
    void shouldCreateChurchUsingBuilder() {
        Church church = Church.builder()
                .name("Main Church")
                .address("123 Main St")
                .build();

        assertNull(church.getId());
        assertEquals("Main Church", church.getName());
        assertEquals("123 Main St", church.getAddress());
        assertNull(church.getParentChurch());
        assertTrue(church.getSubChurches().isEmpty());
        assertTrue(church.getPastors().isEmpty());
        assertFalse(church.isDeleted());
    }

    @Test
    void shouldAddAndRemovePastor() {
        Church church = Church.builder()
                .name("Main Church")
                .build();

        PastorRole pastorRole = PastorRole.builder().name("Lead Pastor").build();

        Pastor pastor = Pastor.builder()
                .member(Member.builder()
                        .firstName("John")
                        .lastName("Doe")
                        .tel("1234567890")
                        .build())
                .pastorRole(pastorRole)
                .build();

        church.addPastor(pastor);
        assertEquals(1, church.getPastors().size());
        assertEquals(church, pastor.getChurch());

        church.removePastor(pastor);
        assertTrue(church.getPastors().isEmpty());
        assertNull(pastor.getChurch());
    }

    @Test
    void shouldAddAndRemoveSubChurch() {
        Church parent = Church.builder()
                .name("Parent Church")
                .build();

        Church child = Church.builder()
                .name("Child Church")
                .build();

        parent.addSubChurch(child);
        assertEquals(1, parent.getSubChurches().size());
        assertEquals(parent, child.getParentChurch());

        parent.removeSubChurch(child);
        assertTrue(parent.getSubChurches().isEmpty());
        assertNull(child.getParentChurch());
    }

    @Test
    void shouldMaintainBidirectionalRelationship() {
        Church church = Church.builder()
                .name("Main Church")
                .build();

        Pastor pastor1 = Pastor.builder()
                .member(Member.builder()
                        .firstName("John")
                        .lastName("Doe")
                        .tel("111")
                        .build())
                .build();

        Pastor pastor2 = Pastor.builder()
                .member(Member.builder()
                        .firstName("Jane")
                        .lastName("Doe")
                        .tel("222")
                        .build())
                .build();

        church.addPastor(pastor1);
        church.addPastor(pastor2);

        assertEquals(2, church.getPastors().size());
        assertTrue(church.getPastors().containsAll(List.of(pastor1, pastor2)));
    }

    @Test
    void shouldSetDeletedFlag() {
        Church church = Church.builder()
                .name("Main Church")
                .build();

        assertFalse(church.isDeleted());
        church.setDeleted(true);
        assertTrue(church.isDeleted());
    }
}
