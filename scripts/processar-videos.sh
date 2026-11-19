#!/usr/bin/env bash
# Vídeos do site a partir de "../0114 - DJ Sky/Recursos Site". Gera em src/assets/video:
#  <nome>-loop.mp4   trecho mudo de 6 s, 9:16 (540x960), pro card do carrossel
#  <nome>.mp4        vídeo inteiro com som, 720p, pro player (abre só no clique)
#  <nome>-capa.jpg   1º quadro do trecho (é o poster do card)
# Uso: bash scripts/processar-videos.sh            (tudo)
#      bash scripts/processar-videos.sh casamento  (só os cards citados, sem os loops fixos)
set -e
V="../0114 - DJ Sky/Recursos Site/MATERIAL COMPLETO/Presskit Sky 2026"
D="../../VIDEOS DRIVE 2026-11-19"   # relativo a $V: os do Drive que o Sky mandou em 2026-11-19
O=src/assets/video
mkdir -p "$O"
# nome | arquivo | início do trecho (s) | filtro antes de tudo (opcional: o festival veio
# gravado deitado e de ponta-cabeça, transpose=2 gira 90° pra esquerda)
lista=(
 "rebola|Clipe de Musicas/REBOLA VAI MALANDRA.mov|96"
 "quinze-anos|Videos_/After Movie- 15 anos/sky - FESTA 15 ANOS HORIZONTAL.mp4|34"
 "casamento-2|Videos_/After Movie - Formatura_/IMG_5933.MOV|12"   # a pasta diz formatura, mas é casamento (o Sky, 2026-11-19)
 "casamento|$D/casamento.mp4|8"
 "quinze-anos-2|$D/quinze-anos-2.mp4|26"
 "festival|$D/festival.mp4|50|transpose=2,"
 "grandes-eventos|$D/grandes-eventos.mp4|16"
 "formatura|$D/formatura.mp4|40"
)
for item in "${lista[@]}"; do
  IFS='|' read -r nome arq ini giro <<< "$item"
  if [ $# -gt 0 ] && [[ ! " $* " =~ " $nome " ]]; then continue; fi
  src="$V/$arq"
  # trecho do card: recorta o centro em 9:16 (os horizontais perdem as laterais)
  ffmpeg -v error -y -ss "$ini" -t 6 -i "$src" -an \
    -vf "${giro}crop='min(iw,ih*9/16)':'min(ih,iw*16/9)',scale=540:960:flags=lanczos,fps=30,format=yuv420p" \
    -c:v libx264 -preset slow -crf 30 -profile:v high -movflags +faststart \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 "$O/$nome-loop.mp4"
  ffmpeg -v error -y -i "$O/$nome-loop.mp4" -frames:v 1 -q:v 3 "$O/$nome-capa.jpg"
  # inteiro: 720 no lado menor
  ffmpeg -v error -y -i "$src" \
    -vf "${giro}scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)':flags=lanczos,fps=30,format=yuv420p" \
    -c:v libx264 -preset slow -crf 27 -profile:v high -movflags +faststart \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -c:a aac -b:a 128k -ac 2 "$O/$nome.mp4"
  echo "ok $nome"
done
[ $# -gt 0 ] && exit 0
# telão (seção O que vem no show) e fundo do CTA: mudos, em loop
ffmpeg -v error -y -i "$V/Videos_/Videos para Telão/Loop/SKY-MOTION-LED.mp4" -an \
  -vf "scale=960:-2:flags=lanczos,fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 28 -movflags +faststart \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 "$O/telao-loop.mp4"
ffmpeg -v error -y -i "$O/telao-loop.mp4" -ss 3.4 -frames:v 1 -q:v 3 "$O/telao-capa.jpg"
ffmpeg -v error -y -ss 20 -t 12 -i "$V/Videos_/After Movie- 15 anos/sky - FESTA 15 ANOS HORIZONTAL.mp4" -an \
  -vf "scale=1280:-2:flags=lanczos,fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 31 -movflags +faststart \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 "$O/cta-loop.mp4"
ffmpeg -v error -y -i "$O/cta-loop.mp4" -frames:v 1 -q:v 4 "$O/cta-capa.jpg"
# música
mkdir -p src/assets/audio
ffmpeg -v error -y -i "$V/Músicas/sky - novidade na area x gol bolinha.wav" -c:a aac -b:a 128k -movflags +faststart src/assets/audio/novidade-na-area.m4a
ls -la "$O" src/assets/audio
# abertura: plano do palco com as colunas SKY (Pernoite, 33,8 s a 36,9 s, entre dois cortes),
# sem as faixas pretas e com o verde girado pro magenta
ffmpeg -v error -y -ss 33.8 -t 3.05 -i "$V/Videos_/Videos para Telão/PlayBack/Pernoite v1.mp4" -an \
  -vf "crop=1920:818:0:130,scale=854:-2:flags=lanczos,hue=h=165:s=1.1,fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 32 -movflags +faststart \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 "$O/abertura.mp4"
