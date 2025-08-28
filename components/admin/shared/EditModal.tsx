import { useEffect } from 'react';
import { Modal, Form, Button, Space } from 'antd';
import { CrudField } from './CrudTable';
import { TextField, SelectField } from '@/components/admin/form-fields';

interface EditModalProps<T> {
  title: string;
  visible: boolean;
  fields: CrudField[];
  editingRecord: T | null;
  onClose: () => void;
  onSubmit: (values: any, record: T | null) => Promise<void>;
  isViewOnly?: boolean;
}

export default function EditModal<T>({ title, visible, fields, editingRecord, onClose, onSubmit, isViewOnly }: EditModalProps<T>) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingRecord) {
      form.setFieldsValue(editingRecord);
    } else {
      form.resetFields();
    }
  }, [editingRecord, form, visible]);

  const modalTitle = isViewOnly ? `View ${title}` : (editingRecord ? `Edit ${title}` : `Add New ${title}`);
  const modalFooter = isViewOnly ? [<Button key="back" onClick={onClose}>Close</Button>] : null;

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={onClose}
      footer={modalFooter}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={(values) => onSubmit(values, editingRecord)}>
        {fields.map(field => {
          const isReadOnly = !!editingRecord && (field.name === 'name' || field.name === 'email');
          const fieldProps = { ...field, readOnly: isViewOnly || isReadOnly || field.readOnly, disabled: isViewOnly || isReadOnly || field.readOnly };

          return field.type === 'select' ?
            <SelectField key={field.name} field={fieldProps} /> :
            <TextField key={field.name} field={fieldProps} />;
        })}
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
  );
}
