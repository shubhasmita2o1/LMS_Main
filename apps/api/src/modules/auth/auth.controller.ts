import { Request, Response, NextFunction } from 'express';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';
import * as authService from './auth.service';

function clientMeta(req: Request) {
  return {
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.registerUser(body, clientMeta(req));
    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful',
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.loginUser(body, clientMeta(req));
    res.status(200).json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const body = refreshSchema.parse(req.body);
    const tokens = await authService.refreshTokens(body.refreshToken, clientMeta(req));
    res.status(200).json({
      success: true,
      data: { tokens },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const body = logoutSchema.parse(req.body ?? {});
    if (!req.user) {
      res.status(200).json({ success: true, message: 'Logged out' });
      return;
    }
    await authService.logoutUser(req.user.id, body.refreshToken);
    res.status(200).json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }
    await authService.logoutAll(req.user.id);
    res.status(200).json({ success: true, message: 'Logged out from all devices' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Auth required' } });
      return;
    }
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = forgotPasswordSchema.parse(req.body);
    const result = await authService.requestPasswordReset(body.email, body.tenantId);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(body.token, body.password);
    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
}
