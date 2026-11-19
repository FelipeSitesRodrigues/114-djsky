// Hero: o "sky" gigante e o recorte andam um pouco com o mouse (profundidade). Só computador
// com mouse e sem movimento reduzido; o rAF só roda enquanto o ponteiro está se mexendo e o
// valor anda com suavização (lerp), sem ouvir scroll.
;(() => {
  // seda e "sky" de fundo: baixam depois do load ([data-tarde], ver build) e acendem devagar
  const tardias = document.querySelectorAll('img[data-tarde]')
  const carregar = () => tardias.forEach((img) => {
    const pic = img.closest('picture')
    if (pic) pic.querySelectorAll('source[data-srcset]').forEach((s) => (s.srcset = s.dataset.srcset))
    img.addEventListener('load', () => (img.closest('.hero__seda') || img).classList.add('pronta'), { once: true })
    if (img.dataset.srcset) img.srcset = img.dataset.srcset
    if (img.dataset.src) img.src = img.dataset.src
  })
  // o "sky" gigante vai num canvas: imagem desse tamanho virava o LCP ao chegar depois do load
  const tela = document.querySelector('canvas[data-marca]')
  const marca = () => {
    if (!tela) return
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      tela.getContext('2d').drawImage(img, 0, 0, tela.width, tela.height)
      tela.classList.add('pronta')
    }
    img.src = innerWidth < 768 ? tela.dataset.marcaCel : tela.dataset.marca
  }
  const tudo = () => {
    carregar()
    marca()
  }
  if (document.readyState === 'complete') tudo()
  else addEventListener('load', tudo, { once: true })
})()
;(() => {
  const hero = document.querySelector('.hero')
  if (!hero || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  let alvoX = 0
  let alvoY = 0
  let x = 0
  let y = 0
  let raf = 0
  const passo = () => {
    x += (alvoX - x) * 0.07
    y += (alvoY - y) * 0.07
    hero.style.setProperty('--mx', x.toFixed(3))
    hero.style.setProperty('--my', y.toFixed(3))
    raf = Math.abs(alvoX - x) + Math.abs(alvoY - y) > 0.002 ? requestAnimationFrame(passo) : 0
  }
  hero.addEventListener('pointermove', (e) => {
    const c = hero.getBoundingClientRect()
    alvoX = ((e.clientX - c.left) / c.width) * 2 - 1
    alvoY = ((e.clientY - c.top) / c.height) * 2 - 1
    if (!raf) raf = requestAnimationFrame(passo)
  })
  hero.addEventListener('pointerleave', () => {
    alvoX = 0
    alvoY = 0
    if (!raf) raf = requestAnimationFrame(passo)
  })
})()
