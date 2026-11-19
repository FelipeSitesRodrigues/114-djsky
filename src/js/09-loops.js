// Vídeos de fundo mudos ([data-loop]: telão do show e fundo do CTA). Só baixam quando chegam
// perto da tela e só tocam enquanto estão nela. Com movimento reduzido fica a capa parada.
;(() => {
  // capas ([data-poster]) só baixam perto da tela: no celular elas disputavam a banda com o
  // recorte do Sky (LCP)
  const capas = document.querySelectorAll('video[data-poster]')
  const pintar = (v) => { if (v.dataset.poster) { v.poster = v.dataset.poster; delete v.dataset.poster } }
  if (!('IntersectionObserver' in window)) capas.forEach(pintar)
  else {
    const ioc = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return
      const grupo = e.target.closest('[data-carrossel]')
      ;(grupo ? grupo.querySelectorAll('video') : [e.target]).forEach(pintar)
      ioc.unobserve(e.target)
    }), { rootMargin: '700px 0px' })
    capas.forEach((v) => ioc.observe(v))
  }
})()
;(() => {
  const videos = document.querySelectorAll('video[data-loop]')
  if (!videos.length || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      const v = e.target
      if (e.isIntersecting) {
        if (!v.src) v.src = v.dataset.src
        v.play().catch(() => {})
      } else v.pause()
    }
  }, { rootMargin: '200px 0px' })
  videos.forEach((v) => io.observe(v))
})()
