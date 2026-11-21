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

      const entries = Object.entries(schemaMap);
      const results = await Promise.all(
        entries.map(([source, schema]) => schema.safeParseAsync(req[source])),
      );
      entries.forEach(([source], index) => {
        const result = results[index];

        if (!result.success) {
          // Zod v4 error format - flatten() still works
          errors[source] = result.error.flatten().fieldErrors;
        } else {
          validated[source] = result.data;
        }
      });

      if (Object.keys(errors).length > 0) {
        const firstErrorMessages = [];
        for (const fieldErrors of Object.values(errors)) {
          for (const [field, msgs] of Object.entries(fieldErrors)) {
            if (Array.isArray(msgs) && msgs.length > 0) {
              firstErrorMessages.push(`${field}: ${msgs[0]}`);
            }
          }
        }
        const message =
          firstErrorMessages.length > 0
            ? `Validation failed: ${firstErrorMessages.join("; ")}`
            : "Validation failed";

        return res.status(400).json({
          success: false,
          message,
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
