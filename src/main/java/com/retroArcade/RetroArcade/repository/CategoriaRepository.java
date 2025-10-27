package com.retroArcade.RetroArcade.repository;

import com.retroArcade.RetroArcade.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
      Optional<Categoria> findByNombre(String nombre);
}