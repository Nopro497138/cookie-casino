import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      discordId?: string;
      balance?: number;
      isBanned?: boolean;
      banReason?: string | null;
    } & DefaultSession["user"];
  }
}
