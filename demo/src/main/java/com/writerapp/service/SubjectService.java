package com.writerapp.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.writerapp.dto.SubjectCreateRequest;
import com.writerapp.dto.SubjectResponse;
import com.writerapp.model.Subject;
import com.writerapp.repository.SubjectRepository;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class SubjectService {

    private final SubjectRepository subjectRepository;

    @Transactional(readOnly = true)
    public List<SubjectResponse> getSubjects() {
        return subjectRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::map)
                .toList();
    }

    @Transactional
    public SubjectResponse createSubject(SubjectCreateRequest request) {
        String name = request.getName().trim();

        subjectRepository.findByNameIgnoreCase(name)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(BAD_REQUEST, "Subject already exists");
                });

        Subject saved = subjectRepository.save(Subject.builder().name(name).build());
        return map(saved);
    }

    private SubjectResponse map(Subject subject) {
        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .build();
    }
}
