import { useState, useCallback, useEffect } from 'react';
import { TablePaginationConfig } from 'antd';
import { App } from 'antd';
import moment from 'moment';
import api from '@/lib/api/api';

interface Lead {
  id: string;
  fullName: string;
  phoneNumber: string;
  businessSector: { name: string };
  products: Array<{ id: string; name: string }>;
  campaign?: { id: string; campaign_name: string };
  assignedTo?: { name: string };
  createdAt: string;
}

interface FilterData {
  products: Array<{ id: string; name: string }>;
  campaigns: Array<{ id: string; campaign_name: string }>;
  sectors: Array<{ id: string; name: string }>;
  agents: Array<{ id: string; name: string }>;
}

export function useLeads() {
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
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
    agents: [],
  });
  const [searchText, setSearchText] = useState('');
  const { message } = App.useApp();

  const fetchFilterData = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token');
      
      const [productsRes, campaignsRes, sectorsRes, agentsRes] = await Promise.all([
        fetch('/api/admin/products?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch('/api/admin/campaigns?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch('/api/admin/sectors?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
        fetch('/api/admin/users?role=AGENT&status=ACTIVE&limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()),
      ]);

      setFilterData({
        products: Array.isArray(productsRes.data) ? productsRes.data : [],
        campaigns: Array.isArray(campaignsRes.data) ? campaignsRes.data : [],
        sectors: Array.isArray(sectorsRes.data) ? sectorsRes.data : [],
        agents: Array.isArray(agentsRes.data) ? agentsRes.data : [],
      });
    } catch (error) {
      console.error("Failed to fetch filter data:", error);
      message.error('Failed to load filter options.');
    }
  }, [message]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      const url = new URL('/api/admin/leads', window.location.origin);
      url.searchParams.set('page', String(pagination.current));
      url.searchParams.set('limit', String(pagination.pageSize));
      
      if (searchText) url.searchParams.set('search', searchText);
      if (filters.productId) url.searchParams.set('productId', filters.productId);
      if (filters.campaignId) url.searchParams.set('campaignId', filters.campaignId);
      if (filters.sectorId) url.searchParams.set('sectorId', filters.sectorId);
      if (filters.dateRange?.[0]) url.searchParams.set('startDate', filters.dateRange[0].toISOString());
      if (filters.dateRange?.[1]) url.searchParams.set('endDate', filters.dateRange[1].toISOString());
      
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch leads');
      
      const result = await response.json();
      setData(Array.isArray(result.data) ? result.data : []);
      setPagination(prev => ({ ...prev, total: result.meta?.total || 0 }));
    } catch (error) {
      console.error("Fetch error:", error);
      message.error('Failed to load leads.');
    } finally {
      setLoading(false);
    }
  }, [searchText, message, filters, pagination.current, pagination.pageSize]);

  useEffect(() => {
    fetchFilterData();
  }, [fetchFilterData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, pagination.current, pagination.pageSize, searchText, filters]);

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
    setSearchText(value);
  };

  return {
    data,
    loading,
    pagination,
    filters,
    filterData,
    fetchData,
    handleTableChange,
    handleFilterChange,
    clearFilters,
    handleSearch,
  };
}
