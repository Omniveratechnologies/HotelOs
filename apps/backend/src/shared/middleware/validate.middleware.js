/**
 * Generic Zod validation middleware factory (schema object pattern).
 * Compatible with Zod v4.
 * Accepts an object with schemas for body, query, params, etc.
 * Stores validated data on req.validated = { body, query, params, ... }
 * Does NOT mutate req.body, req.query, or req.params.
 */
export function validate(schemaMap) {
  return async (req, res, next) => {
    try {
      const validated = {};
      const errors = {};

      for (const [source, schema] of Object.entries(schemaMap)) {
        const data = req[source];
        // Zod v4: safeParseAsync works the same
        const result = await schema.safeParseAsync(data);

        if (!result.success) {
          // Zod v4 error format - flatten() still works
          errors[source] = result.error.flatten().fieldErrors;
        } else {
          validated[source] = result.data;
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      req.validated = validated;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Validation error",
        errors: { _unexpected: [error.message] },
      });
    }
  };
}
