// Topo: ganha o vidro escuro depois de rolar um pouco; gaveta do menu no celular.
// O flutuante do WhatsApp aparece depois do hero. Tudo por IntersectionObserver (sem ouvir scroll).
;(() => {
  const topo = document.getElementById('topo')
  const hero = document.querySelector('.hero')
  const flutuante = document.querySelector('.flutuante')
  if (topo && hero && 'IntersectionObserver' in window) {
    const marca = document.createElement('div')
    marca.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:90px;pointer-events:none'
    hero.prepend(marca)
    new IntersectionObserver(([e]) => topo.classList.toggle('topo--vidro', !e.isIntersecting)).observe(marca)
    if (flutuante) new IntersectionObserver(([e]) => flutuante.classList.toggle('flutuante--on', !e.isIntersecting), { threshold: 0.15 }).observe(hero)
  }
  const abrir = topo && topo.querySelector('.topo__abrir')
  const gaveta = document.getElementById('menu-celular')
  if (abrir && gaveta) {
    const fechar = () => {
      abrir.setAttribute('aria-expanded', 'false')
      abrir.setAttribute('aria-label', 'Abrir menu')
      topo.classList.remove('topo--aberto')
      gaveta.hidden = true
    }
    abrir.addEventListener('click', () => {
      const aberto = abrir.getAttribute('aria-expanded') === 'true'
      if (aberto) return fechar()
      abrir.setAttribute('aria-expanded', 'true')
      abrir.setAttribute('aria-label', 'Fechar menu')
      topo.classList.add('topo--aberto')
      gaveta.hidden = false
    })
    gaveta.addEventListener('click', (e) => e.target.closest('a') && fechar())
    addEventListener('keydown', (e) => e.key === 'Escape' && fechar())
  }
})()
