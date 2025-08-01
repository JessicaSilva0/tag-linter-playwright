# tag-linter-playwright
[![npm version](https://img.shields.io/npm/v/tag-linter-playwright.svg)](https://www.npmjs.com/package/tag-linter-playwright)
[![Playwright](https://img.shields.io/badge/Playwright-latest-blue.svg)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)


Validador simples e robusto de tags para testes Playwright, baseado na mesma abordagem do ESLint, usando `@typescript-eslint/parser` para analisar seu código TypeScript ou JavaScript.
Compatível com Playwright, TypeScript e Node.js.

## Instalação

**Dependência local** (recomendado):

```bash
npm install --save-dev tag-linter-playwright
```

**Instalação Global**

```bash
npm install -g tag-linter-playwright
```


## Como utilizar

1. Via script no package.json

Adicione um script:
```bash
"scripts": {
  "lint:tags": "playwright-tag-linter"
}
```

E rode:
```bash
npm run lint:tags
```

Por padrão, o linter procura arquivos de teste que sigam o padrão:

`**/*.{spec,test}.{ts,js}`

Se quiser customizar, use a flag `--pattern`:
```bash
npm run lint:tags --pattern "tests/**/*.spec.ts"
```

2. Via CLI
```bash
npx playwright-tag-linter --pattern "tests/**/*.spec.ts"

```

## .tagslintrc.json

Você pode criar um arquivo `.tagslintrc.json` na raiz do projeto para configurar as regras do validador de tags. O linter usará essas configurações para validar seus testes e exibirá os respectivos avisos e erros conforme as regras definidas.

Exemplo:

```json
{
  "testPattern": "**/*.{spec,test}.{ts,js}",
  "exclude": ["node_modules/**", "dist/**", "coverage/**", ".git/**"],
  "requiredTags": ["@smoke", "@regression"],
  "tagPattern": "^@[a-zA-Z0-9-_]+$",
  "rules": {
    "require-tags": "error",
    "valid-tag-format": "warn",
    "required-tags-present": "warn"
  },
  "tagCategories": {
    "priority": ["@critical", "@high", "@medium", "@low", "@lowest"],
    "type": ["@smoke", "@regression", "@functional", "@api", "@visual"],
    "environment": ["@dev", "@staging", "@uat"]
  }
}
```

## Exemplos

```bash
npx playwright-tag-linter --required "@smoke,@critical"
```

Rodando com verbose para mais detalhes:
```bash
npx playwright-tag-linter --verbose
```

## Contribuição

Pull requests são bem-vindos! Abra uma [issue](https://github.com/JessicaSilva0/tag-linter-playwright/issues) para discutir melhorias ou bugs.

## Happy Testing 🎭

Feito com 💛 por [Jessica Silva](https://github.com/jessicaSilva0).
