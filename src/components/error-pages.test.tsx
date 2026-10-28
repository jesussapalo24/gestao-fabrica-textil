import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { describe, expect, it, vi } from 'vitest'
import { NotFoundPage, RouteErrorPage } from './error-pages'

describe('error pages', () => {
  it('offers navigation home when a route is missing', async () => {
    const root = createRootRoute({ notFoundComponent: NotFoundPage })
    const index = createRoute({
      getParentRoute: () => root,
      path: '/',
      component: () => <h1>Home</h1>,
    })
    const router = createRouter({
      routeTree: root.addChildren([index]),
      scrollRestoration: false,
      history: createMemoryHistory({ initialEntries: ['/missing'] }),
    })
    await router.load()
    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', { name: 'Página não encontrada' }),
    ).toBeVisible()
    await userEvent.setup().click(screen.getByRole('link', { name: 'Voltar ao painel' }))
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible()
  })

  it('retries a failed loader without exposing its error to the page', async () => {
    const user = userEvent.setup()
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('Internal credentials must not appear'))
      .mockResolvedValueOnce(undefined)
    const root = createRootRoute({ errorComponent: RouteErrorPage })
    const index = createRoute({
      getParentRoute: () => root,
      path: '/',
      loader,
      component: () => <h1>Loaded</h1>,
    })
    const router = createRouter({
      routeTree: root.addChildren([index]),
      scrollRestoration: false,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    await router.load()
    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', { name: 'Não foi possível carregar esta página' }),
    ).toBeVisible()
    expect(
      screen.queryByText('Internal credentials must not appear'),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('heading', { name: 'Loaded' })).toBeVisible()
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
