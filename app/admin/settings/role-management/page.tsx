'use client'

import { useState, useEffect } from 'react'
import { Table, Checkbox, Button, message, Spin } from 'antd'
import axios from 'axios'

const roles = ['ADMIN', 'BSS', 'INFOSEC', 'AGENT', 'SUPERVISOR']
const permissions = [
  { id: 'dashboard', name: 'View Dashboard' },
  { id: 'leads', name: 'Manage Leads' },
  { id: 'campaigns', name: 'Manage Campaigns' },
  { id: 'reports', name: 'View Reports' },
  { id: 'users', name: 'Manage Users' },
  { id: 'products', name: 'Manage Products' },
  { id: 'product-categories', name: 'Manage Categories' },
  { id: 'sectors', name: 'Manage Sectors' },
  { id: 'sbus', name: 'Manage SBUs' },
  { id: 'settings', name: 'Manage Settings' },
]

export default function RoleManagementPage() {
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRolePermissions = async () => {
      try {
        const response = await axios.get('/api/admin/roles/permissions')
        const data = response.data.reduce((acc: Record<string, string[]>, rp: any) => {
          if (!acc[rp.role]) {
            acc[rp.role] = []
          }
          acc[rp.role].push(rp.permission.name)
          return acc
        }, {})
        setRolePermissions(data)
      } catch (error) {
        message.error('Failed to fetch role permissions.')
      } finally {
        setLoading(false)
      }
    }
    fetchRolePermissions()
  }, [])

  const handlePermissionChange = (role: string, permission: string, checked: boolean) => {
    setRolePermissions((prev) => {
      const newPermissions = checked
        ? [...(prev[role] || []), permission]
        : (prev[role] || []).filter((p) => p !== permission)
      return { ...prev, [role]: newPermissions }
    })
  }

  const handleSaveChanges = async (role: string) => {
    try {
      const permissionIds = permissions
        .filter((p) => rolePermissions[role]?.includes(p.name))
        .map((p) => p.id)
      await axios.post('/api/admin/roles/permissions/update', { role, permissionIds })
      message.success(`Permissions for ${role} updated successfully.`)
    } catch (error) {
      message.error(`Failed to update permissions for ${role}.`)
    }
  }

  const columns = [
    {
      title: 'Permission',
      dataIndex: 'name',
      key: 'name',
    },
    ...roles.map((role) => ({
      title: role,
      key: role,
      render: (_: any, record: { id: string; name: string }) => (
        <Checkbox
          checked={rolePermissions[role]?.includes(record.name)}
          onChange={(e) => handlePermissionChange(role, record.name, e.target.checked)}
        />
      ),
    })),
  ]

  if (loading) {
    return <Spin />
  }

  return (
    <div>
      <Table
        dataSource={permissions}
        columns={columns}
        pagination={false}
        bordered
      />
      <div style={{ marginTop: 16 }}>
        {roles.map((role) => (
          <Button
            key={role}
            type="primary"
            onClick={() => handleSaveChanges(role)}
            style={{ marginRight: 8 }}
          >
            Save {role} Permissions
          </Button>
        ))}
      </div>
    </div>
  )
}
