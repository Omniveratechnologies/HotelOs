/**
 * Combine a base preset with workspace-specific settings.
 *
 * Rules and environment globals are merged. Plugins replace the base list
 * because oxlint expects the complete list whenever the field is set.
 */
export function composeConfig(base, overrides = {}) {
  return {
    ...base,
    ...overrides,
    plugins: overrides.plugins ?? base.plugins,
    categories: { ...base.categories, ...overrides.categories },
    env: { ...base.env, ...overrides.env },
    rules: { ...base.rules, ...overrides.rules },
    overrides: [...(base.overrides ?? []), ...(overrides.overrides ?? [])],
  };
}
