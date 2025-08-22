'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Tag, Row, Col, Select, DatePicker, Button } from 'antd'
import { ColumnsType } from 'antd/es/table'
import CrudTable, { CrudField } from '@/components/admin/CrudTable'
import moment from 'moment'

const { RangePicker } = DatePicker;

interface Lead {
  id: string
  fullName: string
  phoneNumber: string
  businessSector: { name: string }
  products: Array<{ id: string, name: string }>
  campaign?: { id: string, campaign_name: string } // Corrected field name
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
  const [isModalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Lead | null>(null)
  const [filters, setFilters] = useState({
    productId: undefined,
    campaignId: undefined,
    sectorId: undefined,
    dateRange: undefined,
  })
  const [filterData, setFilterData] = useState<FilterData>({
    products: [],
    campaigns: [],
    sectors: [],
  })

  const { message } = App.useApp()

  const fetchFilterData = useCallback(async () => {
    const token = localStorage.getItem('auth-token')
    if (!token) return;

    try {
      const [productsRes, campaignsRes, sectorsRes] = await Promise.all([
        fetch('/api/admin/products', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/campaigns', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/sectors', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      const products = await productsRes.json();
      const campaigns = await campaignsRes.json();
      const sectors = await sectorsRes.json();

      setFilterData({
        products: products.product || [],
        campaigns: campaigns || [], // Campaigns API returns an array directly
        sectors: sectors.sector || [],
      });
    } catch (error) {
      console.error("Failed to fetch filter data:", error);
      message.error('Failed to load filter options.');
    }
  }, [message]);

  const fetchData = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('auth-token')
    if (!token) {
      message.error("Authentication token not found.");
      setLoading(false);
      return;
    }

    try {
      const url = new URL('/api/admin/leads', window.location.origin)
      if (searchText) url.searchParams.set('search', searchText)
      if (filters.productId) url.searchParams.set('productId', filters.productId)
      if (filters.campaignId) url.searchParams.set('campaignId', filters.campaignId)
      if (filters.sectorId) url.searchParams.set('sectorId', filters.sectorId)
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        url.searchParams.set('startDate', moment(filters.dateRange[0]).toISOString())
        url.searchParams.set('endDate', moment(filters.dateRange[1]).toISOString())
      }
      
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`)
      
      const result = await response.json()
      setData(result.lead || [])
      
    } catch (error) {
      console.error("Fetch error:", error)
      message.error('Failed to load leads.')
    } finally {
      setLoading(false)
    }
  }, [searchText, message, filters])

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData])

  useEffect(() => {
    fetchData();
  }, [fetchData, filters])

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

  const handleEdit = (record: Lead) => {
    setEditingRecord(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    // Implement delete logic here if needed
  }

  const handleSubmit = async (values: any, record: Lead | null) => {
    // Implement create/update logic here if needed
  }

  const fields: CrudField[] = useMemo(() => [
    { name: 'fullName', label: 'Name', type: 'text', required: true },
    { name: 'phoneNumber', label: 'Phone', type: 'text', required: true },
  ], [])

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
    <CrudTable<Lead>
      title="Lead Management"
      columns={columns}
      fields={fields}
      dataSource={data}
      loading={loading}
      onSearch={handleSearch}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSubmit={handleSubmit}
      isModalVisible={isModalVisible}
      closeModal={() => {
        setModalVisible(false)
        setEditingRecord(null)
      }}
      editingRecord={editingRecord}
      customHeader={filterOptions}
    />
  )
}