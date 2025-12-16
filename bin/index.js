#!/usr/bin/env node

import { Command } from "commander";
import { createProject } from "../src/command/create.js";

const program = new Command();

program
    .name("create")
    .action(async () => {
        await createProject()
    })

program.allowExcessArguments();
program.parse();