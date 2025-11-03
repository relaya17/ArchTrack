'use client'

import React, { useState } from 'react'
import LayoutWithSidebar from '../layout-with-sidebar'
import { Button } from '../../components/ui/button'
import { 
  Users, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react'

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  
  const users = [
    { 
      id: 1, 
      name: 'דוד כהן', 
      email: 'david@example.com',
      role: 'מהנדס',
      phone: '050-1234567',
      location: 'תל אביב',
      joinDate: '2023-01-15',
      status: 'פעיל',
      avatar: 'ד.כ'
    },
    { 
      id: 2, 
      name: 'שרה לוי', 
      email: 'sarah@example.com',
      role: 'אדריכלית',
      phone: '052-9876543',
      location: 'ירושלים',
      joinDate: '2023-02-20',
      status: 'פעיל',
      avatar: 'ש.ל'
    },
    { 
      id: 3, 
      name: 'מיכאל אברהם', 
      email: 'michael@example.com',
      role: 'קבלן',
      phone: '054-5555555',
      location: 'חיפה',
      joinDate: '2023-03-10',
      status: 'לא פעיל',
      avatar: 'מ.א'
    },
    { 
      id: 4, 
      name: 'רחל גולדברג', 
      email: 'rachel@example.com',
      role: 'מנהל פרויקט',
      phone: '053-7777777',
      location: 'רמת גן',
      joinDate: '2023-01-05',
      status: 'פעיל',
      avatar: 'ר.ג'
    },
  ]

  const roles = ['all', 'מהנדס', 'אדריכלית', 'קבלן', 'מנהל פרויקט']

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === 'all' || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const getStatusColor = (status: string) => {
    return status === 'פעיל' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'מהנדס': return 'bg-blue-100 text-blue-800'
      case 'אדריכלית': return 'bg-purple-100 text-purple-800'
      case 'קבלן': return 'bg-orange-100 text-orange-800'
      case 'מנהל פרויקט': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <LayoutWithSidebar>
      <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">משתמשים</h1>
          <p className="text-gray-600">ניהול משתמשי המערכת והרשאות</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">סה"כ משתמשים</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">משתמשים פעילים</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.status === 'פעיל').length}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-100">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">מהנדסים</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'מהנדס').length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">אדריכלים</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'אדריכלית').length}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="חיפוש משתמשים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  title="בחר תפקיד"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>
                      {role === 'all' ? 'כל התפקידים' : role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              הוסף משתמש
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">משתמש</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תפקיד</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">יצירת קשר</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מיקום</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center ml-3">
                          <span className="text-white font-medium text-sm">{user.avatar}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phone}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {user.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">לא נמצאו משתמשים</h3>
            <p className="text-gray-600 mb-6">התחל בהוספת משתמש חדש למערכת</p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              הוסף משתמש
            </Button>
          </div>
        )}
      </div>
      </div>
    </LayoutWithSidebar>
  )
}
