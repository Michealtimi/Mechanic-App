export interface UserRequest {
  user: {
    id: string;
    role: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
