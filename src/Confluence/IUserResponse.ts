export default interface IUserResponse {
  type: string; // e.g. "known",
  username: string; // e.g. "jsmith",
  userKey: string; // e.g. "402880824ff933a4014ff9345d7c0002",
  profilePicture: IProfilePicture;
  displayName: string; // e.g. "Joe Smith",
  _links: ILinks;
  _expandable: IExpandable;
}

interface IProfilePicture {
  path: string; // e.g. "/wiki/relative/avatar.png",
  width: number; // e.g. 48,
  height: number; // e.g. 48,
  isDefault: boolean; // e.g. true
}

interface ILinks {
  base: string; // e.g. "http://myhost:8080/confluence",
  context: string; // e.g. "/confluence",
  self: string; // e.g. "http://myhost:8080/confluence/rest/experimental/user?key=402880824ff933a4014ff9345d7c0002"
}

interface IExpandable {
  status: string; // e.g. ""
}
