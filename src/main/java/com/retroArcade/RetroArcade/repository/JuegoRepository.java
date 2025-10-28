package com.retroArcade.RetroArcade.repository;

import com.retroArcade.RetroArcade.model.Juego;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JuegoRepository extends JpaRepository<Juego, Long> {
    Page<Juego> findByCategoriaNombreIgnoreCase(String nombre, Pageable pageable);
    Page<Juego> findByCategoriaId(Long categoriaId, Pageable pageable);

    Page<Juego> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);
}