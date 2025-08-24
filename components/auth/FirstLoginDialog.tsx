'use client'

import { Modal, Form, Select, Button, Typography } from 'antd'

const { Text } = Typography
const { Option } = Select

interface FirstLoginDialogProps {
  visible: boolean
  user: { name: string; email: string }
  onFinish: (values: { role: string }) => void
  onCancel: () => void
}

export default function FirstLoginDialog({ visible, user, onFinish, onCancel }: FirstLoginDialogProps) {
  return (
    <Modal
      title="Welcome! Please complete your registration."
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closable={false}
    >
      <p>Your details have been fetched from the domain. Please select your desired role to apply for access.</p>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item label="Name">
          <Text>{user.name}</Text>
        </Form.Item>
        <Form.Item label="Email">
          <Text>{user.email}</Text>
        </Form.Item>
        <Form.Item
          name="role"
          label="Role"
          rules={[{ required: true, message: 'Please select a role' }]}
        >
          <Select placeholder="Select your role">
            <Option value="ADMIN">Admin</Option>
            <Option value="BSS">BSS</Option>
            <Option value="INFOSEC">InfoSec</Option>
            <Option value="AGENT">Agent</Option>
            <Option value="SUPERVISOR">Supervisor</Option>
            <Option value="TEAMLEADER">Team Leader</Option>
            <Option value="EMPLOYEE">Employee</Option>
            <Option value="MANAGER">Manager</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Apply for Access
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
