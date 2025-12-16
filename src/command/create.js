import chalk from 'chalk';
import prompts from 'prompts';
import ProjectService from '../services/project.service.js';
import { runCommand } from '../utils/command.js';

const quetions = [
    {
        type: "text",
        name: "name",
        message: "What is your project name?",
        initial: "my-app-gweh"
    },
    {
        type: "text",
        name: "entryFile",
        message: "What should be your main entry file name?",
        initial: "index"
    },
    {
        type: "toggle",
        name: "useSrc",
        message: `Would you like to place your code inside a ${chalk.blue("`src/` folder?")}`,
        initial: true,
        active: 'Yes',
        inactive: 'No',
    },
    {
        type: "toggle",
        name: "useTs",
        message: `Would you like to use ${chalk.blue('TypeScript')}?`,
        initial: false,
        active: 'Yes',
        inactive: 'No',
    },
    {
        type: "toggle",
        name: "useDocs",
        message: `Add ${chalk.blue("Swagger docs")} for your API endpoints?`,
        initial: false,
        active: 'Yes',
        inactive: 'No',
    },
    // {
    //     type: "toggle",
    //     name: "useDocker",
    //     message: `Setup ${chalk.blue("Dockerfile and compose")} config for easy deploy?`,
    //     initial: false,
    //     active: 'Yes',
    //     inactive: 'No',
    // },
    {
        type: 'multiselect',
        name: 'extraTools',
        message: 'Select additional tools to include:',
        choices: [
            { value: "axios", title: "Axios" },
            { value: "cors", title: "Cors" },
            { value: "winston", title: "Winston" },
            { value: "zod", title: "Zod" },
            { value: "helmet", title: "Helmet" },
        ],
        initial: 1,
        hint: '⚠️  Heads up: Any tools you select here will be automatically configured inside the `/utils` folder or `/root` file project.'
    },
]

export async function createProject() {
    console.clear();

    const answers = await prompts(quetions, {
        onCancel: () => {
            console.log(chalk.red('\n❌ Operation cancelled by user'));
            process.exit(0);
        }
    });

    const projectService = new ProjectService();
    projectService.create(answers)
        .then(async (result) => {
            console.log(`Creating a new express project in ${chalk.green(result)}\n`);

            await runCommand(result, "npm install", [], "📦 Installing dependencies");
            await runCommand(result, "git init", [], "🔧 Initializing Git repository");

            Promise.resolve(console.log(`\nCreated a new express project in ${chalk.green(result)}`));
        })
        .catch(error => {
            console.log(error);
        });
}

