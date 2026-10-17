package com.mikkytrionze.nkst.member.application.service;

import com.mikkytrionze.nkst.member.domain.model.BaptismRecord;
import com.mikkytrionze.nkst.member.domain.repository.BaptismRecordRepository;
import com.mikkytrionze.nkst.member.domain.service.BaptismRecordService;
import com.mikkytrionze.nkst.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class BaptismRecordServiceImpl implements BaptismRecordService {

    private final BaptismRecordRepository baptismRecordRepository;

    @Override
    public void delete(Long id) {
        log.info("Deleting Baptism Record with id: {}", id);

        BaptismRecord baptismRecord = findById(id);

        baptismRecord.setDeleted(true);

        baptismRecordRepository.save(baptismRecord);
    }

    @Override
    public BaptismRecord getById(Long id) {
        log.info("Getting Baptism Record by Id: {}", id);

        return findById(id);
    }

    @Override
    public BaptismRecord save(BaptismRecord baptismRecord) {
        BaptismRecord savedBaptismRecord = baptismRecordRepository.save(baptismRecord);

        log.info("Saved a Baptism Record with id: {}", savedBaptismRecord.getId());

        return savedBaptismRecord;
    }

    @Override
    public BaptismRecord update(Long id, BaptismRecord baptismRecord) {
        BaptismRecord savedRecord = findById(id);

        savedRecord.setRemark(baptismRecord.getRemark());
        savedRecord.setDateOfBaptism(baptismRecord.getDateOfBaptism());
        savedRecord.setBibleVerse(baptismRecord.getBibleVerse());
        savedRecord.setBaptizedBy(baptismRecord.getBaptizedBy());
        savedRecord.setImageUri(baptismRecord.getImageUri());
        savedRecord.setSerialNumber(baptismRecord.getSerialNumber());
        savedRecord.setWorshipCenter(baptismRecord.getWorshipCenter());

        baptismRecordRepository.save(savedRecord);
        log.info("Updated a Baptism Record with id: {}", id);
        return savedRecord;
    }

    private BaptismRecord findById(Long id) throws IllegalArgumentException, ResourceNotFoundException {
        if (id == null) {
            throw new IllegalArgumentException("Id is required!");
        }

        return baptismRecordRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Baptism", id));
    }
}
