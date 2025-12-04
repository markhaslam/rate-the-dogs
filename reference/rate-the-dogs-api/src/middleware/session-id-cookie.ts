import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction, CookieOptions } from 'express';

const cookieOptions: CookieOptions = {
  // domain: 'ratethedogs.com', //In summary, if you set a cookie like the second example above [Set-Cookie: name=value; domain=mydomain.com] from mydomain.com, it would be accessible by subdomain.mydomain.com, and vice versa. This can also be used to allow sub1.mydomain.com and sub2.mydomain.com to share cookies https://stackoverflow.com/a/23086139/2367154
  signed: true,
  maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
  httpOnly: true,
  sameSite: 'lax',
};

export function addSessionIdCookie(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.signedCookies.sid) {
    res.cookie('sid', randomUUID(), cookieOptions);
  }
  next();
}
