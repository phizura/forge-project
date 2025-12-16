import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        version: 'v1.0',
        title: 'Dokumentasi API',
        description: 'List dokumentasi setiap endpoint yang ada'
    },
    servers: [
        {
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
            }
        },
        schemas: {
        },
        parameters: {
        }
    },
};

const outputFile = './swagger-output.json';
const routes = ['../routes/api.route.js'];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc)