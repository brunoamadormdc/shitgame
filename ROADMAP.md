# Roadmap de melhorias

## Objetivo

Evoluir o jogo de um protótipo em JavaScript puro para uma base mais estável, legível e fácil de expandir, sem perder a simplicidade do projeto.

## Diagnóstico atual

O projeto funciona como um jogo single-page sem etapa de build aparente, com a lógica principal distribuída entre `js/index.js`, `js/classes/document.js`, `js/classes/players.js`, `js/classes/monsters.js` e um mecanismo de estado baseado em `Proxy`.

Principais sinais encontrados no código:

- Estado, regras de jogo, renderização e eventos estão fortemente acoplados.
- Há manipulação direta de DOM espalhada em várias classes.
- O ciclo do jogo depende de `keydown`, `setInterval`, `setTimeout` e `reload` da página.
- Existem sobras de código experimental ou quebrado no fluxo principal.
- Não há camada clara para configuração, assets, fases, testes ou build.

Exemplos concretos:

- `js/classes/document.js:212` contém um `x` solto no arquivo.
- `js/classes/monsters.js:21` monta `backgroundImage` com string incompleta.
- `js/classes/monsters.js:103` e `js/classes/monsters.js:113` duplicam `removeSomemonsters`.
- `js/classes/players.js:21` e `js/classes/players.js:22` repetem `powers`.
- `js/classes/document.js:40` faz `window.location.reload()` no `resize`.
- `js/classes/proxies.js` mistura atualização visual, regra de negócio e logs de debug dentro do `set` do `Proxy`.

## Prioridades

### Fase 1: estabilização técnica

Objetivo: corrigir problemas estruturais que hoje dificultam qualquer evolução.

- Remover código inválido, duplicado ou morto.
- Corrigir bugs óbvios de string, listeners e fluxo de reinício.
- Eliminar `console.log` de debug e trechos comentados que já não servem.
- Revisar nomes e consistência de propriedades como `lifes`, `safed`, `vilain`.
- Garantir que os listeners não sejam registrados múltiplas vezes a cada reinício.
- Substituir `window.location.reload()` por recálculo de layout e resize controlado.

Entrega sugerida:

- Jogo rodando de forma previsível após game over, level up e resize.
- Código sem erros sintáticos e sem duplicações gritantes.

### Fase 2: separar responsabilidades

Objetivo: reduzir o acoplamento entre engine, UI e estado.

- Criar uma estrutura mínima de módulos:
  - `game/` para regras e loop.
  - `entities/` para player e monsters.
  - `ui/` para HUD, mensagens e renderização.
  - `config/` para tamanhos, velocidades e limites.
- Trocar o `Document` atual por algo com responsabilidade mais clara, como `Game` ou `GameController`.
- Fazer o `Player` e os `Monsters` conhecerem menos o DOM diretamente.
- Trocar o `Proxy` genérico por um estado explícito com funções/métodos de atualização.
- Centralizar criação e remoção de elementos visuais em uma camada única de render.

Entrega sugerida:

- Cada módulo com uma responsabilidade clara.
- Mudanças de regra sem precisar editar 4 arquivos ao mesmo tempo.

### Fase 3: loop de jogo de verdade

Objetivo: sair do modelo dirigido por eventos soltos e ir para uma base de game loop.

- Implementar loop com `requestAnimationFrame`.
- Separar `update()` de `render()`.
- Tratar input com mapa de teclas pressionadas em vez de mover apenas por evento.
- Unificar colisão em uma rotina única por frame.
- Remover `setInterval` por monstro e evitar timers independentes para cada entidade.
- Definir limites do mapa e comportamento ao sair da tela.

Entrega sugerida:

- Movimento mais consistente.
- Colisão previsível.
- Menor custo de CPU à medida que o número de monstros aumenta.

### Fase 4: gameplay e progressão

Objetivo: transformar a lógica atual em um sistema de progressão mais controlado.

