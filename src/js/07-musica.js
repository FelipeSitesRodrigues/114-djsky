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
// Lançamentos: um clique no play do site já toca. Spotify pela API oficial do iframe
// (createController + play), que só baixa no 1º clique; prévia de 30 s pra quem não está
// logado. YouTube pelo domínio sem cookie, com autoplay. Cada um tem a sua caixa: o player do
// Spotify fica vivo e só troca a faixa (loadUri). Sem JS, o link abre a faixa no app.
;(() => {
  const caixaSp = document.querySelector('[data-spotify-player]')
  const caixaYt = document.querySelector('[data-youtube-player]')
  if (!caixaSp || !caixaYt) return
  const links = document.querySelectorAll('[data-spotify], [data-youtube]')
  let ctrl = null
  let pedido = false
  let pendente = ''
  const tocarSpotify = (id) => {
    const uri = `spotify:track:${id}`
    if (ctrl) {
      ctrl.loadUri(uri)
      ctrl.play()
      return
    }
    pendente = uri
    if (pedido) return
    pedido = true
    window.onSpotifyIframeApiReady = (api) => {
      const criadoCom = pendente
      api.createController(caixaSp.querySelector('[data-spotify-alvo]'), { uri: criadoCom, width: '100%', height: 80, theme: 'dark' }, (c) => {
        ctrl = c
        // avisa o estado (o cartão da Chacoalha acende a onda e troca o ícone)
        c.addListener('playback_update', (ev) => document.dispatchEvent(new CustomEvent('spotify-estado', { detail: ev.data })))
        let primeira = true
        c.addListener('ready', () => {
          if (!primeira) return
          primeira = false
          // clicou noutra faixa enquanto a API carregava: vale a última
          if (pendente !== criadoCom) c.loadUri(pendente)
          c.play()
        })
      })
    }
    const sc = document.createElement('script')
    sc.src = 'https://open.spotify.com/embed/iframe-api/v1'
    sc.async = true
    document.head.append(sc)
  }
  links.forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault()
      // 2º clique na faixa que já está no player do Spotify: pausa ou volta a tocar
      if (a.dataset.spotify && a.classList.contains('ativa') && ctrl) {
        ctrl.togglePlay()
        return
      }
      links.forEach((l) => l.classList.toggle('ativa', l === a))
      // pausa o áudio e os vídeos com som do site, pra não tocarem dois ao mesmo tempo
      document.querySelectorAll('[data-faixa] audio').forEach((m) => m.pause())
      document.querySelectorAll('.vcard video').forEach((v) => { if (!v.muted) v.pause() })
      const yt = a.dataset.youtube
      if (yt) {
        if (ctrl) ctrl.pause()
        caixaSp.hidden = true
        caixaYt.hidden = false
        caixaYt.innerHTML = `<iframe class="yt" src="https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&playsinline=1" title="YouTube: ${a.querySelector('strong').textContent}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>`
      } else {
        caixaYt.hidden = true
        caixaYt.replaceChildren()
        caixaSp.hidden = false
        tocarSpotify(a.dataset.spotify)
      }
    }),
  )
})()

;
// Cartão grande da Chacoalha: o play aciona a mesma faixa nos lançamentos (Spotify, 1 clique) e
// a onda acende enquanto ela toca.
;(() => {
  const card = document.querySelector('[data-faixa-spotify]')
  if (!card) return
  const id = card.dataset.faixaSpotify
  const link = document.querySelector(`[data-spotify="${id}"]`)
  const botao = card.querySelector('.mcard__play')
  if (!link) return
  botao.addEventListener('click', () => link.click())
  document.addEventListener('spotify-estado', (e) => {
    const toca = e.detail.playingURI === `spotify:track:${id}` && !e.detail.isPaused
    card.classList.toggle('tocando', toca)
    botao.setAttribute('aria-label', toca ? 'Pausar Chacoalha' : 'Ouvir Chacoalha')
  })
})()
