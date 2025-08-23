import { useEffect } from 'react'
import { Table, Modal, Form, Input, Space, Typography, Button, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/es/table'
import { TextField, SelectField } from './form-fields'

const { Title } = Typography

// --- INTERFACES ---
export interface CrudField {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'email' | 'password' | 'select'
  required?: boolean
  rules?: any[]
  placeholder?: string
  options?: { label: string; value: any }[]
  readOnly?: boolean
}

export interface CrudTableProps<T extends { id: string }> {
  title: string
  columns: ColumnsType<T>
  fields?: CrudField[]
  dataSource: T[]
  loading: boolean
  
  // Event Handlers
  onSearch?: (value: string) => void
  onEdit?: (record: T) => void
  onDelete?: (id: string) => Promise<void>
  onView?: (record: T) => void
  onSubmit?: (values: any, record: T | null) => Promise<void>
  
  // Modal Control
  isModalVisible?: boolean
  closeModal?: () => void
  editingRecord?: T | null
  
  // Customization
  searchPlaceholder?: string
  customActions?: React.ReactNode
  customHeader?: React.ReactNode
  deleteConfirmMessage?: (record: T) => string
  hideDefaultActions?: boolean
}

// --- EDIT MODAL SUBCOMPONENT ---
interface EditModalProps<T> {
  title: string
  visible: boolean
  fields: CrudField[]
  editingRecord: T | null
  onClose: () => void
  onSubmit: (values: any, record: T | null) => Promise<void>
  isViewOnly?: boolean
}

function EditModal<T>({ title, visible, fields, editingRecord, onClose, onSubmit, isViewOnly }: EditModalProps<T>) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (editingRecord) {
      form.setFieldsValue(editingRecord)
    } else {
      form.resetFields()
    }
  }, [editingRecord, form, visible])

  return (
    <Modal
      title={isViewOnly ? `View ${title}` : (editingRecord ? `Edit ${title}` : `Add New ${title}`)}
      open={visible}
      onCancel={onClose}
      footer={isViewOnly ? [<Button key="back" onClick={onClose}>Close</Button>] : null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={(values) => onSubmit(values, editingRecord)}>
        {fields.map(field => 
          field.type === 'select' ? 
          <SelectField key={field.name} field={{...field, readOnly: isViewOnly || field.readOnly}} /> : 
          <TextField key={field.name} field={{...field, readOnly: isViewOnly || field.readOnly}} />
        )}
        {!isViewOnly && (
          <Form.Item style={{ textAlign: 'right', marginTop: 24, marginBottom: 0 }}>
            <Space>
              <Button onClick={onClose}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}

// --- MAIN COMPONENT ---
export default function CrudTable<T extends { id: string }>({
  title,
  columns,
  fields,
  dataSource,
  loading,
  onSearch,
  onEdit,
  onDelete,
  onView,
  onSubmit,
  isModalVisible,
  closeModal,
  editingRecord,
  searchPlaceholder = 'Search...',
  customActions,
  customHeader,
  deleteConfirmMessage,
  hideDefaultActions,
}: CrudTableProps<T>) {

  const finalColumns: ColumnsType<T> = [...columns];

  if (!hideDefaultActions) {
    finalColumns.push({
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {onView && (
            <Button type="link" icon={<EyeOutlined />} onClick={() => onView(record)}>
              View
            </Button>
          )}
          {onEdit && (
            <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Popconfirm
              title="Are you sure?"
              description={deleteConfirmMessage ? deleteConfirmMessage(record) : 'This action cannot be undone.'}
              onConfirm={() => onDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>{title}</Title>
        <Space>
          {onSearch && (
            <Input
              placeholder={searchPlaceholder}
              prefix={<SearchOutlined />}
              onChange={(e) => onSearch(e.target.value)}
              style={{ width: 200 }}
            />
          )}
          {customActions}
        </Space>
      </div>

      {customHeader}

      <Table
        columns={finalColumns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
      />

      {isModalVisible && (
        <EditModal
          title={title}
          visible={isModalVisible}
          fields={fields}
          editingRecord={editingRecord}
          onClose={closeModal}
          onSubmit={onSubmit}
          isViewOnly={!!onView && !onEdit}
        />
      )}
    </div>
  )
}
