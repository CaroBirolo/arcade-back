package com.retroArcade.RetroArcade;

import com.retroArcade.RetroArcade.model.Categoria;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.retroArcade.RetroArcade.repository.CategoriaRepository;

@SpringBootApplication
public class RetroArcadeApplication {

	public static void main(String[] args) {
		SpringApplication.run(RetroArcadeApplication.class, args);
	}

	/*
	@Bean
	CommandLineRunner initCategorias(CategoriaRepository repo) {
		return args -> {
			// Solo carga si está vacío
			if (repo.count() == 0) {

				// Principales
				Categoria arcade = repo.save(new Categoria(null, "Arcade", null, 1));
				Categoria atari = repo.save(new Categoria(null, "Atari", null, 2));
				Categoria flash = repo.save(new Categoria(null, "Flash", null, 3));
				Categoria nintendo = repo.save(new Categoria(null, "Nintendo", null, 4));
				Categoria playstation = repo.save(new Categoria(null, "PlayStation", null, 5));
				Categoria sega = repo.save(new Categoria(null, "Sega", null, 6));

				// Subcategorías de Atari
				repo.save(new Categoria(null, "Atari 7800", atari.getId(), 1));
				repo.save(new Categoria(null, "Atari Lynx", atari.getId(), 2));
				repo.save(new Categoria(null, "Atari Jaguar", atari.getId(), 3));

				// Subcategorías de Nintendo
				repo.save(new Categoria(null, "NES", nintendo.getId(), 1));
				repo.save(new Categoria(null, "SNES", nintendo.getId(), 2));
				repo.save(new Categoria(null, "FDS", nintendo.getId(), 3));
				repo.save(new Categoria(null, "GB", nintendo.getId(), 4));
				repo.save(new Categoria(null, "GBC", nintendo.getId(), 5));
				repo.save(new Categoria(null, "GBA", nintendo.getId(), 6));
				repo.save(new Categoria(null, "N64", nintendo.getId(), 7));
				repo.save(new Categoria(null, "NDS", nintendo.getId(), 8));

				// Subcategorías de Sega
				repo.save(new Categoria(null, "Master System", sega.getId(), 1));
				repo.save(new Categoria(null, "Game Gear", sega.getId(), 2));
				repo.save(new Categoria(null, "Genesis", sega.getId(), 3));
				repo.save(new Categoria(null, "Sega CD", sega.getId(), 4));
				repo.save(new Categoria(null, "32X", sega.getId(), 5));

				System.out.println("✅ Categorías iniciales cargadas correctamente.");
			} else {
				System.out.println("ℹ️ Ya existen categorías en la base de datos, no se cargaron duplicadas.");
			}
		};
	}*/
}
