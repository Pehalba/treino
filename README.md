# Treinos — Pedro & Carol

Aplicativo fitness mobile-first para treinos, progressão, calorias, dietas, peso e relatórios.

## Stack

- React + Vite + TypeScript
- Firebase Authentication, Cloud Firestore e Storage
- Cache offline do Firestore + cópia local do treino em andamento

## Como rodar

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com).
2. Ative **Authentication** (provedor **Anônimo**; e-mail/senha é opcional), **Firestore** e **Storage**.
3. Copie as regras:

```bash
firebase deploy --only firestore:rules,storage
```

Os arquivos estão em `firestore.rules` e `storage.rules`.

4. Copie as variáveis de ambiente:

```bash
cp .env.example .env
```

Preencha com as chaves web do Firebase.

5. Instale e inicie:

```bash
npm install
npm run dev
```

## Primeiro uso

Abra o app. Não precisa criar conta.

Pedro e Carol já aparecem no seletor do topo. Toque no nome para trocar. Cada perfil tem treinos, dieta, calorias e peso separados.

A sessão fica salva neste aparelho. Para outro celular, use o código do grupo em Perfil.

Os dados nunca se misturam: tudo é gravado com `profileId` e `householdId`.

## Importar treinos e dietas reais

Os exercícios e a dieta atuais são placeholders. Quando você tiver os dados reais, importe um JSON no perfil. O formato está em `public/import-example.json`.

## Experiência principal

Abrir → escolher perfil → escolher treino → **Iniciar** → um exercício por vez → registrar carga e reps → o app salva na hora → descanso → próximo → finalizar → relatórios.

## Estrutura

```
src/
  components/     UI e layout
  features/       telas
  services/       regras de negócio
  repositories/   Firestore
  hooks/ utils/ types/ firebase/
```
