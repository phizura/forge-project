import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOutput = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "./swagger-output.json"), "utf8")
);

export default function docs(app) {
    const css = fs.readFileSync(
        path.resolve(
            __dirname,
            "../../node_modules/swagger-ui-dist/swagger-ui.css"
        ),
    );

    app.use(
        "/api-docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerOutput, {
            customCss: css,
        })
    );
}