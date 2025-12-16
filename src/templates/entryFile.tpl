import express from "express";
import errorMiddleware from "./middlewares/error.midleware{{ext useTs}}"
import { NODE_PORT, NODE_ENV} from "./utils/env{{ext useTs}}";
import apiRouter from "./routes/api.route{{ext useTs}}";
{{#if useDocs}} import docs from "./docs/route{{ext useTs}}"; {{/if}}
{{#if useCors}} import cors from "cors" {{/if}}
{{#if useHelmet}} import helmet from "helmet" {{/if}}

const app = express();

if(NODE_ENV === "production"){
    app.set("trust proxy", 1);
}

{{#if useHelmet}}
app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);
{{/if}}

{{#if useCors}}
export const corsOptions = {
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'PATCH'],
}
app.use(cors(corsOptions));
{{/if}}

app.use(express.json());

app.get("/", (req, res) => {
    return res.status(200).json({
        message: "Server is running",
        data: null,
    });
});

app.use("/api", apiRouter);
{{#if useDocs}}
docs(app);
{{/if}}

app.use(errorMiddleware.serverRoute());
app.use(errorMiddleware.serverError());

app.listen(NODE_PORT, () => {
    console.log(`Server is running on port: ${NODE_PORT}`);
});