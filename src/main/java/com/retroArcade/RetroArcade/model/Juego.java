package com.retroArcade.RetroArcade.model;

import jakarta.persistence.*;

@Entity
@Table(name = "juegos")
public class Juego {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String plataforma;
    private int anio;

    @Column(length = 500)
    private String imagen;

    @Column(length = 500)
    private String url;

    @Column(length = 500)
    private String iframe;

    @ManyToOne
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    public Juego() {}

    public Juego(String nombre, String plataforma, int anio, String imagen, String url, String iframe, Categoria categoria) {
        this.nombre = nombre;
        this.plataforma = plataforma;
        this.anio = anio;
        this.imagen = imagen;
        this.url = url;
        this.iframe = iframe;
        this.categoria = categoria;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getPlataforma() { return plataforma; }
    public void setPlataforma(String plataforma) { this.plataforma = plataforma; }
    public int getAnio() { return anio; }
    public void setAnio(int anio) { this.anio = anio; }
    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getIframe() { return iframe; }
    public void setIframe(String iframe) { this.iframe = iframe; }
    public Categoria getCategoria() { return categoria; }
    public void setCategoria(Categoria categoria) { this.categoria = categoria; }
}
