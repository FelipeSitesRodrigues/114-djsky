// Carrossel de vídeos, tocando no próprio card (pedido do Felipe: nada de abrir em tela por cima).
// Cada card recebe --o (distância até o centro, -2 a 2, dando a volta) e --a (a mesma sem sinal);
// o CSS faz o resto. Dois modos:
// - prévia: o card do centro toca o trecho mudo de 6 s em loop, só com a seção na tela
// - assistindo: o play troca o trecho pelo vídeo inteiro com som, ali mesmo no card. Nesse
//   modo, as setas levam ao vizinho e ele já começa a tocar inteiro
// O vídeo inteiro só baixa no play (720p). Saiu da tela, pausa. Acabou, volta pra prévia.
;(() => {
  const raiz = document.querySelector('[data-carrossel]')
  if (!raiz) return
  const secao = raiz.closest('section')
  const cards = [...raiz.querySelectorAll('.vcard')]
  const titulo = secao.querySelector('[data-barra-titulo]')
  const estadoTxt = secao.querySelector('[data-barra-estado]')
  const capa = secao.querySelector('.player-barra__capa')
  const progresso = secao.querySelector('[data-progresso]')
  const tempo = secao.querySelector('[data-barra-tempo]')
  const botaoPlay = secao.querySelector('[data-tocar-atual]')
  const botaoSom = secao.querySelector('[data-som]')
  const volume = secao.querySelector('[data-volume]')
  let nivel = 1
  const n = cards.length
  let atual = Math.floor(n / 2)
  let naTela = false
  let assistindo = false
  let raf = 0
  const video = (i) => cards[i].querySelector('video')

  const andar = () => {
    const v = video(atual)
    if (v && v.duration) progresso.style.transform = `scaleX(${(v.currentTime / v.duration).toFixed(4)})`
    raf = requestAnimationFrame(andar)
  }
  const pintarBarra = () => {
    const v = video(atual)
    const tocando = assistindo && !v.paused
    secao.classList.toggle('videos--assistindo', assistindo)
    raiz.classList.toggle('carrossel--largo', assistindo && cards[atual].classList.contains('vcard--deitado'))
    botaoPlay.classList.toggle('tocando', tocando)
    botaoPlay.setAttribute('aria-label', tocando ? 'Pausar' : 'Assistir com som')
    cards.forEach((c, i) => c.classList.toggle('tocando', i === atual && tocando))
    botaoSom.classList.toggle('com-som', assistindo && !v.muted)
    const mostrado = assistindo && !v.muted ? nivel : 0
    volume.value = mostrado
    volume.style.setProperty('--v', mostrado)
    botaoSom.setAttribute('aria-label', assistindo && !v.muted ? 'Tirar o som' : 'Ligar o som')
    estadoTxt.textContent = assistindo ? (v.paused ? 'Pausado' : 'Tocando agora') : 'Prévia · aperte o play pra ouvir'
  }
  // prévia: trecho mudo em loop
  const previa = (c) => {
    const v = c.querySelector('video')
    c.classList.remove('inteiro')
    if (v.dataset.modo === 'inteiro') {
      v.pause()
      v.src = v.dataset.src
    }
    v.muted = true
    v.loop = true
    v.dataset.modo = 'previa'
  }
  // inteiro: o mesmo <video> passa a tocar o arquivo cheio, com som
  const inteiro = (c) => {
    const v = c.querySelector('video')
    document.querySelectorAll('audio').forEach((a) => a.pause())
    if (v.dataset.modo !== 'inteiro') {
      v.dataset.modo = 'inteiro'
      v.loop = false
      v.src = `/assets/video/${c.dataset.id}.mp4`
    }
    c.classList.add('inteiro')
    v.volume = nivel
    v.muted = nivel === 0
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => {})
    })
  }
  const tocar = () => {
    cards.forEach((c, i) => {
      const v = c.querySelector('video')
      if (i !== atual) {
        if (v.dataset.modo === 'inteiro') previa(c)
        v.pause()
        return
      }
      if (!naTela) return v.pause()
      if (assistindo) inteiro(c)
      else {
        previa(c)
        if (!v.getAttribute('src')) v.src = v.dataset.src
        v.play().catch(() => {})
      }
    })
    cancelAnimationFrame(raf)
    raf = naTela ? requestAnimationFrame(andar) : 0
    pintarBarra()
  }
  const ir = (i) => {
    atual = (i + n) % n
    cards.forEach((c, k) => {
      let o = k - atual
      if (o > n / 2) o -= n
      if (o < -n / 2) o += n
      c.style.setProperty('--o', o)
      c.style.setProperty('--a', Math.abs(o))
      c.style.setProperty('--s', Math.sign(o))
      c.classList.toggle('ativo', o === 0)
      c.querySelector('button').tabIndex = o === 0 ? 0 : -1
    })
    titulo.textContent = cards[atual].dataset.titulo
    const v = video(atual)
    capa.src = v.poster || v.dataset.poster
    progresso.style.transform = 'scaleX(0)'
    tocar()
  }
  const alternar = () => {
    const v = video(atual)
    if (!assistindo) {
      assistindo = true
      naTela = true
      tocar()
    } else if (v.paused) v.play().catch(() => {})
    else v.pause()
    pintarBarra()
  }

  // clique no card: vizinho vem pro centro (e toca, se já estiver assistindo); o do centro toca/pausa
  cards.forEach((c, i) => c.addEventListener('click', () => (i === atual ? alternar() : ir(i))))
  cards.forEach((c) => {
    const v = c.querySelector('video')
    v.addEventListener('play', pintarBarra)
    v.addEventListener('pause', pintarBarra)
    v.addEventListener('ended', () => {
      if (v.dataset.modo !== 'inteiro') return
      assistindo = false
      tocar()
    })
  })
  secao.querySelectorAll('[data-anterior]').forEach((b) => b.addEventListener('click', () => ir(atual - 1)))
  secao.querySelectorAll('[data-proximo]').forEach((b) => b.addEventListener('click', () => ir(atual + 1)))
  botaoPlay.addEventListener('click', alternar)
  botaoSom.addEventListener('click', () => {
    const v = video(atual)
    if (!assistindo) return alternar()
    if (v.muted && nivel === 0) nivel = 0.6
    v.muted = !v.muted
    v.volume = nivel
    pintarBarra()
  })
  // regulador de volume: vale pro vídeo atual e pros próximos
  volume.addEventListener('input', () => {
    nivel = Number(volume.value)
    const v = video(atual)
    if (!assistindo) alternar()
    v.volume = nivel
    v.muted = nivel === 0
    pintarBarra()
  })
  secao.querySelector('[data-tela-cheia]').addEventListener('click', () => {
    const v = video(atual)
    if (!assistindo) alternar()
    const pedir = v.requestFullscreen || v.webkitEnterFullscreen || v.webkitRequestFullscreen
    if (pedir) pedir.call(v)
  })
  // barra de progresso: clique pula pro ponto
  tempo.addEventListener('click', (e) => {
    const v = video(atual)
    if (!v.duration) return
    const c = tempo.getBoundingClientRect()
    v.currentTime = ((e.clientX - c.left) / c.width) * v.duration
  })
  raiz.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') ir(atual - 1)
    if (e.key === 'ArrowRight') ir(atual + 1)
  })
  // arrastar (dedo e mouse): passa de card a partir de 40 px na horizontal; o clique que
  // termina um arrasto não conta como play
  let x0 = null
  let arrastou = false
  raiz.addEventListener('pointerdown', (e) => {
    x0 = e.clientX
    arrastou = false
  })
  raiz.addEventListener('pointerup', (e) => {
    if (x0 === null) return
    const d = e.clientX - x0
    x0 = null
    if (Math.abs(d) > 40) {
      arrastou = true
      ir(atual + (d < 0 ? 1 : -1))
    }
  })
  raiz.addEventListener('click', (e) => {
    if (!arrastou) return
    e.stopPropagation()
    arrastou = false
  }, true)
  raiz.addEventListener('pointercancel', () => (x0 = null))

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      naTela = e.isIntersecting
      tocar()
    }, { threshold: 0.3 }).observe(raiz)
  }
  document.addEventListener('visibilitychange', () => document.hidden && video(atual).pause())
  // botão do clipe na seção Música: rola até aqui e toca o Rebola inteiro, no card
  document.querySelectorAll('[data-ver-clipe]').forEach((b) => b.addEventListener('click', () => {
    const i = cards.findIndex((c) => c.dataset.id === b.dataset.verClipe)
    if (i < 0) return
    assistindo = true
    naTela = true
    if (window.lenis) window.lenis.scrollTo(raiz, { offset: -(innerHeight - raiz.offsetHeight) / 2 })
    else raiz.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
    ir(i)
  }))
  ir(atual)
})()
