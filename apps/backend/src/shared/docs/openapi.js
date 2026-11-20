/**
 * OpenAPI 3.0 Specification Generator
 * Auto-generates OpenAPI spec from Zod schemas and route definitions
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import logger from "#/utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert Zod schema to OpenAPI schema object
 * @param {object} schema - Zod schema
 * @returns {object} OpenAPI schema
 */
export function zodToOpenAPI(schema) {
  if (!schema) return {};

  const def = schema._def;

  switch (def.typeName) {
    case "ZodString": {
      const result = { type: "string" };
      const checks = def.checks || [];

      for (const check of checks) {
        switch (check.kind) {
          case "min":
            result.minLength = check.value;
            break;
          case "max":
            result.maxLength = check.value;
            break;
          case "email":
            result.format = "email";
            break;
          case "uuid":
            result.format = "uuid";
            break;
          case "regex":
            result.pattern = check.regex.source;
            break;
        }
      }

      if (def.description) result.description = def.description;
      return result;
    }

    case "ZodNumber": {
      const result = { type: "number" };
      const checks = def.checks || [];

      for (const check of checks) {
        switch (check.kind) {
          case "int":
            result.type = "integer";
            break;
          case "min":
            result.minimum = check.value;
            break;
          case "max":
            result.maximum = check.value;
            break;
        }
      }

      if (def.description) result.description = def.description;
      return result;
    }

    case "ZodBoolean": {
      const result = { type: "boolean" };
      if (def.description) result.description = def.description;
      return result;
    }

    case "ZodArray": {
      const result = { type: "array" };
      if (def.type) {
        result.items = zodToOpenAPI(def.type);
      }
      if (def.description) result.description = def.description;
      return result;
    }

    case "ZodObject": {
      const result = { type: "object", properties: {}, required: [] };
      const shape = def.shape();

      for (const [key, value] of Object.entries(shape)) {
        result.properties[key] = zodToOpenAPI(value);
        // Check if field is required (not optional/nullable)
        if (
          !value.isOptional?.() &&
          !value._def?.typeName?.includes("Optional")
        ) {
          result.required.push(key);
        }
      }

      if (def.description) result.description = def.description;
      return result;
    }

    case "ZodEnum": {
      return {
        type: "string",
        enum: def.values,
        description: def.description,
      };
    }

    case "ZodOptional": {
      return zodToOpenAPI(def.innerType);
    }

    case "ZodNullable": {
      const inner = zodToOpenAPI(def.innerType);
      return { ...inner, nullable: true };
    }

    case "ZodDefault": {
      const inner = zodToOpenAPI(def.innerType);
      if (def.defaultValue() !== undefined) {
        inner.default = def.defaultValue();
      }
      return inner;
    }

    case "ZodEffects": {
      // Refinements - return inner schema
      return zodToOpenAPI(def.schema);
    }

    case "ZodUnion":
    case "ZodDiscriminatedUnion": {
      return {
        oneOf: def.options.map((opt) => zodToOpenAPI(opt)),
      };
    }

    default:
      return { type: "object" };
  }
}

/**
 * Generate OpenAPI paths from route definitions
 * @param {Array} routes - Array of route definitions
 * @returns {object} OpenAPI paths object
 */
export function generatePaths(routes) {
  const paths = {};

  for (const route of routes) {
    const {
      method,
      path: routePath,
      summary,
      description,
      tags,
      parameters,
      requestBody,
      responses,
      security,
    } = route;

    if (!paths[routePath]) {
      paths[routePath] = {};
    }

    paths[routePath][method.toLowerCase()] = {
      summary,
      description,
      tags: tags || [],
      parameters: parameters || [],
      requestBody,
      responses: responses || {
        200: { description: "Success" },
      },
      security: security || [],
    };
  }

  return paths;
}

/**
 * Generate full OpenAPI 3.0 specification
 * @param {object} options - Generation options
 * @returns {object} OpenAPI specification
 */
export function generateOpenAPISpec(options = {}) {
  const {
    title = "HotelOS API",
    version = "1.0.0",
    description = "HotelOS - Hotel Management System API",
    servers = [{ url: "/api/v1", description: "API v1" }],
    routes = [],
    components = { schemas: {}, securitySchemes: {} },
    tags = [],
  } = options;

  const spec = {
    openapi: "3.0.3",
    info: {
      title,
      version,
      description,
      contact: {
        name: "HotelOS Team",
        email: "support@hotelos.com",
      },
      license: {
        name: "Proprietary",
      },
    },
    servers,
    tags,
    paths: generatePaths(routes),
    components: {
      schemas: components.schemas,
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "hotelos_session",
        },
        ...components.securitySchemes,
      },
    },
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  };

  return spec;
}

/**
 * Write OpenAPI spec to file
 * @param {object} spec - OpenAPI specification
 * @param {string} outputPath - Output file path
 */
export function writeOpenAPISpec(spec, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  logger.info({ outputPath }, "OpenAPI spec written");
}

/**
 * Extract Zod schemas from schema files
 * @param {string} schemasDir - Directory containing schema files
 * @returns {object} Map of schema name to Zod schema
 */
export function extractZodSchemas(schemasDir) {
  const schemas = {};

  if (!fs.existsSync(schemasDir)) return schemas;

  const files = fs.readdirSync(schemasDir).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    try {
      const module = require(path.join(schemasDir, file));
      for (const [name, schema] of Object.entries(module)) {
        if (schema && schema._def) {
          schemas[name] = schema;
        }
      }
    } catch (error) {
      logger.warn({ file, error: error.message }, "Failed to load schemas");
    }
  }

  return schemas;
}

/**
 * Generate OpenAPI schemas from Zod schemas
 * @param {object} zodSchemas - Map of schema name to Zod schema
 * @returns {object} OpenAPI schemas
 */
export function generateOpenAPISchemas(zodSchemas) {
  const openAPISchemas = {};

  for (const [name, schema] of Object.entries(zodSchemas)) {
    openAPISchemas[name] = zodToOpenAPI(schema);
  }

  return openAPISchemas;
}

export default {
  zodToOpenAPI,
  generatePaths,
  generateOpenAPISpec,
  writeOpenAPISpec,
  extractZodSchemas,
  generateOpenAPISchemas,
};
