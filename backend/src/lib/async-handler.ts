import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Express 4 does not catch rejected promises; without this a DB error crashes the process. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
