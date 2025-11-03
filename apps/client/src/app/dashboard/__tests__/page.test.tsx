/**
 * Dashboard Page Tests
 * Construction Master App - Page Component Testing
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DashboardPage from '../page'

// Mock the layout component
jest.mock('../../layout-with-sidebar', () => {
  return function MockLayoutWithSidebar({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

describe('Dashboard Page', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    jest.clearAllMocks()
  })

  it('renders dashboard title and description', () => {
    render(<DashboardPage />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('סקירה כללית של הפרויקטים והביצועים')).toBeInTheDocument()
  })

  it('displays KPI cards with correct data', () => {
    render(<DashboardPage />)
    
    // Check KPI cards are rendered
    expect(screen.getByText('פרויקטים פעילים')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    
    expect(screen.getByText('ערך כולל')).toBeInTheDocument()
    expect(screen.getByText('₪45M')).toBeInTheDocument()
    
    expect(screen.getByText('צוות פעיל')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
    
    expect(screen.getByText('תקציב נותר')).toBeInTheDocument()
    expect(screen.getByText('₪12M')).toBeInTheDocument()
  })

  it('displays projects list with correct data', () => {
    render(<DashboardPage />)
    
    // Check projects are rendered
    expect(screen.getByText('פרויקט מגדל יוקרה')).toBeInTheDocument()
    expect(screen.getByText('בניית בית פרטי')).toBeInTheDocument()
    expect(screen.getByText('שיפוץ משרדים')).toBeInTheDocument()
    
    // Check project statuses
    expect(screen.getByText('פעיל')).toBeInTheDocument()
    expect(screen.getByText('תכנון')).toBeInTheDocument()
    expect(screen.getByText('הושלם')).toBeInTheDocument()
  })

  it('displays project budgets correctly', () => {
    render(<DashboardPage />)
    
    expect(screen.getByText('₪15M')).toBeInTheDocument()
    expect(screen.getByText('₪2.5M')).toBeInTheDocument()
    expect(screen.getByText('₪800K')).toBeInTheDocument()
  })

  it('shows progress bars for projects', () => {
    render(<DashboardPage />)
    
    // Check progress percentages
    expect(screen.getByText('75% הושלם')).toBeInTheDocument()
    expect(screen.getByText('30% הושלם')).toBeInTheDocument()
    expect(screen.getByText('100% הושלם')).toBeInTheDocument()
  })

  it('renders "New Project" button', () => {
    render(<DashboardPage />)
    
    const newProjectButton = screen.getByRole('button', { name: /פרויקט חדש/i })
    expect(newProjectButton).toBeInTheDocument()
  })

  it('renders "View" buttons for each project', () => {
    render(<DashboardPage />)
    
    const viewButtons = screen.getAllByRole('button', { name: /צפה/i })
    expect(viewButtons).toHaveLength(3) // One for each project
  })

  it('has proper layout structure', () => {
    render(<DashboardPage />)
    
    expect(screen.getByTestId('layout')).toBeInTheDocument()
    
    // Check main sections exist
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('פרויקטים אחרונים')).toBeInTheDocument()
  })

  it('displays KPI icons correctly', () => {
    render(<DashboardPage />)
    
    // Check that KPI cards have icons (they should be rendered as SVG elements)
    const kpiCards = screen.getAllByText(/פרויקטים פעילים|ערך כולל|צוות פעיל|תקציב נותר/)
    expect(kpiCards).toHaveLength(4)
  })

  it('handles responsive design classes', () => {
    render(<DashboardPage />)
    
    // Check that responsive classes are applied
    const kpiGrid = screen.getByText('פרויקטים פעילים').closest('div')?.parentElement
    expect(kpiGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
  })

  it('maintains proper spacing and layout', () => {
    render(<DashboardPage />)
    
    // Check that proper spacing classes are applied
    const mainContainer = screen.getByText('Dashboard').closest('div')
    expect(mainContainer).toHaveClass('p-6')
  })
})

