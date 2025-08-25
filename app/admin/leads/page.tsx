'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Tag, Row, Col, Select, DatePicker, Button, TablePaginationConfig } from 'antd'
import { ColumnsType } from 'antd/es/table'
import CrudTable from '@/components/admin/CrudTable'
import LeadDetailModal from '@/components/admin/LeadDetailModal'
import moment from 'moment'
import { EyeOutlined } from '@ant-design/icons'
import api from '@/lib/api';

const { RangePicker } = DatePicker;

interface Lead {
  id: string
  fullName: string
  phoneNumber: string
  businessSector: { name: string }
  products: Array<{ id: string, name: string }>
  campaign?: { id: string, campaign_name: string }
  createdAt: string
}

interface FilterData {
  products: Array<{ id: string, name: string }>
  campaigns: Array<{ id: string, campaign_name: string }>
  sectors: Array<{ id: string, name: string }>
}

export default function LeadsPage() {
  const [data, setData] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [isViewModalVisible, setViewModalVisible] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<{
    productId: string | undefined;
    campaignId: string | undefined;
    sectorId: string | undefined;
    dateRange: [moment.Moment, moment.Moment] | undefined;
  }>({
    productId: undefined,
    campaignId: undefined,
    sectorId: undefined,
    dateRange: undefined,
  });
  const [filterData, setFilterData] = useState<FilterData>({
    products: [],
    campaigns: [],
    sectors: [],
  })

  const { message } = App.useApp()

  const fetchFilterData = useCallback(async () => {
    try {
      const [productsRes, campaignsRes, sectorsRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/campaigns'),
        api.get('/admin/sectors'),
      ]);

      setFilterData({
        products: productsRes.data.data || [],
        campaigns: campaignsRes.data.data || [],
        sectors: sectorsRes.data.data || [],
      });
    } catch (error) {
      console.error("Failed to fetch filter data:", error);
      message.error('Failed to load filter options.');
    }
  }, [message]);

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/leads', {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
          search: searchText,
          productId: filters.productId,
          campaignId: filters.campaignId,
          sectorId: filters.sectorId,
          startDate: filters.dateRange?.[0]?.toISOString(),
          endDate: filters.dateRange?.[1]?.toISOString(),
        }
      });
      setData(data.data || []);
      setPagination(prev => ({ ...prev, total: data.meta.total }));
    } catch (error) {
      console.error("Fetch error:", error)
      message.error('Failed to load leads.')
    } finally {
      setLoading(false)
    }
  }, [searchText, message, filters, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData])

  useEffect(() => {
    fetchData();
  }, [fetchData, filters])

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPagination(pagination);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      productId: undefined,
      campaignId: undefined,
      sectorId: undefined,
      dateRange: undefined,
    });
  };

  const handleSearch = (value: string) => {
    setSearchText(value)
  }

  const handleView = (record: Lead) => {
    setSelectedLead(record)
    setViewModalVisible(true)
  }

  const columns: ColumnsType<Lead> = useMemo(() => [
    { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Phone', dataIndex: 'phoneNumber', key: 'phoneNumber' },
    { title: 'Sector', dataIndex: ['businessSector', 'name'], key: 'sector' },
    {
      title: 'Products',
      dataIndex: 'products',
      key: 'products',
      render: (products: Array<{ name: string }>) => (
        <>
          {products.map(p => <Tag key={p.name}>{p.name}</Tag>)}
        </>
      ),
    },
    { 
      title: 'Campaign', 
      dataIndex: 'campaign', 
      key: 'campaign',
      render: (campaign) => campaign ? <Tag color="blue">{campaign.campaign_name}</Tag> : <Tag>Direct Lead</Tag>
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (date) => new Date(date).toLocaleDateString() },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
          View
        </Button>
      ),
    },
  ], [])

  const filterOptions = (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col>
        <Select
          placeholder="Filter by Product"
          style={{ width: 200 }}
          onChange={(value) => handleFilterChange('productId', value)}
          value={filters.productId}
          allowClear
        >
          {filterData.products.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
        </Select>
      </Col>
      <Col>
        <Select
          placeholder="Filter by Campaign"
          style={{ width: 200 }}
          onChange={(value) => handleFilterChange('campaignId', value)}
          value={filters.campaignId}
          allowClear
        >
          {filterData.campaigns.map(c => <Select.Option key={c.id} value={c.id}>{c.campaign_name}</Select.Option>)}
        </Select>
      </Col>
      <Col>
        <Select
          placeholder="Filter by Sector"
          style={{ width: 200 }}
          onChange={(value) => handleFilterChange('sectorId', value)}
          value={filters.sectorId}
          allowClear
        >
          {filterData.sectors.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
        </Select>
      </Col>
      <Col>
        <RangePicker 
          onChange={(dates) => handleFilterChange('dateRange', dates)}
          value={filters.dateRange as any}
        />
      </Col>
      <Col>
        <Button onClick={clearFilters}>Clear Filters</Button>
      </Col>
    </Row>
  );

  return (
    <>
      <CrudTable<Lead>
        title="Lead Management"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onTableChange={handleTableChange}
        onSearch={handleSearch}
        customHeader={filterOptions}
        hideDefaultActions={true}
      />
      <LeadDetailModal
        lead={selectedLead}
        visible={isViewModalVisible}
        onClose={() => setViewModalVisible(false)}
      />
    </>
  )
}
