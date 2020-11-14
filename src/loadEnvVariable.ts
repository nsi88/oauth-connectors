export default function loadEnvVariable(envVariableName: string): string | undefined {
  // NOTE: If we launch connectors in browser env (not on the server) we might not have env variables.
  // tslint:disable-next-line:strict-type-predicates
  if (typeof process === 'undefined' || typeof process.env !== 'object') {
    return undefined;
  }
  return process.env[envVariableName];
}
