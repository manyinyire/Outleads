'use client'

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store';
import { fetchDashboardData } from '@/lib/store/slices/adminSlice';
import { Row, Col, Card, Statistic, Typography, Table, Tag } from 'antd';
import { UserOutlined, BulbOutlined, TrophyOutlined, DollarOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { leads, campaigns, loading } = useSelector((state: RootState) => state.admin);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Campaign',
      dataIndex: ['campaign', 'name'],
      key: 'campaign',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          new: 'blue',
          contacted: 'orange',
          qualified: 'green',
          converted: 'purple',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Dashboard Overview
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Leads"
              value={leads.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Active Campaigns"
              value={campaigns.length}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Conversion Rate"
              value={18.5} // TODO: Calculate conversion rate
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Revenue Pipeline"
              value={2.4} // TODO: Calculate revenue pipeline
              prefix={<DollarOutlined />}
              suffix="M"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Recent Leads"
        style={{ marginBottom: '24px' }}
        loading={loading}
      >
        <Table
          columns={columns}
          dataSource={leads}
          pagination={false}
          size="small"
          rowKey="id"
        />
      </Card>
    </div>
  );
}
