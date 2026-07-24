import { DefaultSession } from "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    /** FastAPI-issued JWT for calling the backend API. */
    accessToken?: string;
    /** Set when the backend token expired and could not be refreshed. */
    error?: "SessionExpired";
    user: {
      id?: string;
      createdAt?: string;
    } & DefaultSession["user"];
  }

  interface User {
    accessToken?: string;
    createdAt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    accessToken?: string;
    /** Unix ms timestamp at which the backend access token expires. */
    accessTokenExpires?: number;
    createdAt?: string;
    error?: "SessionExpired";
  }
}
