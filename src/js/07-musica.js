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
