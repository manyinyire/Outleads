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
      const [productsRes, campaignsRes, sectorsRes, agentsRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/campaigns'),
        api.get('/admin/sectors'),
        api.get('/admin/users?role=AGENT'),
      ]);

      setFilterData({
        products: productsRes.data.data || [],
        campaigns: campaignsRes.data.data || [],
        sectors: sectorsRes.data.data || [],
        agents: agentsRes.data.data || [],
      });
    } catch (error) {
      console.error("Failed to fetch filter data:", error);
      message.error('Failed to load filter options.');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
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
        },
      });
      setData(data.data || []);
      setPagination(prev => ({ ...prev, total: data.meta.total }));
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
  }, [fetchData]);

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
