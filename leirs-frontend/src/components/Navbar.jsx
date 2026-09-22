import React, { useState } from 'react'
import { Bell, Search, User, LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import NotificationDropdown from './NotificationDropdown'
import useNotificationCount from '../hooks/useNotificationCount'
import { getRoleLabel } from '../data/mockData'

const Navbar = ({ user, onLogout, onMenuClick }) => {
  const navigate = useNavigate()
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const { count } = useNotificationCount(user)

  const toggleNotifications = () => {
    setIsNotificationOpen(!isNotificationOpen)
  }

  const closeNotifications = () => {
    setIsNotificationOpen(false)
  }

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      {/* Left: Hamburger + Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1">
        {/* Hamburger Menu - Mobile/Tablet only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-background rounded-lg transition-colors"
        >
          <Menu size={24} className="text-text" />
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="relative p-2 hover:bg-background rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} className="text-muted" />
            {count > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            )}
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          <NotificationDropdown
            user={user}
            isOpen={isNotificationOpen}
            onClose={closeNotifications}
          />
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border">
          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
            <User size={18} className="text-primary" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{user?.name || user?.full_name || 'User'}</p>
            <p className="text-xs text-muted">{getRoleLabel(user?.role) || 'Guest'}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 hover:bg-background rounded-lg transition-colors text-muted hover:text-text"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Navbar
