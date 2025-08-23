'use client'

import { Modal, Typography, Tag, Row, Col, Card } from 'antd'
import { UserOutlined, PhoneOutlined, BankOutlined, ShoppingOutlined } from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface Lead {
  id: string
  fullName: string
  phoneNumber: string
  businessSector: { name: string }
  products: Array<{ id: string, name: string }>
  campaign?: { id: string, campaign_name: string }
  createdAt: string
}

interface LeadDetailModalProps {
  lead: Lead | null
  visible: boolean
  onClose: () => void
}

const DetailItem = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
    <div style={{ marginRight: '1rem', color: '#2A4D74' }}>{icon}</div>
    <div>
      <Text strong style={{ display: 'block', color: '#2A4D74' }}>{title}</Text>
      <Text>{children}</Text>
    </div>
  </div>
);

export default function LeadDetailModal({ lead, visible, onClose }: LeadDetailModalProps) {
  if (!lead) return null

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ color: '#2A4D74', marginRight: '0.75rem' }} />
          <Title level={4} style={{ margin: 0, color: '#2A4D74' }}>
            Lead Details
          </Title>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Card style={{ marginTop: '1rem', border: 'none' }}>
        <Title level={5} style={{ marginBottom: '1.5rem' }}>{lead.fullName}</Title>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <DetailItem icon={<PhoneOutlined />} title="Phone Number">
              {lead.phoneNumber}
            </DetailItem>
          </Col>
          <Col span={24}>
            <DetailItem icon={<BankOutlined />} title="Business Sector">
              {lead.businessSector.name}
            </DetailItem>
          </Col>
          <Col span={24}>
            <DetailItem icon={<ShoppingOutlined />} title="Products of Interest">
              <div>
                {lead.products.map(p => (
                  <Tag key={p.id} color="cyan" style={{ marginRight: '0.5rem', marginBottom: '0.5rem' }}>
                    {p.name}
                  </Tag>
                ))}
              </div>
            </DetailItem>
          </Col>
        </Row>
      </Card>
    </Modal>
  )
}