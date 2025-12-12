CHANGELOG.md

Todas as mudanças importantes deste projeto serão documentadas neste arquivo.
Formato baseado no modelo Keep a Changelog.

[0.0.5] – Em desenvolvimento
Added

Sistema completo de projeção multi-monitor:

Seleção de monitor para exibição

Abertura da janela de projeção diretamente no monitor escolhido

Modo fullscreen real controlado pelo operador

Alternância dinâmica entre:

Janela sem bordas (frameless)

Janela com bordas padrão do Windows / Linux / macOS

Moldura de projeção sincronizada entre Operador e Projeção:

O topo projetado corresponde sempre ao topo da moldura azul

Redimensionamento somente pela borda inferior

Moldura reposicionável verticalmente

Molduras independentes por página

Sistema de mini-prévia nas colunas “Página anterior” e “Página seguinte”

Prevenção de seleção de texto durante a projeção (mais estabilidade)

Atualização completa dos READMEs (PT / IT / EN)

Improved

Controle de paginação por zoom mais preciso e suave

Navegação entre páginas conserva moldura personalizada

Código do Operador reorganizado e otimizado

Integração IPC consolidada (preview / live)

Redução de latência na projeção via requestAnimationFrame

Fixed

Borda de janela agora reaparece corretamente quando ativada

Fullscreen não deslocava corretamente a janela no monitor selecionado

Moldura às vezes ultrapassava os limites da página

Resizing em páginas de prévia agora funciona com controle centralizado

Correção de dependências e scripts de build

[0.0.4] – 2025-02
Added

Suporte inicial à projeção de textos litúrgicos

Moldura azul com:

Movimentação vertical

Redimensionamento inferior

Envio Live e Preview funcionando com throttling

Zoom progressivo do texto

Estrutura inicial para mini-prévia de páginas

Improved

Melhor organização do código do Operador

Melhorias no cálculo de paginação

Interface mais estável durante a edição de texto

Fixed

Problemas de renderização ao trocar de canto

Ajuste do tamanho padrão da moldura

Correção de erros ao salvar texto de cantos

[0.0.3] – 2024-12
Added

Sistema de listas de canto unificado

Exportação para PDF

Estrutura inicial do app usando Vite + React

Janela de Operador e janela de Projeção independentes

Salvamento de textos de canto em arquivos JSON

Improved

Interface reorganizada para mais clareza

Código atualizado para React 18

Fixed

Ajustes iniciais de build e rotas

[0.0.1 – 0.0.2] – 2024

Versões experimentais internas com:

Prototipação da interface

Testes com Electron e React

Primeiras rotas, componentes e salvamento local