{{#if useTs}}
import { NextFunction, Request, Response } from "express";
{{/if}}
import response from "../utils/response{{ext useTs}}";


export default {
    serverRoute() {
        {{#if useTs}}
        return (req: Request, res: Response, next: NextFunction) => {
        {{else}}
        return (req, res, next) => {
        {{/if}}
            response.notFound(res, "Route not found");
        };
    },
    serverError() {
        {{#if useTs}}
        return (error: Error, req: Request, res: Response, next: NextFunction) => {
        {{else}}
        return (error, req, res, next) => {
        {{/if}}
            response.error(res, error, error.message);
        };
    },
};
