'use client'

import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  Users, 
  HardHat, 
  Truck, 
  Wrench, 
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Filter,
  Search
} from 'lucide-react'

interface Resource {
  id: string
  name: string
  type: 'person' | 'equipment' | 'material' | 'vehicle'
  category: string
  status: 'available' | 'busy' | 'maintenance' | 'unavailable'
  location: string
  costPerHour?: number
  skills?: string[]
  capacity?: number
  currentProject?: string
  nextAvailable?: Date
  maintenanceDue?: Date
}

interface ResourceManagerProps {
  projectId: string
  resources?: Resource[]
  onResourceUpdate?: (resource: Resource) => void
  onResourceCreate?: (resource: Omit<Resource, 'id'>) => void
  onResourceDelete?: (resourceId: string) => void
}

const ResourceManager: React.FC<ResourceManagerProps> = ({
  projectId,
  resources = [],
  onResourceUpdate,
  onResourceCreate,
  onResourceDelete
}) => {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data for demonstration
  const mockResources: Resource[] = [
    {
      id: '1',
      name: 'יוסי כהן',
      type: 'person',
      category: 'מהנדס בניין',
      status: 'available',
      location: 'תל אביב',
      costPerHour: 150,
      skills: ['תכנון', 'בקרת איכות', 'ניהול פרויקטים']
    },
    {
      id: '2',
      name: 'מנוף 25 טון',
      type: 'equipment',
      category: 'ציוד כבד',
      status: 'busy',
      location: 'פרויקט רמת גן',
      costPerHour: 300,
      currentProject: 'מגדל יוקרה',
      nextAvailable: new Date('2024-02-15')
    },
    {
      id: '3',
      name: 'בטון C25',
      type: 'material',
      category: 'חומרי בנייה',
      status: 'available',
      location: 'מחסן מרכזי',
      capacity: 1000,
      costPerHour: 50
    },
    {
      id: '4',
      name: 'משאית הובלה',
      type: 'vehicle',
      category: 'רכב עבודה',
      status: 'maintenance',
      location: 'מוסך',
      costPerHour: 200,
      maintenanceDue: new Date('2024-02-10')
    }
  ]

  const displayResources = resources.length > 0 ? resources : mockResources

  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'person': return <Users className="h-5 w-5" />
      case 'equipment': return <Wrench className="h-5 w-5" />
      case 'material': return <HardHat className="h-5 w-5" />
      case 'vehicle': return <Truck className="h-5 w-5" />
      default: return <HardHat className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: Resource['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'unavailable': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Resource['status']) => {
    switch (status) {
      case 'available': return 'זמין'
      case 'busy': return 'עסוק'
      case 'maintenance': return 'תחזוקה'
      case 'unavailable': return 'לא זמין'
      default: return 'לא ידוע'
    }
  }

  const filteredResources = displayResources.filter(resource => {
    const matchesType = filterType === 'all' || resource.type === filterType
    const matchesStatus = filterStatus === 'all' || resource.status === filterStatus
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.category.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesStatus && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              ניהול משאבים
            </CardTitle>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              משאב חדש
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="חיפוש משאבים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="all">כל הסוגים</option>
                <option value="person">אנשים</option>
                <option value="equipment">ציוד</option>
                <option value="material">חומרים</option>
                <option value="vehicle">רכבים</option>
              </select>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="available">זמין</option>
              <option value="busy">עסוק</option>
              <option value="maintenance">תחזוקה</option>
              <option value="unavailable">לא זמין</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource) => (
          <Card 
            key={resource.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedResource(resource)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getTypeIcon(resource.type)}
                  <CardTitle className="text-lg ml-2">{resource.name}</CardTitle>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(resource.status)}`}>
                  {getStatusText(resource.status)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">קטגוריה:</span>
                  <span className="mr-2">{resource.category}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium">מיקום:</span>
                  <span className="mr-2">{resource.location}</span>
                </div>

                {resource.costPerHour && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">עלות לשעה:</span>
                    <span className="mr-2">₪{resource.costPerHour}</span>
                  </div>
                )}

                {resource.currentProject && (
                  <div className="flex items-center text-sm text-blue-600">
                    <span className="font-medium">פרויקט נוכחי:</span>
                    <span className="mr-2">{resource.currentProject}</span>
                  </div>
                )}

                {resource.nextAvailable && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>זמין מ: {resource.nextAvailable.toLocaleDateString('he-IL')}</span>
                  </div>
                )}

                {resource.maintenanceDue && (
                  <div className="flex items-center text-sm text-yellow-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span>תחזוקה: {resource.maintenanceDue.toLocaleDateString('he-IL')}</span>
                  </div>
                )}

                {resource.skills && resource.skills.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">כישורים:</div>
                    <div className="flex flex-wrap gap-1">
                      {resource.skills.map((skill, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource Details Modal */}
      {selectedResource && (
        <Card className="fixed inset-4 z-50 bg-white shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                {getTypeIcon(selectedResource.type)}
                <span className="ml-2">{selectedResource.name}</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedResource(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">קטגוריה</label>
                <p>{selectedResource.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium">סטטוס</label>
                <p className="capitalize">{getStatusText(selectedResource.status)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">מיקום</label>
                <p>{selectedResource.location}</p>
              </div>
              {selectedResource.costPerHour && (
                <div>
                  <label className="text-sm font-medium">עלות לשעה</label>
                  <p>₪{selectedResource.costPerHour}</p>
                </div>
              )}
              {selectedResource.currentProject && (
                <div>
                  <label className="text-sm font-medium">פרויקט נוכחי</label>
                  <p>{selectedResource.currentProject}</p>
                </div>
              )}
              {selectedResource.nextAvailable && (
                <div>
                  <label className="text-sm font-medium">זמין מ</label>
                  <p>{selectedResource.nextAvailable.toLocaleDateString('he-IL')}</p>
                </div>
              )}
            </div>

            {selectedResource.skills && selectedResource.skills.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium">כישורים</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedResource.skills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                ערוך
              </Button>
              <Button variant="outline" size="sm" className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                מחק
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ResourceManager
