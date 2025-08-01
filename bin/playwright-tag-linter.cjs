#!/usr/bin/env node

const { readFileSync } = require("fs");
const { sync } = require("glob");
const { parse } = require("@typescript-eslint/parser");
const process = require("process");

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
  reset: "\x1b[0m",
};

class PlaywrightTagLinter {
  constructor(options = {}) {
    this.options = {
      testPattern: options.testPattern || "**/*.{spec,test}.{ts,js}",
      exclude: options.exclude || ["node_modules/**", "dist/**", "coverage/**"],
      requiredTags: options.requiredTags || [],
      tagPattern: options.tagPattern || /^@[\w\-]+$/,
      verbose: options.verbose || false,
      ...options,
    };

    this.errors = [];
    this.warnings = [];
    this.filesChecked = 0;
    this.testsWithTags = 0;
    this.testsWithoutTags = 0;
  }

  analyzeFile(filePath) {
    const content = readFileSync(filePath, "utf-8");

    try {
      const ast = parse(content, {
        sourceType: "module",
        ecmaVersion: 2022,
        loc: true,
        range: true,
      });

      this.visitAST(ast, filePath);
    } catch (parseError) {
      console.error(`${colors.red}Error parsing ${filePath}: ${parseError.message}${colors.reset}`);
    }
  }

  visitAST(ast, filePath) {
    const visit = (node) => {
      if (
        node.type === "CallExpression" &&
        node.callee &&
        node.callee.type === "Identifier" &&
        ["test", "it"].includes(node.callee.name)
      ) {
        this.validateTest(node, filePath);
      }

      for (const key in node) {
        if (node[key] && typeof node[key] === "object") {
          if (Array.isArray(node[key])) {
            node[key].forEach((child) => {
              if (child && typeof child === "object" && child.type) {
                visit(child);
              }
            });
          } else if (node[key].type) {
            visit(node[key]);
          }
        }
      }
    };

    visit(ast);
    this.filesChecked++;
  }

  validateTest(node, filePath) {
    const testName = this.getTestName(node);
    const testConfig = this.getTestConfig(node);
    const location = `${filePath}:${node.loc.start.line}:${node.loc.start.column}`;

    if (this.options.verbose) {
      console.log(`${colors.gray}Analyzing test: ${testName}${colors.reset}`);
    }

    if (!testConfig) {
      this.errors.push({
        file: filePath,
        line: node.loc.start.line,
        column: node.loc.start.column,
        testName,
        message: `Test without tags: "${testName}"`,
        location,
      });
      this.testsWithoutTags++;
      return;
    }

    const tags = this.extractTags(testConfig);

    if (!tags || tags.length === 0) {
      this.errors.push({
        file: filePath,
        line: node.loc.start.line,
        column: node.loc.start.column,
        testName,
        message: `Test without tags: "${testName}"`,
        location,
      });
      this.testsWithoutTags++;
    } else {
      this.testsWithTags++;

      if (this.options.verbose) {
        console.log(`${colors.green}  Tags found: ${tags.join(", ")}${colors.reset}`);
      }

      const invalidTags = tags.filter((tag) => !this.options.tagPattern.test(tag));
      if (invalidTags.length > 0) {
        this.warnings.push({
          file: filePath,
          line: node.loc.start.line,
          column: node.loc.start.column,
          testName,
          message: `Invalid tag format: ${invalidTags.join(", ")}`,
          location,
          tags,
        });
      }

      if (this.options.requiredTags.length > 0) {
        const missingRequired = this.options.requiredTags.filter((required) => !tags.includes(required));
        if (missingRequired.length > 0) {
          this.warnings.push({
            file: filePath,
            line: node.loc.start.line,
            column: node.loc.start.column,
            testName,
            message: `Missing required tags: ${missingRequired.join(", ")}`,
            location,
          });
        }
      }
    }
  }

  getTestName(node) {
    if (node.arguments && node.arguments.length > 0) {
      const firstArg = node.arguments[0];
      if (firstArg.type === "Literal" || firstArg.type === "StringLiteral") {
        return firstArg.value;
      }
      if (firstArg.type === "TemplateLiteral" && firstArg.quasis.length > 0) {
        return firstArg.quasis[0].value.raw;
      }
    }
    return "unnamed test";
  }

