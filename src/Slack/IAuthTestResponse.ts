export default interface IAuthTestResponse {
  ok: boolean;
  // TODO: Use the url to display in AuthCredentials list instead of the current slack.com
  url?: string;
  team?: string;
  user?: string;
  team_id?: string;
  user_id?: string;
  bot_id?: string;
  error?: string;
}
