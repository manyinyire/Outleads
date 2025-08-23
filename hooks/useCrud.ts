'use client'

import { useState, useCallback, useEffect } from 'react'
import { App } from 'antd'

interface CrudHook<T> {
  data: T[]
  loading: boolean
  isModalVisible: boolean
  editingRecord: T | null
  handleSearch: (value: string) => void
  handleEdit: (record: T) => void
  handleDelete: (id: string) => Promise<void>
  handleSubmit: (values: any, record: T | null) => Promise<void>
  closeModal: () => void
  fetchData: () => Promise<void>
}

export function useCrud<T extends { id: string }>(
  apiPath: string,
  entityName: string
): CrudHook<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<T | null>(null)
  
  const { message } = App.useApp()

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  const handleEdit = (record: T) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setEditingRecord(null)
  }

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('auth-token');
    try {
      const response = await fetch(`${apiPath}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        message.success(`${entityName} deleted successfully`);
        fetchData();
      } else {
        const error = await response.json();
        message.error(error.message || `Failed to delete ${entityName}`);
      }
    } catch (error) {
      console.error(`Delete error for ${entityName}:`, error);
      message.error(`An error occurred while deleting the ${entityName}.`);
    }
  }

  const handleSubmit = async (values: any, record: T | null) => {
    const token = localStorage.getItem('auth-token');
    const url = record ? `${apiPath}/${record.id}` : apiPath;
    const method = record ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success(`${entityName} ${record ? 'updated' : 'created'} successfully`);
        closeModal();
        fetchData();
      } else {
        const error = await response.json();
        message.error(error.message || `Failed to save ${entityName}`);
      }
    } catch (error) {
      console.error(`Submit error for ${entityName}:`, error);
      message.error(`An error occurred while saving the ${entityName}.`);
    }
  }

  return {
    data,
    loading,
    isModalVisible,
    editingRecord,
    handleSearch,
    handleEdit,
    handleDelete,
    handleSubmit,
    closeModal,
    fetchData,
  }
}
