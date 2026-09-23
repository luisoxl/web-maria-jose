/**
 * build-articles.js
 * -----------------------------------------------------------------
 * Se ejecuta automáticamente en cada publicación de Netlify.
 * Lee todos los artículos en /content/articulos/*.md (los que crea
 * el panel "Acceso Socios") y genera /articulos.json, que es lo que
 * la web (index.html) carga para mostrar la sección "Actualidad
 * Jurídica" y el aviso de "nuevo artículo".
 *
 * No hace falta tocar este archivo para publicar artículos nuevos:
 * eso se hace desde /admin. Esto solo lee lo que el panel escribe.
 * -----------------------------------------------------------------
 */
const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, 'content', 'articulos');
const OUTPUT_FILE = path.join(__dirname, 'articulos.json');

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw.trim() };

  const frontmatter = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    value = value.replace(/^["']|["']$/g, '');
    frontmatter[key] = value;
  });

  return { frontmatter, body: match[2].trim() };
}

function buildArticles() {
  let articles = [];

  if (fs.existsSync(ARTICLES_DIR)) {
    const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md'));

    articles = files.map((file) => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
      const { frontmatter, body } = parseFrontmatter(raw);

      return {
        slug: file.replace(/\.md$/, ''),
        title: frontmatter.title || 'Sin título',
        category: frontmatter.category || 'General',
        date: frontmatter.date || '',
        excerpt: frontmatter.excerpt || '',
        body: body || '',
      };
    });
  }

  // Más recientes primero
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(articles, null, 2), 'utf8');
  console.log(`[build-articles] Generado articulos.json con ${articles.length} artículo(s).`);
}

buildArticles();
