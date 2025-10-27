package com.retroArcade.RetroArcade.controller;


/*
borrar de la base los que tienen nombre exacto repetido
los de gba y gameboyadvance deberian ser el mismo cuando se toco el script se rompio eso
esta guardando mal esto https://www.retrogames.cc/gameboyadvance-games/jurassic-park-iii-park-builder-u-q.html
https://www.retrogames.cc//www.retrogames.cc/embed/28867-jurassic-park-iii-park-builder-u-q.html
*
* */

import com.retroArcade.RetroArcade.model.Categoria;
import com.retroArcade.RetroArcade.model.Juego;
import com.retroArcade.RetroArcade.repository.CategoriaRepository;
import com.retroArcade.RetroArcade.repository.JuegoRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/scrapping")
public class ScrappingController {

    @Autowired
    private CategoriaRepository categoriaRepository;

    @Autowired
    private JuegoRepository juegoRepository;

    private static final String BASE_URL = "https://www.retrogames.cc/";

    @GetMapping
    public String scrap(
            @RequestParam(defaultValue = "0") int categoriaIndex,
            @RequestParam(defaultValue = "2") int paginaStart,
            @RequestParam(defaultValue = "999") int limiteCategorias
    ) throws IOException, InterruptedException {

        System.out.println("🔍 Iniciando scrapping (categoriaIndex=" + categoriaIndex +
                ", paginaStart=" + paginaStart + ", limiteCategorias=" + limiteCategorias + ")");

        // 1) Cargar home y obtener enlaces de menú
        Document home = Jsoup.connect(BASE_URL)
                .userAgent("Mozilla/5.0")
                .timeout(15000)
                .get();

        Elements enlaces = home.select("ul.menu a[href]");
        List<String> urlsCategorias = new ArrayList<>();
        List<String> nombresCategorias = new ArrayList<>();

        for (Element link : enlaces) {
            String href = link.attr("href").trim();
            String text = link.text().trim();
            if ((href.startsWith("http") && href.contains("-games")) ||
                    (href.startsWith("/") && href.contains("-games"))) {

                String full = href.startsWith("http") ? href : BASE_URL.replaceAll("/$", "") + href;
                if (!urlsCategorias.contains(full)) {
                    urlsCategorias.add(full);
                    nombresCategorias.add(text);
                }
            }
        }

        System.out.println("✅ Categorías detectadas en menú: " + urlsCategorias.size());

        if (categoriaIndex >= urlsCategorias.size()) {
            String msg = "Índice de categoría fuera de rango. Total disponibles: " + urlsCategorias.size();
            System.out.println("⚠️  " + msg);
            return msg;
        }

        int totalJuegosGuardados = 0;
        int categoriasProcesadas = 0;

        boolean primeraCategoria = true;

        // 2) Recorrer solo desde categoriaIndex y hasta limiteCategorias
        for (int idx = categoriaIndex; idx < urlsCategorias.size() && categoriasProcesadas < limiteCategorias; idx++) {
            String categoriaUrl = urlsCategorias.get(idx);
            String nombreCategoria = nombresCategorias.get(idx);
            categoriasProcesadas++;

            System.out.println("\n🗂️  Procesando categoría [" + idx + "]: " + nombreCategoria + " -> " + categoriaUrl);

            int finalIdx = idx;
            Categoria categoria = categoriaRepository.findByNombre(nombreCategoria)
                    .orElseGet(() -> {
                        System.out.println("➕ Creando categoría en DB: " + nombreCategoria);
                        Categoria c = new Categoria();
                        c.setNombre(nombreCategoria);
                        c.setOrden(finalIdx);
                        c.setPadreId(null);
                        return categoriaRepository.save(c);
                    });

            Set<String> paginas = obtenerPaginasCategoria(categoriaUrl);
            List<String> listaPaginas = new ArrayList<>(paginas);
            System.out.println("📄 Páginas encontradas: " + listaPaginas.size());

            int juegosEnCategoria = 0;

            for (int pIndex = 0; pIndex < listaPaginas.size(); pIndex++) {
                String paginaUrl = listaPaginas.get(pIndex);

                // Saltar page/1.html para todas excepto primera categoría con paginaStart=1
                if (!primeraCategoria && paginaUrl.contains("/page/1.html")) continue;

                if (primeraCategoria && paginaStart > 1) {
                    String buscada = categoriaUrl.replaceAll("/$", "") + "/page/" + paginaStart + ".html";
                    while (pIndex < listaPaginas.size() && !listaPaginas.get(pIndex).equalsIgnoreCase(buscada)) {
                        pIndex++;
                    }
                    if (pIndex >= listaPaginas.size()) break;
                    paginaUrl = listaPaginas.get(pIndex);
                    primeraCategoria = false;
                } else {
                    primeraCategoria = false;
                }

                System.out.println("➡️ Analizando página: " + paginaUrl);

                Document paginaDoc;
                try {
                    paginaDoc = Jsoup.connect(paginaUrl)
                            .userAgent("Mozilla/5.0")
                            .timeout(15000)
                            .get();
                } catch (IOException e) {
                    System.out.println("⚠️  Error al conectar con la página: " + paginaUrl + " -> " + e.getMessage());
                    break;
                }

                Elements items = paginaDoc.select("div.item.large-6.small-12.columns.list");
                System.out.println("   🎮 Items encontrados en la página: " + items.size());

                if (items.isEmpty()) break;

                for (Element item : items) {
                    Element linkJuego = item.selectFirst("h6 a");
                    Element img = item.selectFirst("img");
                    if (linkJuego == null) continue;

                    String titulo = linkJuego.text().trim();
                    String urlJuego = linkJuego.attr("href").trim();
                    if (!urlJuego.startsWith("http")) {
                        urlJuego = BASE_URL.replaceAll("/$", "") + (urlJuego.startsWith("/") ? "" : "/") + urlJuego;
                    }
                    String imagen = img != null ? img.attr("data-src").trim() : "";

                    String iframeUrl = obtenerIframe(urlJuego);

                    Juego nuevo = new Juego();
                    nuevo.setNombre(titulo);
                    nuevo.setPlataforma(nombreCategoria);
                    nuevo.setAnio(0);
                    nuevo.setImagen(imagen);
                    nuevo.setUrl(urlJuego);
                    nuevo.setIframe(iframeUrl);
                    nuevo.setCategoria(categoria);

                    juegoRepository.save(nuevo);
                    juegosEnCategoria++;
                    totalJuegosGuardados++;

                    System.out.println("     ✅ Guardado (" + juegosEnCategoria + "): " + titulo + " -> iframe: " + iframeUrl);
                    Thread.sleep(120);
                }
                Thread.sleep(300);
            }
            System.out.println("🏁 Finalizada categoría " + nombreCategoria + " → " + juegosEnCategoria + " juegos agregados.");
        }

        System.out.println("\n🎉 Scrapping finalizado. Total juegos guardados: " + totalJuegosGuardados);
        return "Scraping finalizado. Total juegos guardados: " + totalJuegosGuardados;
    }

