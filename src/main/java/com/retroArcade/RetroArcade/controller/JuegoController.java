package com.retroArcade.RetroArcade.controller;

import com.retroArcade.RetroArcade.model.Juego;
import com.retroArcade.RetroArcade.repository.JuegoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/juegos")
@CrossOrigin(origins = "http://localhost:5500") // Cambiá el puerto según tu frontend
public class JuegoController {

    private final JuegoRepository juegoRepository;

    public JuegoController(JuegoRepository juegoRepository) {
        this.juegoRepository = juegoRepository;
    }

    // 🔹 Obtener un juego por su ID
    @GetMapping("/{id}")
    public ResponseEntity<Juego> getJuegoById(@PathVariable Long id) {
        return juegoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Listar todos los juegos paginados (general)
    @GetMapping
    public ResponseEntity<Page<Juego>> getAllJuegos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "40") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Juego> juegos = juegoRepository.findAll(pageable);
        return ResponseEntity.ok(juegos);
    }

    // 🔹 Listar juegos por categoría ID (paginado)
    @GetMapping("/categoria/{categoriaId}")
    public ResponseEntity<Page<Juego>> getJuegosByCategoriaId(
            @PathVariable Long categoriaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "40") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Juego> juegos = juegoRepository.findByCategoriaId(categoriaId, pageable);
        return ResponseEntity.ok(juegos);
    }

    // 🔹 Listar juegos por nombre de categoría (paginado)
    @GetMapping("/categoria/nombre/{nombre}")
    public ResponseEntity<Page<Juego>> getJuegosByCategoriaNombre(
            @PathVariable String nombre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "40") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Juego> juegos = juegoRepository.findByCategoriaNombreIgnoreCase(nombre, pageable);
        return ResponseEntity.ok(juegos);
    }

    // 🔹 Agregar un nuevo juego
    @PostMapping
    public Juego addJuego(@RequestBody Juego juego) {
        return juegoRepository.save(juego);
    }

    // 🔹 Obtener 20 juegos aleatorios
    @GetMapping("/random")
    public List<Juego> getRandomJuegos() {
        List<Juego> todos = juegoRepository.findAll();
        Collections.shuffle(todos);
        return todos.stream().limit(20).toList();
    }

    @GetMapping("/buscar")
    public Page<Juego> buscarJuegos(
            @RequestParam String nombre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "40") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return juegoRepository.findByNombreContainingIgnoreCase(nombre, pageable);
    }

}
