# dev.notes

Uma plataforma desktop para organizar e revisar estudos de programação em um só lugar.

O dev.notes combina flashcards, desafios de código, múltiplas abordagens de solução, sessões de estudo e fluxogramas interativos. A ideia é transformar o estudo em um espaço conectado: um mesmo conteúdo pode ser revisado, implementado e visualizado de diferentes formas.

## Funcionalidades

- Flashcards para revisão de conceitos e perguntas técnicas.
- Revisão organizada por fases e sessões de estudo.
- Desafios de programação com mais de uma abordagem para o mesmo problema.
- Comparação de soluções, complexidade e tempo de execução.
- Fluxogramas interativos para representar algoritmos e raciocínios.
- Blocos redimensionáveis e edição visual de textos, cores e conexões.
- Vínculos entre fases, flashcards, desafios e fluxogramas.
- Persistência local dos dados usando SQLite no aplicativo desktop.
- Execução no navegador como fallback para desenvolvimento.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- React Flow
- Zustand
- Tauri 2
- SQLite
- Rust

## Executar em modo web

Instale as dependências:

```bash
pnpm install
```

Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

Depois acesse o endereço exibido pelo Vite, normalmente:

```text
http://localhost:5173
```

Para gerar a versão web de produção:

```bash
pnpm build
```

## Executar como aplicativo desktop

O projeto utiliza o Tauri para gerar o aplicativo desktop.

```bash
pnpm tauri:dev
```

Esse comando inicia o aplicativo desktop em modo de desenvolvimento.

## Gerar instaladores

Para gerar o executável e os instaladores do Windows:

```bash
pnpm tauri:build
```

Os arquivos são gerados em:

```text
src-tauri/target/release/dev.notes.exe
src-tauri/target/release/bundle/nsis/dev.notes_0.1.0_x64-setup.exe
src-tauri/target/release/bundle/msi/dev.notes_0.1.0_x64_en-US.msi
```

O instalador `.exe` pode ser disponibilizado em uma [GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository).

## Persistência de dados

No aplicativo desktop, os dados são armazenados localmente em SQLite por meio do plugin SQL do Tauri. As migrations criam uma estrutura genérica para armazenar os registros da aplicação.

Durante o desenvolvimento web, o projeto utiliza IndexedDB como fallback. Essa separação permite testar a interface no navegador sem perder a persistência local do aplicativo desktop.

## Organização do projeto

```text
src/
├── @core/       # abstrações compartilhadas e persistência
├── components/  # componentes reutilizáveis da interface
├── features/    # funcionalidades principais do produto
└── ...

src-tauri/
├── src/         # entrypoint Rust e configuração do Tauri
├── icons/       # ícones do aplicativo
└── tauri.conf.json
```

## Objetivo do projeto

O objetivo do dev.notes é unir estudo conceitual e prática de programação em um único ambiente. Em vez de manter anotações, desafios e diagramas separados, cada assunto pode ter seus próprios flashcards, implementações e representações visuais.

## Status

Projeto em desenvolvimento ativo. A estrutura principal de estudo, persistência local, fluxogramas e empacotamento desktop já está implementada, enquanto novas ferramentas de revisão e edição continuam sendo adicionadas.

## Licença

Este projeto está disponível sob a [Licença MIT](LICENSE).
