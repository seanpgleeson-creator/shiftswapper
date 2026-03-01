import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    phone?: string;
    role?: string;
  }

  interface Session {
    user: User & {
      id?: string;
      firstName?: string;
      lastName?: string;
      position?: string;
      phone?: string;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    phone?: string;
    role?: string;
  }
}
