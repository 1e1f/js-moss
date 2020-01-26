import { interpolate as interpolateAsync } from './async'
import { interpolate } from './sync';

export { interpolate, interpolateAsync };

const jsonSchemaKeys = ['id', 'schema', 'ref', 'comment'];
const mongoKeys = ['set', 'unset', 'push', 'pull', 'gt', 'lt', 'gte', 'lte', 'exists'];
export const reservedKeys = jsonSchemaKeys.concat(mongoKeys);
