'use client'

import { Form, Select } from 'antd'
import { CrudField } from '../CrudTable'

interface SelectFieldProps {
  field: CrudField
  disabled?: boolean
}

export default function SelectField({ field, disabled }: SelectFieldProps) {
  return (
    <Form.Item
      name={field.name}
      label={field.label}
      rules={[
        { required: field.required, message: `Please select ${field.label}` },
        ...(field.rules || [])
      ]}
    >
      <Select
        placeholder={field.placeholder || `Select ${field.label}`}
        disabled={disabled}
      >
        {field.options?.map(option => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  )
}
