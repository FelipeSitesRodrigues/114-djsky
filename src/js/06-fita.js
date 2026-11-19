// Fita de nomes ("Já dividiu o palco com"): Web Animations andando meio trilho em loop (o
// trilho tem a lista duas vezes). A de baixo anda ao contrário. A rolagem acelera as duas pelo
// playbackRate e elas voltam devagar à velocidade normal (memória marquee-waapi-rolagem). Só
// anda com a seção na tela.
;(() => {
  const fitas = [...document.querySelectorAll('[data-fita]')]
  if (!fitas.length || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
  const anims = fitas.map((f) => {
    const trilho = f.querySelector('.fita__trilho')
    const volta = f.hasAttribute('data-fita-volta')
    const quadros = volta ? [{ transform: 'translate3d(-50%,0,0)' }, { transform: 'translate3d(0,0,0)' }] : [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(-50%,0,0)' }]
    const a = trilho.animate(quadros, { duration: 42000, iterations: Infinity })
    a.pause()
    return a
  })
  let ultimoY = scrollY
  let vel = 1
  let raf = 0
  const passo = () => {
    const dy = Math.abs(scrollY - ultimoY)
    ultimoY = scrollY
    vel += (1 + Math.min(dy, 80) / 12 - vel) * 0.08
    anims.forEach((a) => (a.playbackRate = vel))
    raf = requestAnimationFrame(passo)
  }
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      anims.forEach((a) => a.play())
      ultimoY = scrollY
      if (!raf) raf = requestAnimationFrame(passo)
    } else {
      anims.forEach((a) => a.pause())
      cancelAnimationFrame(raf)
      raf = 0
    }
  }).observe(fitas[0].parentElement)
})()
