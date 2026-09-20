import React, { useState, useEffect } from 'react'
import AppHeaderDropdown from './header/AppHeaderDropdown'
import NotificationBell from './header/NotificationBell'
import ThemeToggle from './header/ThemeToggle'

const AppHeader = ({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed }) => {


    return (
        <div className='topbar'>
            <div className='topbar-left'>
                {/* Mobile menu toggle */}
                <button
                    className='sidebar-toggle mobile-toggle'
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    title={sidebarOpen ? 'Close menu' : 'Open menu'}
                >
                    <svg viewBox='0 0 24 24' fill='currentColor'>
                        {sidebarOpen ? (
                            <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
                        ) : (
                            <path d='M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z' />
                        )}
                    </svg>
                </button>

                {/* Desktop collapse/expand toggle */}
                <button
                    className='sidebar-toggle desktop-toggle'
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg viewBox='0 0 24 24' fill='currentColor'>
                        <path
                            d={
                                sidebarCollapsed
                                    ? 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z'
                                    : 'M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z'
                            }
                        />
                    </svg>
                </button>
            </div>
            <div className='topbar-right d-flex align-items-center'>
                <ThemeToggle />
                <NotificationBell />
                <AppHeaderDropdown />
            </div>
        </div>
    )
}

export default AppHeader
