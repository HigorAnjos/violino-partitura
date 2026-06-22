# 🎻 Violino — Partitura → Braço + Intervalos

App web estático para estudar escalas de violino. Gera:

1. a **pauta** (pentagrama, clave de Sol) no padrão musical, com grafia enarmônica
   correta (Lab maior sai com bemóis, não sustenidos);
2. o **braço do violino** no estilo do método impresso — 4 cordas (Sol/Ré/Lá/Mi),
   pestana no topo, **dedo** (0–4) e nome de cada nota, cor por **corda solta /
   dedo alto (azul) / dedo baixo (laranja)**, marcadores **T/S** entre posições da
   mesma corda e **setas de troca de corda**;
3. um **PNG** combinando os dois, para baixar e estudar.

### 24 escalas cadastradas

As 24 escalas do método (12 maiores + 12 menores, 2 oitavas, 4 cordas, 1ª posição)
estão em `src/scales.js`, cada uma com **ida (subindo)** e **volta (descendo)**
transcritas do PDF. As menores são melódicas (ida eleva 6ª/7ª; volta usa a menor
natural) — por isso ida e volta são guardadas separadamente, **a volta não é o
inverso da ida**. Escolha no seletor "Escala" + Ida/Volta, ou clique em
**Cadastrar todas as escalas** para salvar as 48 entradas (24 × ida/volta).

Também dá para digitar **notas livres** (seção recolhível) — aí o dedilhado é
calculado por heurística.

### Validar contra o PDF

```bash
npm run validate
```

Confere que cada nota das 24 escalas resolve para uma corda/dedo válidos, que o
pitch é estritamente crescente e que há 15 notas por direção.

As partituras podem ser **salvas** no **Supabase** (ou no navegador, se o Supabase não
estiver configurado) e **buscadas/reabertas** depois pela seção "Partituras salvas"
(com campo de busca por título ou nota e botão **Abrir** que recarrega a partitura).
Hospedável no **GitHub Pages**.

## Rodar local

```bash
npm install
npm run dev      # abre em http://localhost:5173/violino-partitura/
```

Digite as notas (ex: `Si Do# Re# Mi Fa# Sol# La# Si`), clique **Gerar**, depois
**Exportar PNG** (o arquivo cai na pasta de Downloads padrão do navegador — se a sua
já é `D:\Downloads`, é lá que aparece).

> O navegador não escolhe a pasta de destino; o app só controla o **nome** do arquivo
> (`violino_<titulo>_braco_intervalos.png`). Para mandar sempre em `D:\Downloads`,
> deixe essa como a pasta de download padrão do navegador.

## Mapa do braço

A física do braço (qual nota cada dedo produz em cada corda) está em
`public/fingerboard.json`. Os offsets em semitons são derivados da posição:
dedo 0 = solta; dedos 1–4 têm posição baixa/alta (meio-tom). É só editar esse JSON
para ajustar o mapa.

## Supabase (opcional)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode `supabase/schema.sql` (cria a tabela `scores` com RLS
   aberta para uso pessoal).
3. Copie `.env.example` para `.env.local` e preencha:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. Reinicie o `npm run dev`. Sem essas variáveis, o app salva no `localStorage`.

A anon key é pública por design — a segurança vem das policies de RLS. Como a tabela
está aberta, qualquer pessoa com a URL do projeto consegue ler/gravar; suficiente para
uso pessoal. Para restringir, troque as policies por regras baseadas em `auth.uid()`.

## Deploy no GitHub Pages

1. Crie um repositório **com o mesmo nome** usado em `vite.config.js`
   (`base: '/violino-partitura/'`). Se usar outro nome, ajuste o `base` ou deixe o
   workflow definir via `GH_PAGES_BASE` (já configurado).
2. Faça push para a branch `main`.
3. Em **Settings → Pages**, selecione **GitHub Actions** como source.
4. (Opcional) Em **Settings → Secrets and variables → Actions**, adicione
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para o Supabase funcionar no site
   publicado.

O workflow `.github/workflows/deploy.yml` builda e publica automaticamente a cada push.

## Estrutura

```
src/
  notes.js        conversão PT↔EN, semitons, oitavas, intervalos
  fingerboard.js  mapa do braço + nota → corda/dedo (heurística de dedilhado)
  renderStaff.js  pauta via VexFlow (SVG)
  renderNeck.js   braço em SVG custom
  exportImage.js  compõe pauta + braço → PNG
  supabase.js     persistência (Supabase ou localStorage)
  main.js         UI
public/fingerboard.json   mapa do braço
supabase/schema.sql       tabela + RLS
```
