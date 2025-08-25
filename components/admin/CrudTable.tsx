import { useState } from 'react';
import { Table, Input, Space, Typography, Button, Popconfirm, TablePaginationConfig } from 'antd';
import { EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import EditModal from './EditModal';

const { Title } = Typography;

// --- INTERFACES ---
export interface CrudField {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'email' | 'password' | 'select';
  required?: boolean;
  rules?: any[];
  placeholder?: string;
  options?: { label: string; value: any }[];
  readOnly?: boolean;
}

export interface CrudTableProps<T extends { id: string }> {
  readonly title: string;
  readonly columns: ColumnsType<T>;
  readonly fields?: CrudField[];
  readonly dataSource: T[];
  readonly loading: boolean;
  readonly pagination?: TablePaginationConfig;
  readonly onTableChange?: (pagination: TablePaginationConfig, filters: any, sorter: any) => void;

  // Event Handlers
  readonly onSearch?: (value: string) => void;
  readonly onDelete?: (id: string) => Promise<void>;
  readonly onSubmit?: (values: any, record: T | null) => Promise<void>;

  // Customization
  readonly searchPlaceholder?: string;
  readonly customActions?: React.ReactNode;
  readonly customHeader?: React.ReactNode;
  readonly deleteConfirmMessage?: (record: T) => string;
  readonly hideDefaultActions?: boolean;
  readonly customRowActions?: (record: T, handleEdit: (record: T) => void) => React.ReactNode;
}

// --- MAIN COMPONENT ---
export default function CrudTable<T extends { id: string }>({
  title,
  columns,
  fields,
  dataSource,
  loading,
  pagination,
  onTableChange,
  onSearch,
  onDelete,
  onSubmit,
  searchPlaceholder = 'Search...',
  customActions,
  customHeader,
  deleteConfirmMessage,
  hideDefaultActions,
  customRowActions,
}: CrudTableProps<T>) {
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);

  const handleEdit = (record: T) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  const handleCreate = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setEditingRecord(null);
    setModalVisible(false);
  };

  const finalColumns: ColumnsType<T> = [...columns];

  if (!hideDefaultActions) {
    finalColumns.push({
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {customRowActions ? customRowActions(record, handleEdit) : (
            <>
              <Button type="link" icon={<EyeOutlined />} onClick={() => handleEdit(record)}>
                View
              </Button>
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                Edit
              </Button>
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
            </>
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
          {customActions || (
            <Button type="primary" onClick={handleCreate}>
              Create
            </Button>
          )}
        </Space>
      </div>

      {customHeader}

      <Table
        columns={finalColumns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={onTableChange}
      />

      {isModalVisible && fields && onSubmit && (
        <EditModal
          title={title}
          visible={isModalVisible}
          fields={fields}
          editingRecord={editingRecord}
          onClose={handleCloseModal}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}