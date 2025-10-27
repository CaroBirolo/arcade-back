package com.retroArcade.RetroArcade.repository;

import com.retroArcade.RetroArcade.model.Juego;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JuegoRepository extends JpaRepository<Juego, Long> {}