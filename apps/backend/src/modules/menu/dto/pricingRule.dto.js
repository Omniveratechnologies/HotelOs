// pricingRule.dto.js
export const pricingRuleDTO = (p) => ({
  id: p._id,
  name: p.name,
  startTime: p.startTime,
  endTime: p.endTime,
  specialPrice: p.specialPrice,
  validDays: p.validDays,
  status: p.status,
});
