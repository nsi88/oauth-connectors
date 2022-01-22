export default interface IRetries {
  retries: number;
}

export function implementsIRetries(object: any): object is IRetries {
  return typeof object === 'object' && typeof object.retries === 'number';
}
