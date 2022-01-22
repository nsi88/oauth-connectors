export default interface ITimeout {
  timeout: number;
}

export function implementsITimeout(object: any): object is ITimeout {
  return typeof object === 'object' && typeof object.timeout === 'number';
}
