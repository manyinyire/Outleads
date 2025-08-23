'use client'

import { useMemo, useEffect } from 'react'
import { ColumnsType } from 'antd/es/table'
import CrudTable, { CrudField } from '@/components/admin/CrudTable'
import { useCrud } from '@/hooks/useCrud'

interface Sector {
  id: string
  name: string
}

export default function SectorsPage() {
  const {
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
  } = useCrud<Sector>('/api/admin/sectors', 'sector')

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fields: CrudField[] = useMemo(() => [
    { name: 'name', label: 'Sector Name', type: 'text', required: true },
  ], [])

  const columns: ColumnsType<Sector> = useMemo(() => [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
  ], [])

  return (
    <CrudTable<Sector>
      title="Business Sectors"
      columns={columns}
      fields={fields}
      dataSource={data}
      loading={loading}
      onSearch={handleSearch}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      isModalVisible={isModalVisible}
      closeModal={closeModal}
      editingRecord={editingRecord}
    />
  )
}