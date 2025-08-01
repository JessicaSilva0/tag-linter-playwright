# tag-linter-playwright
[![npm version](https://img.shields.io/npm/v/tag-linter-playwright.svg)](https://www.npmjs.com/package/tag-linter-playwright)
[![Playwright](https://img.shields.io/badge/Playwright-latest-blue.svg)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)



Validador simples para garantir que as tags usadas nos seus testes Playwright estejam corretas e padronizadas.

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
  "lint:tags": "playwright-tag-linter --pattern 'tests/**/*.spec.ts'"
}
```

E rode:
```bash
npm run lint:tags
```

2. Via CLI
```bash
npx playwright-tag-linter --pattern "tests/**/*.spec.ts"

```

##  Arquivo de configuração .tagslintrc.json

Você pode criar um arquivo na raiz do projeto para definir suas regras:

```bash
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
playwright-tag-linter --required "@smoke,@critical"
```

Rodando com verbose para mais detalhes:
```bash
playwright-tag-linter --verbose
```

## Contribuição

Pull requests são bem-vindos! Abra uma [issue](https://github.com/JessicaSilva0/tag-linter-playwright/issues) para discutir melhorias ou bugs.

## Happy Testing 🎭

Feito com 💛 por [Jessica Silva](https://github.com/jessicaSilva0).
