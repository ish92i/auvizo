import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ConvexClerkProvider } from '../lib/convex-provider'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Auvizo',
      },
      {
        name: 'description',
        content: 'Fleet intelligence for rental companies. Know exactly which equipment makes money and which is burning capital. 15-30% revenue increase in 90 days.',
      },
      {
        name: 'theme-color',
        content: '#365E47',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: 'https://auvizo.com',
      },
      {
        property: 'og:site_name',
        content: 'Auvizo',
      },
      {
        property: 'og:title',
        content: 'Auvizo',
      },
      {
        property: 'og:description',
        content: 'Fleet intelligence for rental companies. Know exactly which equipment makes money and which is burning capital. 15-30% revenue increase in 90 days.',
      },
      {
        property: 'og:image',
        content: 'https://auvizo.com/og-image.png',
      },
      {
        property: 'og:image:width',
        content: '1200',
      },
      {
        property: 'og:image:height',
        content: '630',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Auvizo',
      },
      {
        name: 'twitter:description',
        content: 'Fleet intelligence for rental companies. Know exactly which equipment makes money and which is burning capital.',
      },
      {
        name: 'twitter:image',
        content: 'https://auvizo.com/twitter-image.png',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),

  shellComponent: RootDocument,
  component: RootComponent,
})

function RootComponent() {
  return (
    <ConvexClerkProvider>
      <Outlet />
    </ConvexClerkProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
