// TODO: Check if there is a defined/standard class for it
export default class NetworkError extends Error {
  address: string;
  code: string;
  errno: string;
  port: number;
  syscall: string;

  constructor(message: string | undefined, address: string, code: string, errno: string, port: number, syscall: string) {
    super(message);
    this.address = address;
    this.code = code;
    this.errno = errno;
    this.port = port;
    this.syscall = syscall;
  }
}
