# Roadmap de entretenimento e viralização

## Objetivo

Transformar o jogo em algo mais caótico, memorável e compartilhável, sem perder a simplicidade arcade. A meta não é só “ficar melhor”, e sim aumentar:

- vontade de jogar de novo,
- momentos clippáveis,
- dificuldade justa com histórias para contar,
- identidade visual/comportamental forte,
- e potencial de circulação em redes.

## Princípio central

Hoje o jogo já tem uma base boa de movimentação, poderes, tiros, pickups e progressão. O próximo salto precisa focar menos em arquitetura e mais em sensação de jogo.

O ponto mais importante para começar:

- aumentar o campo de jogo,
- deixar a nave se mover por um espaço maior,
- remover a sensação de “preso na borda da tela”,
- e fazer o mapa parecer uma arena viva, não só um retângulo curto.

Isso sozinho já melhora exploração, fuga, perseguição e leitura das ameaças.

## Fase 1: ampliar o espaço de jogo

Objetivo: dar mais área de manobra e tornar a partida mais cinematográfica.

- Aumentar a área jogável para além do viewport atual.
- Remover os limites rígidos das bordas visíveis.
- Implementar câmera acompanhando a nave ou arena com scroll.
- Fazer pickups, planetas e objetivo ocuparem posições distribuídas nesse espaço maior.
- Reequilibrar velocidades para o mapa ampliado não ficar lento demais.
- Garantir que o HUD continue fixo enquanto o mundo se move por baixo.

Resultado esperado:

- mais espaço para desviar,
- perseguições mais interessantes,
- sensação de jornada dentro da fase,
- e mais variedade de situações emergentes.

## Fase 2: criar momentos “uau”

Objetivo: introduzir eventos que gerem surpresa e clipes curtos.

- Explosões mais chamativas ao destruir planetas.
- Slow motion curto em destruições importantes ou quase morte.
- Efeitos de tela para combos, chain kills e pickups raros.
- “Near miss” quando o player escapa por pouco de raio ou colisão.
- Level up com efeito mais impactante e comemorativo.
- Somente algumas situações especiais devem exagerar o feedback, para não cansar.

Resultado esperado:

- o jogo passa a produzir momentos que o jogador quer mostrar.

## Fase 3: retenção por loop curto

Objetivo: fazer o jogador sempre pensar “vou tentar mais uma”.

- Runs mais rápidas, com dificuldade subindo cedo mas de forma legível.
- Recompensa por sobreviver sob pressão, não só por grind.
- Combos por destruir múltiplos planetas em sequência.
- Multiplicador temporário por risco alto.
- Streak bonus para fases passadas sem tomar dano.
- Pequenas decisões táticas por run: guardar munição, correr pelo objetivo, pegar star, buscar heart.

Resultado esperado:

- mais tensão por minuto,
- menos tempo morto,
- mais replay espontâneo.

## Fase 4: identidade absurda e compartilhável

Objetivo: o jogo ter personalidade própria e reconhecível em 3 segundos de vídeo.

- Dar tema mais forte ao caos do jogo.
- Assumir humor e exagero: nomes de fases, alerts, pickups e mensagens.
- Criar comportamento único para famílias de planetas.
- Adicionar “personagens” de inimigos memoráveis em vez de só variações numéricas.
- Inserir raridades bizarras:
  - planeta covarde,
  - planeta suicida,
  - planeta que ricocheteia,
  - planeta gigante lento que ocupa rota,
  - planeta sniper que telegrapha mais forte.

Resultado esperado:

- o jogo deixa de ser “desvia dos círculos” e vira “aquele jogo maluco dos planetas”.

## Fase 5: progressão de conteúdo com tema

Objetivo: cada faixa de níveis parecer uma era diferente.

- Separar a progressão em blocos temáticos.
- Exemplo:
  - níveis 1-5: sobrevivência básica,
  - 6-10: raios e pressão de mapa,
  - 11-15: tanques de 3 hits,
  - 16-20: caos com respawn forte,
  - 21+: padrões especiais e elite waves.
