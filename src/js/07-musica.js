// Cartão de música com áudio: play/pausa no próprio cartão, a onda pulsa enquanto toca e a
// barra fina mostra o andamento. O áudio só carrega no 1º clique (preload="none").
;(() => {
  for (const card of document.querySelectorAll('[data-faixa]')) {
    const audio = card.querySelector('audio')
    const botao = card.querySelector('[data-tocar]')
    const barra = card.querySelector('[data-andamento]')
    let raf = 0
    const andar = () => {
      if (audio.duration) barra.style.transform = `scaleX(${(audio.currentTime / audio.duration).toFixed(4)})`
      raf = requestAnimationFrame(andar)
    }
    const estado = () => {
      const toca = !audio.paused
      card.classList.toggle('tocando', toca)
      card.classList.toggle('pausada', !toca && audio.currentTime > 0)
      botao.setAttribute('aria-label', toca ? 'Pausar a música' : 'Ouvir Novidade na Área x Gol Bolinha')
      cancelAnimationFrame(raf)
      raf = toca ? requestAnimationFrame(andar) : 0
    }
    botao.addEventListener('click', () => {
      if (audio.paused) {
        document.querySelectorAll('audio, video').forEach((m) => m !== audio && !m.muted && m.pause())
        audio.play().catch(() => {})
      } else audio.pause()
    })
    audio.addEventListener('play', estado)
    audio.addEventListener('pause', estado)
    audio.addEventListener('ended', () => {
      audio.currentTime = 0
      estado()
    })
  }
})()

;
// Lançamentos: o clique abre o player oficial do Spotify dentro do card (prévia de 30 s pra
// quem não está logado, música inteira pra quem está). O iframe só nasce no clique; sem JS, o
// link abre a faixa no Spotify.
;(() => {
  const caixa = document.querySelector('[data-spotify-player]')
  if (!caixa) return
  const links = document.querySelectorAll('[data-spotify]')
  links.forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault()
      links.forEach((l) => l.classList.toggle('ativa', l === a))
      // pausa o cartão de áudio do site, pra não tocarem os dois
      document.querySelectorAll('[data-faixa] audio').forEach((au) => au.pause())
      caixa.hidden = false
      caixa.innerHTML = `<iframe src="https://open.spotify.com/embed/track/${a.dataset.spotify}?utm_source=generator&theme=0" title="Player do Spotify: ${a.querySelector('strong').textContent}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="eager"></iframe>`
    }),
  )
})()
