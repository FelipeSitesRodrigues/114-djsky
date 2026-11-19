// abertura: some do layout quando termina de subir (e o vídeo para e solta o arquivo), pra
// não ficar uma camada fixa por cima
;(() => {
  const a = document.querySelector('[data-abertura]')
  if (!a || !document.documentElement.classList.contains('abre')) return
  const fim = () => {
    if (a.classList.contains('acabou')) return
    a.classList.add('acabou')
    const v = a.querySelector('video')
    if (v) {
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
  }
  a.addEventListener('animationend', (e) => e.target === a && fim())
  setTimeout(fim, 2600)
})()