- Trocar paleta, comportamento, música e alertas por bloco.
- Introduzir mini chefes ocasionais.

Resultado esperado:

- sensação real de avanço,
- curiosidade sobre “o que vem depois”.

## Fase 6: sistemas virais

Objetivo: fazer a internet ajudar a divulgar o jogo.

- Score final muito visível.
- Tela de morte com frase provocativa e share bait.
- Ranking local por navegador para disputa entre amigos.
- Seed diária ou desafio diário.
- Modos rápidos:
  - `1 life challenge`
  - `no shots`
  - `speed demon`
  - `sniper hell`
- Botão simples para copiar resultado em texto.
- Frases automáticas do tipo:
  - “Cheguei no nível 14 e morri pra 3 snipers ao mesmo tempo”
  - “Passei do 10 sem usar star”

Resultado esperado:

- mais print, vídeo curto e competição social.

## Fase 7: legibilidade para caos alto

Objetivo: deixar o caos divertido, não injusto.

- Melhor distinguir perigo imediato de perigo distante.
- Cores e telegraphs mais claros para tipos de tiro.
- Camadas de profundidade visual para separar player, pickup, alvo e ameaça.
- Reduzir poluição visual quando houver muita coisa ao mesmo tempo.
- Criar prioridade clara:
  - o que mata agora,
  - o que é pickup,
  - o que é objetivo,
  - o que é ameaça futura.

Resultado esperado:

- dificuldade alta sem parecer aleatória.

## Fase 8: som, ritmo e sensação de impacto

Objetivo: fazer o jogo parecer vivo mesmo sem assets gigantes.

- Efeitos sonoros curtos para tiro, hit, pickup, almost-death e level up.
- Música dinâmica por intensidade.
- Camadas de áudio que crescem com risco.
- Pausas dramáticas mínimas em eventos especiais.

Resultado esperado:

- muito mais sensação de recompensa com pouco custo de produção.

## Fase 9: modos de jogo para retenção

Objetivo: aumentar tempo de vida do jogo sem depender só do modo principal.

- Modo endless clássico.
- Modo time attack.
- Modo “escape” com arena crescente.
- Modo diário com seed fixa.
- Modo hardcore sem pickups ou sem pause.

Resultado esperado:

- públicos diferentes conseguem motivos diferentes para continuar.

## Fase 10: polimento para lançamento público

Objetivo: preparar o jogo para internet aberta.

- Landing simples com instrução curta e CTA forte.
- Carregamento rápido e responsivo.
- Funcionar bem em desktop antes de expandir para mobile.
- Tela inicial com “play now” imediato.
- Identidade visual consistente entre jogo, logo, thumbnails e fundo.

Resultado esperado:

- primeira impressão forte,
- menos abandono antes da primeira partida.

## Ordem recomendada

1. Expandir o campo de jogo e remover o aprisionamento nas bordas.
2. Melhorar leitura visual e momentos de impacto.
3. Rebalancear progressão para runs curtas e intensas.
4. Criar tipos de inimigo memoráveis e eventos raros.
5. Adicionar score/share/challenge diário.
6. Entrar em áudio, ranking e modos extras.

## Backlog de ideias “virais”

- Kill cam curtíssima em morte absurda.
- Replay instantâneo dos últimos 3 segundos na tela de game over.
- Medalhas ridículas por estilo de jogo.
- Pickup raríssimo que deixa tudo caótico por 10 segundos.
- Evento “rain of planets”.
- Portal falso que pune greed.
- Fases com nomes debochados.
- Narrador/textos de HUD mais agressivos e engraçados.

## Próximo passo recomendado

Começar por um pacote de “macro sensação”:

- ampliar o mapa,
- implementar câmera/arena maior,
- redistribuir objetivo e pickups nesse novo espaço,
- e recalibrar spawn/velocidade para o jogo respirar melhor.

Esse é o ponto com maior impacto imediato em entretenimento.
