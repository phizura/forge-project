{{#if useTs}}
import { Response } from "express";
{{/if}}

export default {
    {{#if useTs}}
    success(res: Response, data: any, message: string, status: number = 200) {
    {{else}}
    success(res, data, message, status = 200) {
    {{/if}}
        res.status(status).json({
            meta: {
                status,
                message,
            },
            data,
        });
    },

    {{#if useTs}}
    error(res: Response, error: unknown, message: string) {
     if ((error as any)?.code) {
    const _err = error as any;
    {{else}}
    error(res, error, message) {
     if (error?.code) {
    const _err = error;
    {{/if}}
            return res.status(500).json({
                meta: {
                    status: 500,
                    message: _err?.errorResponse?.errmsg || _err.message || 'Internal Server Error',
                },
                data: null
            });
        }
        res.status(500).json({
            meta: {
                status: 500,
                message,
            },
            data: null
        });
    },

    {{#if useTs}}
    notFound(res: Response, message: string = "not found") {
    {{else}}
    notFound(res, message = "not found") {
    {{/if}}
        res.status(404).json({
            meta: {
                status: 404,
                message,
            },
            data: null,
        });
    },
    {{#if useTs}}
    unauthorized(res: Response, message: string = "unauthorized") {
    {{else}}
    unauthorized(res, message = "unauthorized") {
    {{/if}}
        res.status(401).json({
            meta: {
                status: 401,
                message,
            },
            data: null,
        });
    },
    {{#if useTs}}
    forbidden(res: Response, message: string = "forbidden") {
    {{else}}
    forbidden(res, message = "forbidden") {
    {{/if}}
        res.status(403).json({
            meta: {
                status: 403,
                message,
            },
            data: null,
        });
    },
}