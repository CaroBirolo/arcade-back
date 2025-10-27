package com.retroArcade.RetroArcade.controller;

import com.retroArcade.RetroArcade.model.Juego;
import com.retroArcade.RetroArcade.repository.JuegoRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/juegos")
@CrossOrigin(origins = "http://localhost:5500") // Cambiar puerto si tu frontend corre en otro
public class JuegoController {

    private final JuegoRepository juegoRepository;

    public JuegoController(JuegoRepository juegoRepository) {
        this.juegoRepository = juegoRepository;
    }

    // Listar todos los juegos
    @GetMapping
    public List<Juego> getAllJuegos() {
        return juegoRepository.findAll();
    }

    // Agregar un juego nuevo
    @PostMapping
    public Juego addJuego(@RequestBody Juego juego) {
        return juegoRepository.save(juego);
    }

    // Obtener 20 juegos aleatorios
    @GetMapping("/random")
    public List<Juego> getRandomJuegos() {
        List<Juego> todos = juegoRepository.findAll();
        java.util.Collections.shuffle(todos);
        return todos.stream().limit(20).toList();
    }

    /* 🚀 OPCIONAL - versión optimizada con SQL directo
    // Para usarla, agregá esto en tu JuegoRepository:
    // @Query(value = "SELECT * FROM juego ORDER BY RAND() LIMIT 20", nativeQuery = true)
    // List<Juego> findRandomJuegos();

    @GetMapping("/random")
    public List<Juego> getRandomJuegos() {
        return juegoRepository.findRandomJuegos();
    }
    */
}
