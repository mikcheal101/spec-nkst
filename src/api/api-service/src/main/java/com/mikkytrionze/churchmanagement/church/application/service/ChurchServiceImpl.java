package com.mikkytrionze.churchmanagement.church.application.service;

import com.mikkytrionze.churchmanagement.church.application.mapper.ChurchMapper;
import com.mikkytrionze.churchmanagement.church.api.request.ChurchRequest;
import com.mikkytrionze.churchmanagement.shared.exception.ResourceNotFoundException;
import com.mikkytrionze.churchmanagement.church.api.response.ChurchResponse;
import com.mikkytrionze.churchmanagement.church.domain.model.Church;
import com.mikkytrionze.churchmanagement.church.domain.repository.ChurchRepository;
import com.mikkytrionze.churchmanagement.church.domain.service.ChurchService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ChurchServiceImpl implements ChurchService {

    private final ChurchRepository churchRepository;
    private final com.mikkytrionze.churchmanagement.shared.security.SecurityUtils securityUtils;

    @Override
    @CacheEvict(value = "churches", beforeInvocation = true, allEntries = true)
    public void deleteChurch(Long id) throws ResourceNotFoundException {
        log.info("Deleting church with id: {}", id);

        Church church = getChurchById(id);

        church.setDeleted(true);

        churchRepository.save(church);
    }

    @Override
    @Cacheable(value = "churches", key = "#id")
    public ChurchResponse getChurch(Long id) {
        log.info("Get Church with id: {}", id);
        securityUtils.assertChurchScope(id);
        Church church = getChurchById(id);
        return ChurchMapper.toResponse(church);
    }

    @Override
    public ChurchResponse createChurch(ChurchRequest churchRequest) {
        log.info("Creating a church entity with name: {}", churchRequest.getName());

        Church parentChurch = churchRequest.getParentChurchId() == null ? null : churchRepository.findById(churchRequest.getParentChurchId()).orElse(null);

        if (parentChurch != null && !"ACTIVE".equalsIgnoreCase(parentChurch.getStatus())) {
            throw new IllegalArgumentException("Parent church must be active");
        }
        Church church = Church.builder()
                .name(churchRequest.getName().toUpperCase())
                .address(churchRequest.getAddress())
                .emailAddress(churchRequest.getEmailAddress())
                .telNumber(churchRequest.getTelNumber())
                .status(churchRequest.getStatus() == null ? "ACTIVE" : churchRequest.getStatus().toUpperCase())
                .churchType(parentChurch == null ? "PARENT" : "SUB_CHURCH")
                .parentChurch(parentChurch)
                .build();
        Church savedChurch = churchRepository.save(church);
        return ChurchMapper.toResponse(savedChurch);
    }

    @Override
    @Transactional
    @CachePut(value = "churches", key = "#id")
    public ChurchResponse updateChurch(Long id, ChurchRequest churchRequest) throws DataIntegrityViolationException {
        log.info("Updating a church with id: {}", id);

        Church existingChurch = getChurchById(id);

        boolean nameExists = existingChurch.getName().equalsIgnoreCase(churchRequest.getName());
        boolean nameExistsInDb = churchRepository.existsByName(churchRequest.getName());

        if(!nameExists && nameExistsInDb) {
            throw new DataIntegrityViolationException(
                    String.format("A church with the name: '%s' already exists", churchRequest.getName()));
        }

        // get the new parent church
        Long existingParentId = existingChurch.getParentChurch() != null ? existingChurch.getParentChurch().getId() : null;
        boolean requestingParentChurchChange = !Objects.equals(churchRequest.getParentChurchId(), existingParentId);
        if (churchRequest.getParentChurchId() != null && requestingParentChurchChange) {
            Church parentChurch = churchRepository.findById(churchRequest.getParentChurchId()).orElse(null);
            existingChurch.setParentChurch(parentChurch);
        }

        existingChurch.setName(churchRequest.getName().toUpperCase());
        existingChurch.setAddress(churchRequest.getAddress());
        existingChurch.setEmailAddress(churchRequest.getEmailAddress());
        existingChurch.setTelNumber(churchRequest.getTelNumber());
        if (churchRequest.getStatus() != null) {
            String next = churchRequest.getStatus().toUpperCase();
            String current = existingChurch.getStatus() == null ? "ACTIVE" : existingChurch.getStatus().toUpperCase();
            if (!isAllowedTransition(current, next)) throw new IllegalArgumentException("Invalid church status transition: " + current + " -> " + next);
            existingChurch.setStatus(next);
            if (!"ACTIVE".equals(next)) {
                existingChurch.getSubChurches().forEach(sc -> { if (isAllowedTransition(sc.getStatus()==null?"ACTIVE":sc.getStatus().toUpperCase(), next)) sc.setStatus(next); });
            }
        }
        existingChurch.setChurchType(existingChurch.getParentChurch() == null ? "PARENT" : "SUB_CHURCH");

        Church updatedChurch = churchRepository.save(existingChurch);
        return ChurchMapper.toResponse(updatedChurch);
    }

    @Override
    public Page<ChurchResponse> getChurches(Pageable pageable) {
        log.info("Fetching all the churches with pagination: {}", pageable);
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean superAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()) || "SUPER_ADMIN".equals(a.getAuthority()));
        Page<Church> churchPage = churchRepository.findAll(pageable);
        if (superAdmin) return churchPage.map(ChurchMapper::toResponse);
        // filter to explicitly scoped churches only
        var scoped = churchPage.getContent().stream().filter(c -> securityUtils.hasChurchScope(c.getId())).toList();
        return new org.springframework.data.domain.PageImpl<>(scoped.stream().map(ChurchMapper::toResponse).toList(), pageable, scoped.size());
    }

    private boolean isAllowedTransition(String current, String next) {
        if (current.equals(next)) return true;
        return switch (current) {
            case "ACTIVE" -> java.util.Set.of("SUSPENDED","INACTIVE","ARCHIVED").contains(next);
            case "SUSPENDED" -> java.util.Set.of("ACTIVE","INACTIVE","ARCHIVED").contains(next);
            case "INACTIVE" -> java.util.Set.of("ACTIVE","ARCHIVED").contains(next);
            case "ARCHIVED" -> false;
            default -> false;
        };
    }

    @Override
    public Page<ChurchResponse> getSubChurches(Long id, Pageable pageable) {
        log.info("Fetching all the sub churches for church with id: {},  with pagination: {}", id, pageable);
        securityUtils.assertChurchScope(id);
        Page<Church> churchPage = churchRepository.findByParentChurchId(id, pageable);
        return churchPage.map(ChurchMapper::toResponse);
    }

    @Override
    public Church findChurchById(Long id) {
        return churchRepository.findById(id).orElse(null);
    }

    private Church getChurchById(Long id) throws IllegalArgumentException {
        if (id == null) {
            throw new IllegalArgumentException("Church Id is required!");
        }

        return churchRepository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException(Church.class.getName(), id));
    }
}
