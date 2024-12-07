import { Request, Response, NextFunction } from "express";

interface RequestWithUser extends Request {
  user?: {
    userRole: string;
    userId: string;
    userName: string;
    email: string;
  };
}

interface CustomResponse extends Response {
  json: (body: { status: boolean; data: any; error: string }) => this;
}

const allowRoles = (...roles: string[]) => {
  return (
    req: RequestWithUser,
    res: CustomResponse,
    next: NextFunction,
  ): Promise<void> => {
    const userHeader = req.headers["user"];

    if (userHeader) {
      try {
        const { user } = JSON.parse(userHeader as string);
        req.user = user;
        console.log("User header:", req.user);
      } catch (error) {
        console.error("Error parsing user header:", error);
        res.status(400).json({
          status: false,
          data: {},
          error: "Invalid user header format",
        });
      }
    }
    if (!req.user || !roles.includes(req.user.userRole)) {
      res.status(403).json({
        status: false,
        data: {},
        error: "Not authorized to access this route",
      });
      return Promise.resolve();
    }
    next();

    return Promise.resolve();
  };
};

export default allowRoles;