- Formalizar estados de jogo: `idle`, `starting`, `playing`, `paused`, `levelComplete`, `gameOver`.
- Definir progressão por fase com parâmetros configuráveis:
  - quantidade de monstros
  - velocidade
  - tamanho
  - chance de item positivo
- Revisar a safe zone e linha de chegada com hitboxes explícitas.
- Criar sistema claro para power-ups, vida, armas e pontuação.
- Balancear dificuldade para que o avanço dependa menos de sorte.
- Considerar padrões de spawn que evitem nascer em cima do jogador ou em áreas injustas.

Entrega sugerida:

- Curva de dificuldade configurável.
- Regras de progressão legíveis em dados, não espalhadas em condicionais.

### Fase 5: UX e interface

Objetivo: melhorar legibilidade e experiência sem mudar o espírito do jogo.

- Melhorar HUD com layout consistente para vida, level, armas e mensagens.
- Trocar mensagens temporárias por componentes reaproveitáveis.
- Adicionar tela inicial, game over e instruções visíveis.
- Implementar suporte real ao `GamePad` ou remover o código inacabado.
- Melhorar feedback visual de dano, coleta, destruição e level up.
- Tornar tamanhos e fontes mais adaptáveis a telas diferentes.

Entrega sugerida:

- Interface coerente em desktop.
- Menos confusão no fluxo “apertar enter / morreu / voltou”.

### Fase 6: responsividade e acessibilidade básica

Objetivo: parar de depender de reload e reduzir fragilidade em diferentes telas.

- Usar unidades e limites mais previsíveis para sprite, HUD e área jogável.
- Recalcular posições e hitboxes em resize sem reiniciar o jogo.
- Verificar contraste, tamanho de texto e áreas clicáveis.
- Adicionar suporte mínimo a mobile ou declarar oficialmente que o jogo é desktop-first.

Entrega sugerida:

- Comportamento consistente em resoluções diferentes.

### Fase 7: qualidade, tooling e manutenção

Objetivo: preparar o projeto para continuar evoluindo sem virar retrabalho.

- Adicionar `package.json` com scripts básicos.
- Incluir ESLint e Prettier.
- Adicionar uma etapa simples de build para CSS, já que existe `css.less`.
- Criar um README com instruções de execução e visão geral da arquitetura.
- Escrever testes unitários para funções puras e regras críticas.
- Escrever pelo menos testes de regressão para colisão, progressão e reset do jogo.

Entrega sugerida:

- Base minimamente profissional para continuar iterando.

## Backlog técnico recomendado

Itens específicos que valem entrar cedo no trabalho:

- Padronizar idioma e nomenclatura do código.
- Substituir “números mágicos” por constantes.
- Evitar `innerHTML` para textos simples.
- Remover dependência de jQuery se ela não estiver sendo usada.
- Encapsular acesso a `window` e `document` nos pontos realmente necessários.
- Registrar entidades ativas em arrays/coleções em vez de propriedades dinâmicas como `this["_newMonster" + id]`.
- Criar uma estratégia clara de cleanup para timers, animações e listeners.

## Ordem sugerida de implementação

1. Corrigir erros estruturais e limpar o código atual.
2. Separar estado, renderização e regras.
3. Introduzir game loop com `requestAnimationFrame`.
4. Reorganizar progressão e colisões em sistemas.
5. Melhorar HUD, telas e feedback visual.
6. Adicionar tooling, lint e testes.

## Resultado esperado

Se esse roadmap for seguido, o projeto sai de um protótipo “feito no flow” para uma base onde fica viável:

- adicionar fases novas,
- balancear dificuldade,
- portar para mobile com menos dor,
- testar sem depender do navegador,
- e refatorar sem quebrar o jogo inteiro.

## Próximo passo recomendado

Começar pela Fase 1 em um pacote curto de refatoração:

- limpeza dos bugs evidentes,
- correção dos listeners,
- remoção do reload no resize,
- e preparação de uma estrutura inicial de estado de jogo.
