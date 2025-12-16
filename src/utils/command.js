import chalk from "chalk";
import { spawn } from "child_process";
import ora from "ora";

export function runCommand(cwd, cmd, args = [], message) {
    const spinner = ora(message).start();
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, {
            cwd: cwd,
            stdio: "ignore",
            shell: true,
        });

        proc.on("close", (code) => {
            if (code === 0) {
                spinner.succeed(`${message} ${chalk.blue("done")}`)
                resolve();
            } else {
                spinner.fail(`${message} ${chalk.red("failed")}`);
                reject(new Error(`${cmd} exited with code ${code}`));
            };
        });
    })

}