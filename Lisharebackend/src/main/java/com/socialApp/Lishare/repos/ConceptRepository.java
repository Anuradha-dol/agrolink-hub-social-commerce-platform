package com.socialApp.Lishare.repos;

import com.socialApp.Lishare.entities.Concept;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConceptRepository extends JpaRepository<Concept, Long> {
    Optional<Concept> findByTopicIgnoreCase(String topic);
}