'use client'

import { Card, Typography, Row, Col, Statistic, Empty } from 'antd'
import { BarChartOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons'

const { Title } = Typography

export default function ReportsPage() {
  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Reports & Analytics
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Leads This Month"
              value={45}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Conversion Rate"
              value={22.5}
              suffix="%"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Campaigns"
              value={8}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Empty
          description="Advanced analytics and reporting features coming soon"
          style={{ padding: '60px 0' }}
        />
      </Card>
    </div>
  )
}
