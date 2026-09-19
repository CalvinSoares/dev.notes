# dunots
<img width="1435" height="656" alt="image" src="https://github.com/user-attachments/assets/df362204-e9e8-499b-93db-020b15d12936" />

Uma plataforma desktop para organizar e revisar estudos de programação em um só lugar.

O dunots combina flashcards, desafios de código, múltiplas abordagens de solução, sessões de estudo e fluxogramas interativos. A ideia é transformar o estudo em um espaço conectado: um mesmo conteúdo pode ser revisado, implementado e visualizado de diferentes formas.

## Funcionalidades

- Flashcards para revisão de conceitos e perguntas técnicas.
- Revisão organizada por fases e sessões de estudo.
- Desafios de programação com mais de uma abordagem para o mesmo problema.
- Comparação de soluções, complexidade e tempo de execução.
- Fluxogramas interativos para representar algoritmos e raciocínios.
- Blocos redimensionáveis e edição visual de textos, cores e conexões.
- Vínculos entre fases, flashcards, desafios e fluxogramas.
- Roadmaps de estudos com tópicos, subtópicos, anotações e progresso.
- Importação de editais por texto ou PDF, com preview antes da criação da trilha.
- Reconhecimento de partes, seções numeradas, listas e níveis de indentação.
- Vínculo entre tópicos da trilha, flashcards e questões de simulados.
- Sessões de estudo e simulados filtrados pelos materiais da trilha.
- Indicadores de flashcards revisados e questões respondidas por tópico.
- Banco de questões com importação de provas, gabaritos e versões de prova.
- Persistência local dos dados usando SQLite no aplicativo desktop.
- Execução no navegador como fallback para desenvolvimento.

## Roadmaps de estudos

Os roadmaps permitem transformar um edital em uma trilha de estudo organizada. Cada trilha pode conter tópicos e subtópicos, com checkbox de conclusão, anotações privadas e materiais vinculados.

Para importar um edital:

1. Abra `Roadmaps` na barra lateral.
2. Clique em `importar edital`.
3. Informe o nome da trilha.
4. Selecione um PDF textual ou cole o conteúdo do edital.
5. Revise o preview hierárquico.
6. Clique em `criar trilha`.

O importador reconhece estruturas como `PARTE 1`, seções numeradas, listas e indentação. Quando uma trilha já estiver selecionada, os tópicos são adicionados a ela; caso contrário, uma nova trilha é criada automaticamente.

PDFs escaneados, sem texto selecionável, podem exigir OCR antes da importação.

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
src-tauri/target/release/dunots.exe
src-tauri/target/release/bundle/nsis/dunots_0.1.0_x64-setup.exe
src-tauri/target/release/bundle/msi/dunots_0.1.0_x64_en-US.msi
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

O objetivo do dunots é unir estudo conceitual e prática de programação em um único ambiente. Em vez de manter anotações, desafios e diagramas separados, cada assunto pode ter seus próprios flashcards, implementações e representações visuais.

## Status

Projeto em desenvolvimento ativo. A estrutura principal de estudo, persistência local, fluxogramas e empacotamento desktop já está implementada, enquanto novas ferramentas de revisão e edição continuam sendo adicionadas.

## Licença

Este projeto está disponível sob a [Licença MIT](LICENSE).
