"""
Separa o fundo do hero (ChatGPT, 2026-11-18) em duas camadas pra animar:
  insumos/<nome>-base.png  o fundo bem desfocado (só a luz difusa e o halo)
  insumos/<nome>-seda.png  as faixas de seda, com transparência pelo brilho
A seda isolada que o ChatGPT gerou veio serrilhada; tirar do próprio fundo deixa as duas
camadas casando no lugar quando a seda está parada. Também zera a cor escondida no
transparente do recorte do Sky (memória png-recorte-cor-escondida).
Uso: python scripts/camadas-hero.py
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
REC = RAIZ.parent / '0114 - DJ Sky' / 'Recursos Site' / 'chatgpt'
OUT = RAIZ / 'insumos'

def camadas(origem, nome):
    im = Image.open(REC / origem).convert('RGB')
    base = im.filter(ImageFilter.GaussianBlur(im.width / 22))
    a = np.asarray(im).astype(np.float32)
    b = np.asarray(base).astype(np.float32)
    # o que a seda soma em cima da luz difusa
    dif = np.clip(a - b * 0.92, 0, 255)
    lum = dif.max(axis=2)
    alfa = np.clip((lum - 6) / 120, 0, 1) ** 0.9
    cor = np.where(alfa[..., None] > 0.02, np.clip(b + (a - b) / np.maximum(alfa[..., None], 1e-3), 0, 255), 0)
    rgba = np.dstack([cor, alfa * 255]).round().astype(np.uint8)
    rgba[alfa < 0.004] = 0
    Image.fromarray(rgba, 'RGBA').save(OUT / f'{nome}-seda.png')
    base.save(OUT / f'{nome}-base.png')
    print(nome, im.size)

camadas('1-fundo-hero.png', 'hero')
camadas('3-fundo-hero-mobile.png', 'hero-celular')

sky = np.asarray(Image.open(OUT / 'sky-mascara-birefnet.png').convert('RGBA')).copy()
sky[sky[..., 3] < 2] = 0
Image.fromarray(sky, 'RGBA').save(OUT / 'sky-recorte.png')
print('sky ok')
