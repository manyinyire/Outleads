'use client'

import { useEffect, useState } from 'react'
import { Table, Button, Card, Typography, Space, Modal, Form, Input, Switch, Tag, message } from 'antd'
import { PlusOutlined, CopyOutlined, EditOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/lib/store'
import { fetchCampaigns, createCampaign, toggleCampaignStatus } from '@/lib/store/slices/campaignSlice'

const { Title, Text } = Typography
const { TextArea } = Input

export default function CampaignsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { campaigns, loading, creating } = useSelector((state: RootState) => state.campaign)
  
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    dispatch(fetchCampaigns())
  }, [dispatch])

  const handleCreateCampaign = async (values: any) => {
    try {
      await dispatch(createCampaign(values)).unwrap()
      message.success('Campaign created successfully!')
      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error('Failed to create campaign')
    }
  }

  const handleToggleStatus = (campaignId: string) => {
    dispatch(toggleCampaignStatus(campaignId))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('URL copied to clipboard!')
  }

  const columns = [
    {
      title: 'Campaign Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Company',
      dataIndex: 'companyName',
      key: 'companyName',
    },
    {
      title: 'Campaign URL',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text code style={{ maxWidth: '300px' }} ellipsis>
            {url}
          </Text>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(url)}
            size="small"
          />
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: any) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleStatus(record.id)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Leads',
      dataIndex: 'leadCount',
      key: 'leadCount',
      sorter: (a: any, b: any) => a.leadCount - b.leadCount,
    },
    {
      title: 'Conversion Rate',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      render: (rate: number) => `${rate}%`,
      sorter: (a: any, b: any) => a.conversionRate - b.conversionRate,
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>Campaign Management</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Create Campaign
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={campaigns}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} campaigns`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="Create New Campaign"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateCampaign}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="Campaign Name"
            rules={[
              { required: true, message: 'Please enter campaign name' },
              { min: 3, message: 'Campaign name must be at least 3 characters' }
            ]}
          >
            <Input placeholder="Enter campaign name" />
          </Form.Item>

          <Form.Item
            name="companyName"
            label="Company Name"
            rules={[
              { required: true, message: 'Please enter company name' },
              { min: 2, message: 'Company name must be at least 2 characters' }
            ]}
          >
            <Input placeholder="Enter company name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please enter campaign description' },
              { min: 10, message: 'Description must be at least 10 characters' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter campaign description"
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: '24px' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false)
                form.resetFields()
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={creating}>
                Create Campaign
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
