import { Router } from "express"
import type { FlowwatchOpenApiConfig } from "../types/index.js"

const AUTH_PATHS: Record<string, unknown> = {
    "/auth/register": {
        post: {
            tags: ["Auth"],
            summary: "Register a new user",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email", "password"],
                            properties: {
                                email: { type: "string", format: "email" },
                                password: { type: "string", minLength: 8 },
                                name: { type: "string" },
                            },
                        },
                    },
                },
            },
            responses: {
                201: { description: "User created. Verification email sent." },
                409: { description: "Email already in use" },
            },
        },
    },
    "/auth/login": {
        post: {
            tags: ["Auth"],
            summary: "Login with email and password",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email", "password"],
                            properties: {
                                email: { type: "string", format: "email" },
                                password: { type: "string" },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "Login successful",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    accessToken: { type: "string" },
                                    refreshToken: { type: "string" },
                                },
                            },
                        },
                    },
                },
                401: { description: "Invalid credentials" },
            },
        },
    },
    "/auth/logout": {
        post: {
            tags: ["Auth"],
            summary: "Logout (invalidate refresh token)",
            security: [{ bearerAuth: [] }],
            responses: { 200: { description: "Logged out" } },
        },
    },
    "/auth/refresh": {
        post: {
            tags: ["Auth"],
            summary: "Exchange a refresh token for a new access token",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["refreshToken"],
                            properties: { refreshToken: { type: "string" } },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "New tokens issued",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    accessToken: { type: "string" },
                                    refreshToken: { type: "string" },
                                },
                            },
                        },
                    },
                },
                401: { description: "Invalid or expired refresh token" },
            },
        },
    },
    "/auth/verify-email": {
        get: {
            tags: ["Auth"],
            summary: "Verify email address via token link",
            parameters: [
                { name: "token", in: "query", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Email verified" },
                400: { description: "Invalid or expired token" },
            },
        },
    },
    "/auth/forgot-password": {
        post: {
            tags: ["Auth"],
            summary: "Request a password reset email",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["email"],
                            properties: { email: { type: "string", format: "email" } },
                        },
                    },
                },
            },
            responses: { 200: { description: "Reset email sent if account exists" } },
        },
    },
    "/auth/reset-password": {
        post: {
            tags: ["Auth"],
            summary: "Reset password using token from email",
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["token", "password"],
                            properties: {
                                token: { type: "string" },
                                password: { type: "string", minLength: 8 },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: "Password updated" },
                400: { description: "Invalid or expired token" },
            },
        },
    },
    "/auth/google": {
        get: {
            tags: ["Auth"],
            summary: "Redirect to Google OAuth",
            responses: { 302: { description: "Redirects to Google consent screen" } },
        },
    },
    "/auth/google/callback": {
        get: {
            tags: ["Auth"],
            summary: "Google OAuth callback — issues tokens",
            parameters: [
                { name: "code", in: "query", required: true, schema: { type: "string" } },
            ],
            responses: {
                200: { description: "Tokens issued" },
                401: { description: "OAuth failed" },
            },
        },
    },
}

const AUTH_SECURITY_SCHEME = {
    bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
    },
}

export function createOpenApiRouter(
    config: FlowwatchOpenApiConfig,
    hasAuth: boolean
): Router {
    const spec = buildSpec(config, hasAuth)
    const router = Router()

    router.get("/openapi.json", (_req, res) => {
        res.json(spec)
    })

    router.get("/", (_req, res) => {
        res.setHeader("Content-Type", "text/html")
        res.send(swaggerHtml(config.info.title))
    })

    return router
}

function buildSpec(config: FlowwatchOpenApiConfig, hasAuth: boolean): Record<string, unknown> {
    const paths: Record<string, unknown> = { ...(config.paths ?? {}) }
    const components: Record<string, unknown> = { ...(config.components ?? {}) }

    if (hasAuth) {
        Object.assign(paths, AUTH_PATHS)
        components.securitySchemes = {
            ...(components.securitySchemes as Record<string, unknown> ?? {}),
            ...AUTH_SECURITY_SCHEME,
        }
    }

    return {
        openapi: "3.0.3",
        info: config.info,
        servers: config.servers ?? [],
        paths,
        components,
    }
}

function swaggerHtml(title: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title} — API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "openapi.json",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout",
      deepLinking: true,
    })
  </script>
</body>
</html>`
}
