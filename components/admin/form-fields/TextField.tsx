'use client'

import { Form, Input } from 'antd'
import { CrudField } from '../shared/CrudTable'

interface TextFieldProps {
  readonly field: CrudField
  readonly disabled?: boolean
}

export default function TextField({ field, disabled }: TextFieldProps) {
  const getInputComponent = () => {
    if (field.type === 'textarea') return Input.TextArea;
    if (field.type === 'password') return Input.Password;
    return Input;
  };

  const InputComponent = getInputComponent();

  return (
    <Form.Item
      name={field.name}
      label={field.label}
      rules={[
        { required: field.required, message: `Please enter ${field.label}` },
        ...(field.type === 'email' ? [{ type: 'email' as const, message: 'Please enter a valid email' }] : []),
        ...(field.rules || [])
      ]}
    >
      <InputComponent
        placeholder={field.placeholder || `Enter ${field.label}`}
        disabled={disabled}
        readOnly={field.readOnly}
        type={field.type === 'number' ? 'number' : undefined}
      />
    </Form.Item>
  )
}
