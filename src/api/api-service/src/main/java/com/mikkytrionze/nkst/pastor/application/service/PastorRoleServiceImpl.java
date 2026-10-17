package com.mikkytrionze.nkst.pastor.application.service;

import com.mikkytrionze.nkst.pastor.api.response.PastorRoleResponse;
import com.mikkytrionze.nkst.pastor.application.mapper.PastorRoleMapper;
import com.mikkytrionze.nkst.pastor.domain.model.PastorRole;
import com.mikkytrionze.nkst.pastor.domain.repository.PastorRoleRepository;
import com.mikkytrionze.nkst.pastor.domain.service.PastorRoleService;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PastorRoleServiceImpl implements PastorRoleService {

    private final PastorRoleRepository pastorRoleRepository;

    @Override
    public Page<PastorRoleResponse> getPastorRoles(Pageable pageable) {
        log.info("Loading pastor roles");

        Page<PastorRole> pastorRoles = this.pastorRoleRepository.findAll(pageable);

        return pastorRoles.map(PastorRoleMapper::toResponse);
    }

    @Override
    public PastorRoleResponse getPastorRole(Long id) {
        log.info("Getting pastor role response by id: {}", id);

        PastorRole pastorRole = findPastorRoleById(id);

        return PastorRoleMapper.toResponse(pastorRole);
    }

    @Override
    public PastorRole findPastorRole(Long id) {
        log.info("Getting pastor role by id: {}", id);

        return this.findPastorRoleById(id);
    }


    private PastorRole findPastorRoleById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("id is required!");
        }

        return pastorRoleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(PastorRole.class.getName(), id));
    }
}
