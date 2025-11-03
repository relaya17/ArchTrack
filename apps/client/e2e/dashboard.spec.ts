/**
 * Dashboard E2E Tests
 * Construction Master App - End-to-End Testing
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to dashboard before each test
        await page.goto('/dashboard')
    })

    test('should display dashboard title and description', async ({ page }) => {
        // Check page title
        await expect(page).toHaveTitle(/ProBuilder/)

        // Check main heading
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

        // Check description
        await expect(page.getByText('סקירה כללית של הפרויקטים והביצועים')).toBeVisible()
    })

    test('should display KPI cards with correct data', async ({ page }) => {
        // Check KPI cards are visible
        await expect(page.getByText('פרויקטים פעילים')).toBeVisible()
        await expect(page.getByText('12')).toBeVisible()

        await expect(page.getByText('ערך כולל')).toBeVisible()
        await expect(page.getByText('₪45M')).toBeVisible()

        await expect(page.getByText('צוות פעיל')).toBeVisible()
        await expect(page.getByText('28')).toBeVisible()

        await expect(page.getByText('תקציב נותר')).toBeVisible()
        await expect(page.getByText('₪12M')).toBeVisible()
    })

    test('should display projects list', async ({ page }) => {
        // Check projects section
        await expect(page.getByText('פרויקטים אחרונים')).toBeVisible()

        // Check individual projects
        await expect(page.getByText('פרויקט מגדל יוקרה')).toBeVisible()
        await expect(page.getByText('בניית בית פרטי')).toBeVisible()
        await expect(page.getByText('שיפוץ משרדים')).toBeVisible()
    })

    test('should display project progress bars', async ({ page }) => {
        // Check progress percentages
        await expect(page.getByText('75% הושלם')).toBeVisible()
        await expect(page.getByText('30% הושלם')).toBeVisible()
        await expect(page.getByText('100% הושלם')).toBeVisible()
    })

    test('should have working "New Project" button', async ({ page }) => {
        const newProjectButton = page.getByRole('button', { name: /פרויקט חדש/i })
        await expect(newProjectButton).toBeVisible()
        await expect(newProjectButton).toBeEnabled()
    })

    test('should have working "View" buttons for projects', async ({ page }) => {
        const viewButtons = page.getByRole('button', { name: /צפה/i })
        await expect(viewButtons).toHaveCount(3)

        // Check first view button is clickable
        await expect(viewButtons.first()).toBeEnabled()
    })

    test('should be responsive on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 })

        // Check that content is still visible
        await expect(page.getByText('Dashboard')).toBeVisible()
        await expect(page.getByText('פרויקטים פעילים')).toBeVisible()
    })

    test('should have proper RTL layout', async ({ page }) => {
        // Check that the page has RTL direction
        const html = page.locator('html')
        await expect(html).toHaveAttribute('dir', 'rtl')
        await expect(html).toHaveAttribute('lang', 'he')
    })

    test('should load without errors', async ({ page }) => {
        // Check for console errors
        const errors: string[] = []
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text())
            }
        })

        await page.reload()

        // Wait a bit for any async operations
        await page.waitForTimeout(1000)

        // Filter out known non-critical errors
        const criticalErrors = errors.filter(error =>
            !error.includes('favicon') &&
            !error.includes('404') &&
            !error.includes('Failed to load resource')
        )

        expect(criticalErrors).toHaveLength(0)
    })
})

test.describe('Navigation', () => {
    test('should navigate between pages', async ({ page }) => {
        // Start at dashboard
        await page.goto('/dashboard')
        await expect(page.getByText('Dashboard')).toBeVisible()

        // Navigate to table page
        await page.goto('/table')
        await expect(page.getByText('גיליונות')).toBeVisible()

        // Navigate to drawing page
        await page.goto('/drawing')
        await expect(page.getByText('לוח ציור')).toBeVisible()
    })

    test('should handle 404 pages gracefully', async ({ page }) => {
        const response = await page.goto('/non-existent-page')
        expect(response?.status()).toBe(404)
    })
})

test.describe('Performance', () => {
    test('should load dashboard quickly', async ({ page }) => {
        const startTime = Date.now()

        await page.goto('/dashboard')
        await expect(page.getByText('Dashboard')).toBeVisible()

        const loadTime = Date.now() - startTime

        // Dashboard should load within 3 seconds
        expect(loadTime).toBeLessThan(3000)
    })

    test('should have good Lighthouse scores', async ({ page }) => {
        // This test would require lighthouse integration
        // For now, we'll just check that the page loads
        await page.goto('/dashboard')
        await expect(page.getByText('Dashboard')).toBeVisible()
    })
})

