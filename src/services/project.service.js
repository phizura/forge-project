import fs from 'fs-extra';
import { getLatestVersion } from '../utils/version.js';
import Handlebars from "handlebars";
import path from "path";
import { fileURLToPath } from 'url';

export default class ProjectService {
    constructor(projectDir = null) {
        this.projectDir = projectDir;
        this.entryFilePath = null;
        this.answers = null;
        this.__filename = fileURLToPath(import.meta.url);
        this.__dirname = path.dirname(this.__filename);
    }
    async create(answers) {
        if (!answers) throw new Error('Answer cant be null or undefined');
        this.answers = answers;
        this.fileFormat = answers.useTs ? "ts" : "js";
        this.entryFilePath = `${answers.useSrc ? "src/" : ""}${answers.entryFile}.${this.fileFormat}`
        this.projectDir = `./${answers.name}`;
        this.relativePath = `${this.projectDir}${answers.useSrc ? "/src" : ""}`;
        this.projectName = [".", ".."].includes(answers.me) ? path.basename(path.resolve(answers.name)) : answers.name;

        try {
            await fs.ensureDir(this.relativePath);
            const processBuild = [
                this.buildScaffoldFolder(),
                this.buildPackage(),
                this.buildEnv(),
                this.buildEntryFile(),
                fs.outputFile(`${this.projectDir}/.gitignore`, "node_modules\n.env"),
            ]
            if (answers.useTs) processBuild.push(this.buildTsConfig());
            await Promise.all(processBuild);

            return path.resolve(this.projectDir);
        } catch (error) {
            fs.removeSync(this.projectDir);
            throw new Error(`Project creation aborted: ${error.message}`);
        }
    }

    async buildScaffoldFolder() {
        const ensureDirPromises = [
            fs.ensureDir(`${this.relativePath}/controllers`),
            fs.ensureDir(`${this.relativePath}/libs`),
            fs.ensureDir(`${this.relativePath}/middlewares`),
            fs.ensureDir(`${this.relativePath}/models`),
            fs.ensureDir(`${this.relativePath}/routes`),
            fs.ensureDir(`${this.relativePath}/services`),
            fs.ensureDir(`${this.relativePath}/utils`)
        ]
        if (this.answers.useDocs) ensureDirPromises.push(fs.ensureDir(`${this.relativePath}/validations`));
        await Promise.all(ensureDirPromises);
    }

    async buildPackage() {
        const { useTs, useDocs, extraTools, entryFile, useSrc, name } = this.answers;
        const entryFilePath = this.entryFilePath;
        const dependenciesPromise = [
            getLatestVersion("express"),
            getLatestVersion("dotenv"),
        ];
        const devDependenciesPromise = [
            getLatestVersion("nodemon")
        ];

        if (useTs) {
            devDependenciesPromise.push(getLatestVersion("typescript"));
            devDependenciesPromise.push(getLatestVersion("ts-node"));
            devDependenciesPromise.push(getLatestVersion("@types/express"));
            devDependenciesPromise.push(getLatestVersion("@types/node"));
        }

        if (useDocs) {
            dependenciesPromise.push(getLatestVersion("swagger-ui-express"));
            devDependenciesPromise.push(getLatestVersion("swagger-autogen"));
            if (useTs) devDependenciesPromise.push(getLatestVersion("@types/swagger-ui-express"));
        }

        for (const tool of extraTools) {
            const pkg = await getLatestVersion(tool);
            if (pkg) dependenciesPromise.push(Promise.resolve(pkg));

            if (useTs && !pkg?.hasTypes) {
                devDependenciesPromise.push(getLatestVersion(`@types/${tool}`));
            }
        }

        const dependenciesRaw = await Promise.allSettled(dependenciesPromise);
        const devDependenciesRaw = await Promise.allSettled(devDependenciesPromise);

        const dependencies = Object.fromEntries(
            dependenciesRaw
                .filter(result => result.status === "fulfilled" && result.value)
                .map(result => [result.value.name, result.value.version])
        );
        const devDependencies = Object.fromEntries(
            devDependenciesRaw
                .filter(result => result.status === "fulfilled" && result.value)
                .map(result => [result.value.name, result.value.version])
        );

        const scripts = {
            dev: `nodemon ${entryFilePath}`,
            start: `node ${useTs ? `dist/${entryFile}.ts` : entryFilePath}`,
            ...(useTs && { build: "tsc" }),
            ...(useDocs && { docs: `${useTs ? "ts-node" : "node"} ${useSrc ? "src/" : ""}docs/swagger.${this.fileFormat}` }),
        };

        const jsonContent = {
            name: this.projectName,
            version: "1.0.0",
            description: "",
            main: entryFilePath,
            scripts,
            keywords: [],
            author: "",
            type: "module",
            license: "ISC",
            dependencies,
            devDependencies,
        };

        await fs.outputJson(`${this.projectDir}/package.json`, jsonContent, { spaces: 2 });

        return jsonContent;
    }

