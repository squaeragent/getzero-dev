import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  
  // Let the normal Astro router handle everything
  // This middleware just ensures all routes go through the SSR function
  return next();
});