  getTestConfig(node) {
    if (node.arguments && node.arguments.length >= 2) {
      const secondArg = node.arguments[1];
      if (secondArg.type === "ObjectExpression") {
        return secondArg;
      }
    }
    return null;
  }

  extractTags(configNode) {
    const tagProperty = configNode.properties.find((prop) => {
      if (prop.type === "Property") {
        if (prop.key.type === "Identifier" && prop.key.name === "tag") {
          return true;
        }
        if (prop.key.type === "Literal" && prop.key.value === "tag") {
          return true;
        }
      }
      return false;
    });

    if (!tagProperty) {
      return null;
    }

    const tags = [];
    const value = tagProperty.value;

    if (value.type === "Literal" || value.type === "StringLiteral") {
      tags.push(value.value);
    } else if (value.type === "ArrayExpression") {
      value.elements.forEach((element) => {
        if (element && (element.type === "Literal" || element.type === "StringLiteral")) {
          tags.push(element.value);
        }
      });
    }

    return tags;
  }

  async run() {
    const files = sync(this.options.testPattern, {
      ignore: this.options.exclude,
    });

    if (files.length === 0) {
      console.log("No test files found.");
      console.log(`Pattern used: ${this.options.testPattern}`);
      return 0;
    }

    files.forEach((file) => {
      try {
        this.analyzeFile(file);
      } catch (error) {
        console.error(`${colors.red}Error analyzing ${file}: ${error.message}${colors.reset}`);
      }
    });

    this.printResults();

    return this.errors.length > 0 ? 1 : 0;
  }

  printResults() {
    if (this.errors.length === 0 && this.warnings.length === 0) {
      return;
    }

    console.log("");

    this.errors.forEach((error) => {
      console.log(`${error.location}`);
      console.log(`  ${colors.red}error${colors.reset}  ${error.message}`);
      console.log("");
    });

    this.warnings.forEach((warning) => {
      console.log(`${warning.location}`);
      console.log(`  ${colors.yellow}warning${colors.reset}  ${warning.message}`);
      console.log("");
    });

    const problemCount = this.errors.length + this.warnings.length;
    const errorText = this.errors.length === 1 ? "error" : "errors";
    const warningText = this.warnings.length === 1 ? "warning" : "warnings";

    if (this.errors.length > 0 && this.warnings.length > 0) {
      console.log(
        `${colors.red}✖ ${problemCount} problems (${this.errors.length} ${errorText}, ${this.warnings.length} ${warningText})${colors.reset}`,
      );
    } else if (this.errors.length > 0) {
      console.log(`${colors.red}✖ ${this.errors.length} ${errorText}${colors.reset}`);
    } else if (this.warnings.length > 0) {
      console.log(`${colors.yellow}⚠ ${this.warnings.length} ${warningText}${colors.reset}`);
    }
  }
}

const isMain = require.main === module;

if (isMain) {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--pattern":
        options.testPattern = args[++i];
        break;
      case "--exclude":
        options.exclude = args[++i].split(",");
        break;
      case "--required":
        options.requiredTags = args[++i].split(",");
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Playwright Tag Linter

Usage: playwright-tag-linter [options]

Options:
  --pattern <glob>     Pattern to find test files (default: **/*.{spec,test}.{ts,js})
  --exclude <paths>    Paths to exclude, comma separated (default: node_modules,dist,coverage)
  --required <tags>    Required tags, comma separated (e.g., @smoke,@regression)
  -v, --verbose        Show analysis details
  -h, --help           Show this help

Examples:
  playwright-tag-linter
  playwright-tag-linter --pattern "tests/**/*.spec.ts"
  playwright-tag-linter --required "@smoke,@critical"
        `);
        process.exit(0);
    }
  }

  const linter = new PlaywrightTagLinter(options);
  linter.run().then((exitCode) => {
    process.exit(exitCode);
  });
}

module.exports = PlaywrightTagLinter;
