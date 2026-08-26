import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type Schemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

/** Runs Zod validation before the controller runs. Throws (caught by errorHandler) on failure. */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
    if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
    next();
  };
}