    async buildEnv() {
        const envExampleContent = `
            
        `;
        const envContent = `import { config } from 'dotenv';
config({ quiet: true });

export const NODE_NAME = process.env.NODE_NAME || "";
export const NODE_ENV = process.env.NODE_ENV || "";
export const NODE_PORT = process.env.NODE_PORT || "";
        `;
        await Promise.all([
            this.#compileFileTemplate({
                templatePath: path.resolve(this.__dirname, "../templates/env.tpl"),
                outputPath: `${this.projectDir}/.env`,
                compileKeys: {
                    projectName: this.projectName,
                    envNode: "local",
                    envPort: 3000,
                },
            }),
            this.#compileFileTemplate({
                templatePath: path.resolve(this.__dirname, "../templates/env.tpl"),
                outputPath: `${this.projectDir}/.env.example`
            }),
            fs.outputFile(`${this.relativePath}/utils/env.${this.fileFormat}`, envContent)
        ]);
    }

    async buildTsConfig() {
        const { useSrc } = this.answers;
        const tsConfigContent = {
            compilerOptions: {
                target: "ES2020",
                module: "ES2020",
                moduleResolution: "Node",
                esModuleInterop: true,
                rootDir: useSrc ? "src" : ".",
                outDir: "dist",
                strict: true,
                forceConsistentCasingInFileNames: true,
            },
            include: [useSrc ? "src/**/*.ts" : "**/*.ts"],
            exclude: ["node_modules"],
        };

        await fs.outputJson(`${this.projectDir}/tsconfig.json`, tsConfigContent, { spaces: 2 });
    }

    async buildEntryFile() {
        const { useTs, useDocs, extraTools } = this.answers;

        if (useDocs) {
            await this.buildDocs();
        }
        await Promise.all([
            this.#compileFileTemplate({
                templatePath: path.resolve(this.__dirname, "../templates/entryFile.tpl"),
                outputPath: `${this.projectDir}/${this.entryFilePath}`,
                compileKeys: {
                    useTs,
                    useDocs,
                    useCors: extraTools.includes("cors"),
                    useHelmet: extraTools.includes("helmet")
                },
            }),
            this.#compileFileTemplate({
                templatePath: path.resolve(this.__dirname, "../templates/error-middleware.tpl"),
                outputPath: `${this.relativePath}/middlewares/error.midleware.${this.fileFormat}`,
                compileKeys: { useTs },
            }),
            fs.copyFile(path.resolve(this.__dirname, "../templates/routers-api.tpl"), `${this.relativePath}/routes/api.route.${this.fileFormat}`),
            this.#compileFileTemplate({
                templatePath: path.resolve(this.__dirname, "../templates/utils-response.tpl"),
                outputPath: `${this.relativePath}/utils/response.${this.fileFormat}`,
                compileKeys: { useTs },
            }),
        ]);
    }

    async buildDocs() {
        await fs.copy(path.resolve(this.__dirname, '../templates/docs'), `${this.relativePath}/docs`);
        if (this.answers.useTs) {
            const entries = await fs.readdir(`${this.relativePath}/docs`, { withFileTypes: true });

            for (const entry of entries) {
                fs.rename(`${entry.path}/${entry.name}`, `${entry.path}/${entry.name.split(".")[0]}.ts`);
            }
        }
    }

    async #compileFileTemplate({ templatePath, outputPath, compileKeys = {} }) {
        templatePath = path.resolve(this.__dirname, templatePath);
        const template = await fs.readFile(templatePath, "utf-8");

        Handlebars.registerHelper("ext", (useTs) => (useTs ? "" : ".js"));
        const compiled = Handlebars.compile(template);
        const result = compiled(compileKeys);
        await fs.outputFile(outputPath, result);
    }
}