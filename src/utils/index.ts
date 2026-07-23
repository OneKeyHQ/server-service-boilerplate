import { RuleType, getSchema } from '@midwayjs/validate';

export function validateBy(
  object: any,
  schemaOrTypeClass: any,
  options?: RuleType.ValidationOptions
): any {
  const schema = RuleType.isSchema(schemaOrTypeClass)
    ? schemaOrTypeClass
    : getSchema(schemaOrTypeClass);
  const { value, error } = schema.validate(object, options);
  if (error) {
    throw error;
  }
  return value;
}