    private Set<String> obtenerPaginasCategoria(String categoriaUrl) throws IOException {
        Set<String> paginas = new LinkedHashSet<>();
        paginas.add(categoriaUrl);

        Document doc = Jsoup.connect(categoriaUrl)
                .userAgent("Mozilla/5.0")
                .timeout(15000)
                .get();

        Elements pagLinks = doc.select("ul.pagination a[href]");
        for (Element p : pagLinks) {
            String href = p.attr("href").trim();
            if (!href.startsWith("http")) {
                href = BASE_URL.replaceAll("/$", "") + (href.startsWith("/") ? "" : "/") + href;
            }
            if (href.contains("/page/1.html")) continue;
            paginas.add(href);
        }
        return paginas;
    }

    private String obtenerIframe(String urlJuego) {
        try {
            Document juegoDoc = Jsoup.connect(urlJuego)
                    .userAgent("Mozilla/5.0")
                    .timeout(15000)
                    .get();

            Element iframe = juegoDoc.selectFirst("iframe[src]");
            if (iframe != null) {
                String src = iframe.attr("src").trim();
                if (!src.startsWith("http")) {
                    src = BASE_URL.replaceAll("/$", "") + (src.startsWith("/") ? "" : "/") + src;
                }
                return src;
            } else {
                return "";
            }
        } catch (IOException e) {
            System.out.println("⚠️  Error al obtener iframe de " + urlJuego + " -> " + e.getMessage());
            return "";
        }
    }
}
