import { validateToken } from "../service/authentication.js";

export const checkForAuthenticationCookie = (cookieName) => {
  return (req, res, next) => {
    const tokenCookieValue = req.cookies[cookieName];
    if (!tokenCookieValue) {
      res.clearCookie(cookieName);
      return next();
    }
    try {
      const userPayLoad = validateToken(tokenCookieValue);
      req.user = userPayLoad;
      return next();
    } catch (error) {
      return next();
    }
  };
};

export const redirectToLoginPage = (req, res, next) => {
  const publicPaths = ["/login", "/signup"]; // add more if needed

  if (publicPaths.includes(req.path)) {
    return next(); // allow public routes
  }
  try {
    const userPayLoad = req.user;
    // console.log("From middleware", req.user);
    if (!req.user) {
      return res.redirect("/login");
    } else {
      return next();
    }
  } catch (error) {}
};
