import { createI18nMiddleware } from 'next-international/middleware';
import { NextRequest } from 'next/server';

const I18nMiddleware = createI18nMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'es',
  urlMappingStrategy: 'rewrite',
});

export function middleware(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  // Exclude api, static, files with extension, _next, and firebase auth paths (__)
  matcher: ['/((?!api|static|.*\\..*|_next|__).*)'],
};
