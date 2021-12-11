/**
 * Parse scope.
 *
 * Example: parseScope('read:discussion,repo')
 * should return ['read:discussion', 'repo']
 *
 * If scope format is unknown, throw an error.
 */
export default function parseScope(scope: string): string[] {
  if (scope.match(/^[\w:,]*$/) === null) {
    throw new Error(`scope ${scope} has an invalid or unsupported format`);
  }
  // Decided that there is no much need to check that the returned scope values are valid
  // https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps#requested-scopes-and-granted-scopes
  return scope.split(',').filter(scope => scope !== '');
}
