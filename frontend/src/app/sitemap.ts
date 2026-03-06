import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://ecoanuncios.com';

    // Base routes for the application
    // The application seems to use [locale] routing. We will provide the base URLs or 'es' standard urls.
    // Next.js handles i18n sitemaps natively if configured or we can output them manually.

    const routes = [
        '',
        '/es',
        '/en',
        '/es/products',
        '/en/products',
        '/es/producers',
        '/en/producers',
        '/es/contact',
        '/es/como-participar',
        '/es/manifiesto',
        '/es/nuestra-comunidad'
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
    }));
}
