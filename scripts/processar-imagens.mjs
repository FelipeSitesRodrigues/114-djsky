/**
 * Imagens do site em src/assets/img (AVIF e WebP em várias larguras, com manifesto.json pro
 * width/height do <img>) e ícones em src/raiz. Base da 0108.
 *
 * Origem: ../0114 - DJ Sky/Recursos Site (presskit do Sky e o que saiu do ChatGPT em
 * 2026-11-18) e insumos/ (camadas do hero e recorte do Sky, de scripts/camadas-hero.py).
 * Uso: node scripts/processar-imagens.mjs   (depois: node build.mjs)
 */
import sharp from 'sharp'
import { mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs'
import path from 'node:path'

sharp.cache(false)
const REC = '../0114 - DJ Sky/Recursos Site'
const KIT = `${REC}/MATERIAL COMPLETO/Presskit Sky 2026`
const SHOW = `${KIT}/Fotos Shows`
const EST = `${KIT}/Fotos Estúdio`
const GPT = `${REC}/chatgpt`
const MOCK = '../0114 - DJ Sky/referencias-mockup'
const OUT = 'src/assets/img'
const RAIZ = 'src/raiz'
mkdirSync(OUT, { recursive: true })
mkdirSync(RAIZ, { recursive: true })
for (const f of readdirSync(OUT)) rmSync(path.join(OUT, f), { recursive: true, force: true })
const manifesto = {}

async function gravar(pipeline, nome) {
  const info = await pipeline.toFile(path.join(OUT, nome))
  manifesto[nome] = { w: info.width, h: info.height, kb: Math.round(info.size / 1024) }
}

// buffer de origem: corte opcional (fração [x, y, largura, altura]) e proporção opcional (w/h)
async function origem(arq, { corte, proporcao, foco = 'centre', borrar = 0, movimento = 0, tom, max = 2400 } = {}) {
  let p = sharp(arq, { limitInputPixels: false }).rotate()
  let buf = await p.toBuffer()
  let m = await sharp(buf).metadata()
  if (corte) {
    buf = await sharp(buf).extract({ left: Math.round(m.width * corte[0]), top: Math.round(m.height * corte[1]), width: Math.round(m.width * corte[2]), height: Math.round(m.height * corte[3]) }).toBuffer()
    m = await sharp(buf).metadata()
  }
  if (m.width > max) {
    buf = await sharp(buf).resize({ width: max }).toBuffer()
    m = await sharp(buf).metadata()
  }
  if (proporcao) {
    const w = Math.min(m.width, Math.round(m.height * proporcao))
    const h = Math.round(w / proporcao)
    buf = await sharp(buf).resize(w, h, { fit: 'cover', position: foco }).toBuffer()
  }
  if (movimento) {
    // desfoque de movimento na horizontal (cartões de música, como na referência)
    const n = movimento
    buf = await sharp(buf).convolve({ width: n, height: 3, kernel: [...Array(n).fill(0), ...Array(n).fill(1), ...Array(n).fill(0)] }).toBuffer()
  }
  if (borrar) buf = await sharp(buf).blur(borrar).toBuffer()
  if (tom) {
    const mm = await sharp(buf).metadata()
    const cor = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${mm.width}" height="${mm.height}"><rect width="100%" height="100%" fill="${tom}" fill-opacity=".42"/></svg>`)
    buf = await sharp(buf).composite([{ input: cor }]).modulate({ brightness: 1.05, saturation: 1.15 }).toBuffer()
  }
  return buf
}

async function variantes(nome, buf, larguras, { alfa = false, qualidade = 54 } = {}) {
  const { width } = await sharp(buf).metadata()
  for (const w of larguras) {
    if (w > width * 1.02) continue
    for (const f of ['avif', 'webp']) {
      let p = sharp(buf).resize({ width: Math.min(w, width), kernel: 'lanczos3' })
      p = f === 'avif'
        ? p.avif({ quality: alfa ? 58 : qualidade, effort: 7, chromaSubsampling: alfa ? '4:4:4' : '4:2:0' })
        : p.webp({ quality: alfa ? 82 : 74, alphaQuality: 88, effort: 6, smartSubsample: true })
      await gravar(p, `${nome}-${Math.min(w, width)}.${f}`)
    }
  }
  console.log(nome.padEnd(24), larguras.join(', '))
}

// ---------------------------------------------------------------- hero (camadas)
// fundo e seda são luz desfocada: qualidade baixa não aparece
await variantes('hero-fundo', await origem('insumos/hero-base.png'), [960, 1672], { qualidade: 40 })
await variantes('hero-fundo-celular', await origem('insumos/hero-celular-base.png'), [600, 941], { qualidade: 40 })
await variantes('hero-seda', await origem('insumos/hero-seda.png'), [960, 1672], { alfa: true })
await variantes('hero-seda-celular', await origem('insumos/hero-celular-seda.png'), [600, 941], { alfa: true })
// o Sky recortado (LCP): 2153x1436 com a área transparente em volta
await variantes('sky-hero', await origem('insumos/sky-recorte.png'), [640, 960, 1300, 1700], { alfa: true })
// celular: só o miolo (sem os cotovelos, que o celular corta de qualquer jeito), 1378x1436
await variantes('sky-hero-cel', await origem('insumos/sky-recorte.png', { corte: [0.18, 0, 0.64, 1] }), [600, 900, 1200], { alfa: true })

// ---------------------------------------------------------------- marca (PNG oficial 4500x4500, recortado na caixa do desenho)
async function logo(arq, larguras, prefixo) {
  const buf = await sharp(arq).trim({ threshold: 1 }).toBuffer()
  for (const w of larguras) await gravar(sharp(buf).resize({ width: w }).webp({ quality: 90, alphaQuality: 92, effort: 6 }), `${prefixo}-${w}.webp`)
}
await logo(`${KIT}/Marca/Marca-04.png`, [200, 600, 1200], 'logo-branco')
await logo(`${KIT}/Marca/Marca_Prancheta 1.png`, [600], 'logo-magenta')

// ---------------------------------------------------------------- abertura: o logo em 5 peças (s, k, y e as duas ondas)
// separadas por componente conexo em insumos/abre-*.png (logo recortado de 4254 px); aqui saem
// na escala de um logo de 720 px. Posição de cada uma no CSS (97-abertura)
for (const nome of ['s', 'k', 'y', 'onda1', 'onda2']) {
  const { width } = await sharp(`insumos/abre-${nome}.png`).metadata()
  await gravar(sharp(`insumos/abre-${nome}.png`).resize({ width: Math.round((width * 720) / 4254) }).webp({ quality: 90, alphaQuality: 92 }), `abre-${nome}.webp`)
}

// ---------------------------------------------------------------- sobre e palcos (fotos reais de show)
await variantes('sobre', await origem(`${SHOW}/TK1-17812 (1).jpg`, { proporcao: 1 / 1.08, foco: 'centre' }), [480, 720, 1000])
await variantes('palco-telao', await origem(`${SHOW}/FGM-219.jpg`, { proporcao: 820 / 380, foco: 'centre' }), [640, 960, 1400])
await variantes('palco-principal', await origem(`${SHOW}/TK1-17767.jpg`, { proporcao: 400 / 380, foco: 'centre' }), [480, 800])
await variantes('palco-faiscas', await origem(`${SHOW}/CASINO@_rafaelphotos_409.jpg`, { proporcao: 1.45 }), [480, 800])
await variantes('palco-bracos', await origem(`${SHOW}/TK1-6203.jpg`, { proporcao: 1.45 }), [480, 800])
await variantes('palco-festival', await origem(`${SHOW}/TK1-0465.jpg`, { proporcao: 1.45 }), [480, 800])
await variantes('palco-panorama', await origem(`${SHOW}/FGM-216.jpg`, { proporcao: 1240 / 300, foco: 'centre' }), [800, 1400, 2000])

// ---------------------------------------------------------------- galeria de shows (faixa contínua entre o show e o contratar)
// FOTOS NOVAS (Roberto Queiroz, 2026-11) mais 4 do presskit. Altura fixa na faixa: em pé 2:3,
// deitada 3:2. Ordem e alt em src/dados/galeria.json
{
  const NOVAS = `${REC}/FOTOS NOVAS`
  const rq = (n) => `${NOVAS}/@robertoqueirozfotografia-${n}.jpg`
  const fotos = [
    ['rq10', rq(10)], ['rq26', rq(26)], ['rq15', rq(15)], ['rq43', rq(43)], ['rq23', rq(23)], ['casino', `${SHOW}/CASINO@_rafaelphotos_409.jpg`],
    ['rq13', rq(13)], ['rq47', rq(47)], ['rq24', rq(24)], ['rq30', rq(30)], ['rq21', rq(21)], ['bracos', `${SHOW}/TK1-6203.jpg`],
    ['rq14', rq(14)], ['rq4', rq(4)], ['telao', `${SHOW}/FGM-219.jpg`], ['rq2', rq(2)], ['festival', `${SHOW}/TK1-0465.jpg`], ['rq7', rq(7)],
  ]
  for (const [id, arq] of fotos) {
    const { width, height } = await sharp(arq).metadata()
    const pe = height > width
    await variantes(`galeria-${id}`, await origem(arq, { proporcao: pe ? 2 / 3 : 3 / 2, max: 1400 }), pe ? [300, 560] : [660, 1260], { qualidade: 50 })
  }
}

// ---------------------------------------------------------------- música (foto desfocada em movimento, como na referência)
await variantes('musica-novidade', await origem(`${EST}/DSC01340.jpg`, { proporcao: 400 / 520, foco: 'north', movimento: 15, borrar: 1.2 }), [420, 800], { qualidade: 50 })
await variantes('musica-rebola', await origem(`${MOCK}/secao-videos/4-capa-rebola-vai-malandra.jpg`, { proporcao: 400 / 520, movimento: 13, borrar: 1 }), [420, 800], { qualidade: 50 })

// ---------------------------------------------------------------- formatos (cartão 3:5: foto e a versão em vidro, borrada e tingida)
const formatos = [
  ['casas', `${SHOW}/TK1-6164.jpg`, '#E72284', 'centre'],
  ['casamentos', `${GPT}/5-casamentos.png`, '#F05AA0', 'centre'],
  // quadro do aftermovie de formatura (Medicina) que o Sky mandou em 2026-11-19: a foto antiga parecia casamento
  ['formaturas', `${REC}/VIDEOS DRIVE 2026-11-19/formatura-quadro.jpg`, '#8268C9', 'centre', [0.37, 0, 0.34, 1]],
  ['quinze', `${MOCK}/secao-formatos/3-festas-15-anos.jpg`, '#B81C68', 'centre', [0.49, 0, 0.34, 1]],
  ['corporativos', `${GPT}/6-corporativos.png`, '#7A4FC4', 'centre'],
]
for (const [id, arq, tom, foco, corte] of formatos) {
  await variantes(`formato-${id}`, await origem(arq, { proporcao: 3 / 5, foco, corte }), [400, 720], { qualidade: 52 })
  await variantes(`formato-${id}-vidro`, await origem(arq, { proporcao: 3 / 5, foco, corte, borrar: 26, tom, max: 2400 }), [400, 600], { qualidade: 40 })
}

// ---------------------------------------------------------------- compartilhamento e favicons
{
  const fundo = await sharp('insumos/hero-base.png').resize(1200, 630, { fit: 'cover' }).composite([{ input: await sharp('insumos/hero-seda.png').resize(1200, 630, { fit: 'cover' }).toBuffer() }]).toBuffer()
  const sky = await sharp('insumos/sky-recorte.png').resize({ height: 600 }).toBuffer()
  const marca = await sharp(`${KIT}/Marca/Marca-04.png`).trim({ threshold: 1 }).resize({ width: 1000 }).ensureAlpha(0.12).toBuffer()
  await gravar(sharp(fundo).composite([{ input: marca, left: 100, top: 40, blend: 'over' }, { input: sky, left: Math.round(600 - 450), top: 30 }]).jpeg({ quality: 82, mozjpeg: true }), 'og.jpg')
}
async function icone(lado, saida) {
  const s = Math.round(lado * 0.8)
  const simbolo = await sharp(`${KIT}/Marca/Marca_Prancheta 1.png`).trim({ threshold: 1 }).resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  const r = Math.round(lado * 0.22)
  const fundo = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}"><rect width="${lado}" height="${lado}" rx="${r}" fill="#08070B"/></svg>`)
  await sharp(fundo).composite([{ input: simbolo, gravity: 'center' }]).png().toFile(path.join(RAIZ, saida))
}
await icone(32, 'favicon-32.png')
await icone(180, 'apple-touch-icon.png')
await icone(192, 'icon-192.png')
await icone(512, 'icon-512.png')

// grão de filme do body::after: ruído branco com alfa, 128 px em ladrilho
{
  const N = 128
  const b = Buffer.alloc(N * N * 4)
  for (let i = 0; i < N * N; i++) {
    const v = (Math.random() * 255) | 0
    b.fill(255, i * 4, i * 4 + 3)
    b[i * 4 + 3] = v < 128 ? 0 : Math.round((v - 128) * 0.55)
  }
  await sharp(b, { raw: { width: N, height: N, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'grao.png'))
}

writeFileSync(path.join(OUT, 'manifesto.json'), JSON.stringify(manifesto, null, 1))
const total = Object.values(manifesto).reduce((a, m) => a + m.kb, 0)
console.log(`ok ${Object.keys(manifesto).length} arquivos, ${total} KB`)
