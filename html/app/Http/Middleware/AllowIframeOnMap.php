<?php

namespace Azuriom\Http\Middleware;

use Closure;

class AllowIframeOnMap
{
    /**
     * Handle an incoming request.
     */
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        // Прибираємо заборонні заголовки, якщо вони є
        $response->headers->remove('X-Frame-Options');
        
        // Дозволяємо вбудовування iframe з будь-якого джерела (можна звузити)
        $response->headers->set('X-Frame-Options', 'ALLOWALL');

        // Якщо є CSP і він блокує фрейми, додамо frame-ancestors
        $csp = $response->headers->get('Content-Security-Policy');
        if ($csp) {
            // Проста заміна (краще складніший парсинг, але так ок)
            $csp = preg_replace('/frame-ancestors[^;]+;?/', '', $csp);
            $csp .= " frame-ancestors *;";
            $response->headers->set('Content-Security-Policy', $csp);
        }

        return $response;
    }
}
