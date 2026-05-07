import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const result = super.canActivate(context);

      if (typeof result === 'boolean') {
        return true;
      }

      if (result instanceof Promise) {
        return result.then(() => true).catch(() => true);
      }

      if (this.isObservable(result)) {
        return result.pipe(
          map(() => true),
          catchError(() => of(true)),
        );
      }

      return true;
    }

    const result = super.canActivate(context);

    if (typeof result === 'boolean' || this.isObservable(result)) {
      return result;
    }

    if (result instanceof Promise) {
      return result.then((value) => !!value);
    }

    return result;
  }

  handleRequest(err: unknown, user: any, info: unknown, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      if (err) {
        return null;
      }
      return user ?? null;
    }

    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException({
          errorCode: 'UNAUTHORIZED',
          message: 'Unauthorized',
        })
      );
    }

    return user;
  }

  private isObservable<T = unknown>(value: any): value is Observable<T> {
    return value && typeof value.subscribe === 'function';
  }
}
