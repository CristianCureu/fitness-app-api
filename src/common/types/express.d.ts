import { AppUser } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}
