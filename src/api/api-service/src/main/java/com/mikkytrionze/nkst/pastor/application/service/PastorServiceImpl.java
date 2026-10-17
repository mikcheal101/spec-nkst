package com.mikkytrionze.nkst.pastor.application.service;

import com.mikkytrionze.nkst.member.domain.model.Member;
import com.mikkytrionze.nkst.member.domain.service.MemberService;
import com.mikkytrionze.nkst.pastor.api.response.PastorResponse;
import com.mikkytrionze.nkst.pastor.application.mapper.PastorMapper;
import com.mikkytrionze.nkst.pastor.api.request.PastorRequest;
import com.mikkytrionze.nkst.church.domain.model.Church;
import com.mikkytrionze.nkst.pastor.domain.model.Pastor;
import com.mikkytrionze.nkst.pastor.domain.model.PastorRole;
import com.mikkytrionze.nkst.pastor.domain.repository.PastorRepository;
import com.mikkytrionze.nkst.church.domain.service.ChurchService;
import com.mikkytrionze.nkst.pastor.domain.service.PastorRoleService;
import com.mikkytrionze.nkst.pastor.domain.service.PastorService;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PastorServiceImpl implements PastorService {

    private final PastorRepository pastorRepository;
    private final ChurchService churchService;
    private final PastorRoleService pastorRoleService;
    private final MemberService memberService;

    @Override
    public Page<PastorResponse> getPastors(Pageable pageable) {
        log.info("Loading pastors with pageable: {}", pageable);

        Page<Pastor> pastorsPage = pastorRepository.findAll(pageable);

        return pastorsPage.map(PastorMapper::toResponse);
    }

    @Override
    @Cacheable(value = "pastors", key = "#id")
    public PastorResponse getPastorById(Long id) throws IllegalArgumentException {
        log.info("Getting pastor by id: {}", id);

        Pastor pastor = findPastorById(id);

        return PastorMapper.toResponse(pastor);
    }

    @Override
    @Transactional
    public PastorResponse createPastor(PastorRequest pastorRequest) {
        log.info("Creating a pastor with member id: {} for church {} with roleId: {}",
                pastorRequest.getMemberId(),
                pastorRequest.getChurchId(),
                pastorRequest.getPastorRoleId());

        // get the church
        Church church = churchService.findChurchById(pastorRequest.getChurchId());

        // Get the pastor's role
        PastorRole pastorRole = pastorRoleService.findPastorRole(pastorRequest.getPastorRoleId());

        // Get member
        Member member = memberService.findMemberById(pastorRequest.getMemberId());

        Pastor pastor = Pastor.builder()
                .member(member)
                .pastorRole(pastorRole)
                .church(church)
                .build();

        return PastorMapper.toResponse(pastorRepository.save(pastor));
    }

    @Override
    @Transactional
    @CachePut(value = "pastors", key = "#id")
    public PastorResponse updatePastor(Long id, PastorRequest pastorRequest) throws IllegalArgumentException {
        log.info("Updating a pastor entity with id: {}", id);

        // fetch the pastor
        Pastor pastor = findPastorById(id);

        // update the role
        PastorRole pastorRole = pastorRoleService.findPastorRole(pastorRequest.getPastorRoleId());
        pastor.setPastorRole(pastorRole);

        // update the church
        Church church = churchService.findChurchById(pastorRequest.getChurchId());
        pastor.setChurch(church);

        pastorRepository.save(pastor);
        return PastorMapper.toResponse(pastor);
    }

    @Override
    @CacheEvict(value = "pastors", allEntries = true, beforeInvocation = true)
    public void deletePastorById(Long id) throws IllegalArgumentException {
        log.info("Deleting a pastor entity with id: {}", id);

        Pastor pastor = findPastorById(id);

        pastor.setDeleted(true);

        pastorRepository.save(pastor);
    }

    private Pastor findPastorById(Long id) throws IllegalArgumentException, ResourceNotFoundException {
        if (id == null) {
            throw new IllegalArgumentException("Id is required!");
        }

        return pastorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pastor", id));
    }
}
