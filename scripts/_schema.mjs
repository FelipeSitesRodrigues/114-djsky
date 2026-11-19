// JSON-LD do artista (MusicGroup + Person) e das perguntas (FAQPage), puxado pelo build.
import * as cheerio from 'cheerio'

export function schemaArtista(html, cfg) {
  const base = (cfg.dominio || '').replace(/\/$/, '')
  const artista = {
    '@type': 'MusicGroup',
    '@id': `${base}/#sky`,
    name: 'Sky',
    alternateName: 'DJ Sky',
    description: cfg.descricao,
    genre: ['Open format', 'Funk', 'Música eletrônica', 'Pop'],
    telephone: `+${cfg.whatsapp}`,
    image: `${base}/assets/img/og.jpg`,
    logo: `${base}/icon-512.png`,
    foundingLocation: { '@type': 'Place', name: 'Aracaju, SE, Brasil' },
    location: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Aracaju', addressRegion: 'SE', addressCountry: 'BR' } },
    areaServed: { '@type': 'Country', name: 'Brasil' },
    sameAs: Object.values(cfg.redes || {}).filter(Boolean),
    member: { '@type': 'Person', name: 'Sky', jobTitle: 'DJ e produtor musical', homeLocation: { '@type': 'Place', name: 'Aracaju, SE' } },
  }
  if (base) artista.url = `${base}/`
  const $ = cheerio.load(html)
  const perguntas = $('#perguntas .pergunta')
    .map((_, d) => ({
      '@type': 'Question',
      name: $(d).find('.pergunta__q').text().replace(/\s+/g, ' ').trim(),
      acceptedAnswer: { '@type': 'Answer', text: $(d).find('.pergunta__r').text().replace(/\s+/g, ' ').trim() },
    }))
    .get()
    .filter((q) => q.name && q.acceptedAnswer.text)
  const grafo = [artista]
  if (perguntas.length) grafo.push({ '@type': 'FAQPage', '@id': `${base}/#perguntas`, mainEntity: perguntas })
  return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo })}</script>`
}
