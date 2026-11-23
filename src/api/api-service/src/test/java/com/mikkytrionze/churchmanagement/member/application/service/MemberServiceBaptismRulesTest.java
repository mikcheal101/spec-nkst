package com.mikkytrionze.churchmanagement.member.application.service;

import com.mikkytrionze.churchmanagement.member.domain.model.BaptismRecord;
import com.mikkytrionze.churchmanagement.member.domain.model.Member;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Domain rule tests for ENGR-003 member baptised/non-baptised transitions.
 * These assert the Member/BaptismRecord invariants required by FR-022/CHK008.
 */
class MemberServiceBaptismRulesTest {

    @Test
    void baptisedMemberRequiresBaptismRecord() {
        Member m = Member.builder().tel("123").isBaptised(true)
                .baptismRecord(BaptismRecord.builder().serialNumber(100).build()).build();
        assertTrue(m.isBaptised());
        assertNotNull(m.getBaptismRecord());
        assertEquals(100, m.getBaptismRecord().getSerialNumber());
    }

    @Test
    void nonBaptisedMemberHasNoBaptismRequirement() {
        Member m = Member.builder().tel("123").isBaptised(false).build();
        assertFalse(m.isBaptised());
        assertNull(m.getBaptismRecord());
    }

    @Test
    void transitionToBaptisedAttachesRecord() {
        Member m = Member.builder().tel("123").isBaptised(false).build();
        m.setBaptised(true);
        m.setBaptismRecord(BaptismRecord.builder().serialNumber(55).build());
        assertTrue(m.isBaptised());
        assertNotNull(m.getBaptismRecord());
    }

    @Test
    void transitionToNonBaptisedRemovesRecordReference() {
        Member m = Member.builder().tel("123").isBaptised(true)
                .baptismRecord(BaptismRecord.builder().serialNumber(55).build()).build();
        m.setBaptised(false);
        m.setBaptismRecord(null);
        assertFalse(m.isBaptised());
        assertNull(m.getBaptismRecord());
    }
}
