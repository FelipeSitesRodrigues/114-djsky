// Galeria de shows: o trilho tem as fotos duas vezes e anda meio trilho em loop, numa
// velocidade fixa em px/s (a duração sai do comprimento). Não para no hover nem no toque.
// Só anda com a faixa na tela; as fotos trocam o lazy por eager perto dela, porque o lazy do
// Chrome conta o corte lateral e a foto que entra de lado chegaria em branco (marquee-lazy-eager).
;(() => {
  const faixa = document.querySelector('[data-galeria]')
  if (!faixa || !('IntersectionObserver' in window)) return
  const trilho = faixa.querySelector('.galeria__trilho')
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return
    faixa.querySelectorAll('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'))
    io.disconnect()
  }, { rootMargin: '900px 0px' }).observe(faixa)

  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !trilho.animate) return
  document.documentElement.classList.add('galeria-anda')
  const PXS = innerWidth < 768 ? 80 : 125
  let anim = null
  let visivel = false
  const montar = () => {
    const t = anim ? anim.currentTime / anim.effect.getTiming().duration : 0
    if (anim) anim.cancel()
    const meio = trilho.firstElementChild.getBoundingClientRect().width
    const duracao = (meio / PXS) * 1000
    anim = trilho.animate([{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(-50%,0,0)' }], { duration: duracao, iterations: Infinity })
    anim.currentTime = (t % 1) * duracao
    if (!visivel) anim.pause()
  }
  montar()
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting
    visivel ? anim.play() : anim.pause()
  }).observe(faixa)
  let largura = innerWidth
  addEventListener('resize', () => {
    if (innerWidth === largura) return
    largura = innerWidth
    montar()
  })
})()
