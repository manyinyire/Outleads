'use client'

import { Form, Input } from 'antd'
import { CrudField } from '../CrudTable'

interface TextFieldProps {
  field: CrudField
  disabled?: boolean
}

export default function TextField({ field, disabled }: TextFieldProps) {
  const InputComponent = field.type === 'textarea' ? Input.TextArea : 
                         field.type === 'password' ? Input.Password : Input

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
        type={field.type === 'number' ? 'number' : undefined}
      />
    </Form.Item>
  )
}
