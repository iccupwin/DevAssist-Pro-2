/**
 * UserManagement - Управление пользователями в админ панели
 * Согласно ТЗ DevAssist Pro
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  // XCircle, // Removed unused import
  Crown,
  User,
  // Calendar, // Removed unused import
  Activity,
  DollarSign,
  MoreVertical,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AdminUser, UserFilters, Pagination } from '../../types/admin';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { adminService } from '../../services/adminService';

interface UserManagementProps {
  className?: string;
}

// Mock данные пользователей
const mockUsers: AdminUser[] = [
  {
    id: 1,
    email: 'john.doe@example.com',
    full_name: 'Иван Петров',
    firstName: 'Иван',
    lastName: 'Петров',
    role: 'admin',
    avatar: '',
    isEmailVerified: true,
    is2FAEnabled: true,
    is_active: true,
    is_verified: true,
    is_superuser: true,
    lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    apiCallsCount: 1234,
    analysesCount: 89,
    totalCosts: 45.67,
    registrationSource: 'website',
    subscription: {
      plan: 'Professional',
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true
    },
    preferences: {
      language: 'ru',
      theme: 'dark',
      notifications: { email: true, push: true }
    },
    created_at: '2024-01-15T00:00:00Z',
    updated_at: new Date().toISOString(),
    lastLoginAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    email: 'jane.smith@example.com',
    full_name: 'Анна Козлова',
    firstName: 'Анна',
    lastName: 'Козлова',
    role: 'user',
    avatar: '',
    isEmailVerified: true,
    is2FAEnabled: false,
    is_active: true,
    is_verified: true,
    is_superuser: false,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    apiCallsCount: 456,
    analysesCount: 23,
    totalCosts: 12.34,
    registrationSource: 'google',
    subscription: {
      plan: 'Premium',
      status: 'active',
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: false
    },
    preferences: {
      language: 'ru',
      theme: 'light',
      notifications: { email: true, push: false }
    },
    created_at: '2024-02-10T00:00:00Z',
    updated_at: new Date().toISOString(),
    lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    email: 'mike.johnson@example.com',
    full_name: 'Михаил Сидоров',
    firstName: 'Михаил',
    lastName: 'Сидоров',
    role: 'user',
    avatar: '',
    isEmailVerified: false,
    is2FAEnabled: false,
    is_active: false,
    is_verified: false,
    is_superuser: false,
    lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    apiCallsCount: 12,
    analysesCount: 1,
    totalCosts: 0.89,
    registrationSource: 'website',
    subscription: {
      plan: 'Free',
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: false
    },
    preferences: {
      language: 'ru',
      theme: 'system',
      notifications: { email: false, push: false }
    },
    created_at: '2024-06-01T00:00:00Z',
    updated_at: new Date().toISOString(),
    lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const UserManagement: React.FC<UserManagementProps> = ({
  className = ''
}) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filters, setFilters] = useState<UserFilters>({});
  const [sortBy, setSortBy] = useState<keyof AdminUser>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [createAdminData, setCreateAdminData] = useState({
    email: '',
    password: '',
    full_name: '',
    company: '',
    position: '',
    phone: ''
  });
  const [createAdminError, setCreateAdminError] = useState<string | null>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Загружаем реальных пользователей при монтировании компонента
  useEffect(() => {
    loadUsers();
  }, [currentPage, pageSize]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getUsers(currentPage, pageSize, filters);
      if (response.success) {
        setUsers(response.data.users);
        setTotalUsers(response.data.total);
        setTotalPages(response.data.total_pages || Math.ceil(response.data.total / pageSize));
      } else {
        // Fallback к mock данным
        setUsers(mockUsers);
        setTotalUsers(mockUsers.length);
        setTotalPages(Math.ceil(mockUsers.length / pageSize));
      }
    } catch (error) {
      // Failed to load users - using fallback mock data
      // Fallback к mock данным
      setUsers(mockUsers);
      setTotalUsers(mockUsers.length);
      setTotalPages(Math.ceil(mockUsers.length / pageSize));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    setCreateAdminError(null);
    setIsCreatingAdmin(true);
    
    try {
      const response = await adminService.createAdmin(createAdminData);
      if (response.success) {
        // Успешно создан
        setShowCreateAdmin(false);
        setCreateAdminData({
          email: '',
          password: '',
          full_name: '',
          company: '',
          position: '',
          phone: ''
        });
        // Перезагрузить список пользователей
        await loadUsers();
      } else {
        setCreateAdminError(response.error || 'Failed to create admin');
      }
    } catch (error) {
      setCreateAdminError('An unexpected error occurred');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleToggleUserStatus = async (userId: number) => {
    try {
      const response = await adminService.toggleUserStatus(userId);
      if (response.success) {
        // Обновить статус пользователя в списке
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, is_active: response.data.is_active }
              : user
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  // Фильтрация и сортировка пользователей
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Применяем фильтры
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(user => 
        user.full_name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    if (filters.role) {
      result = result.filter(user => user.role === filters.role);
    }

    if (filters.status) {
      result = result.filter(user => {
        if (filters.status === 'active') return user.is_active;
        if (filters.status === 'banned') return !user.is_active;
        return true;
      });
    }

    if (filters.plan) {
      result = result.filter(user => user.subscription.plan === filters.plan);
    }

    // Сортировка
    result.sort((a, b) => {
      let aValue: string | number | boolean | Date = a[sortBy] as string | number | boolean | Date;
      let bValue: string | number | boolean | Date = b[sortBy] as string | number | boolean | Date;

      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, filters, sortBy, sortOrder]);

  // Пагинация
  const pagination: Pagination = {
    page: currentPage,
    pageSize,
    total: filteredAndSortedUsers.length,
    totalPages: Math.ceil(filteredAndSortedUsers.length / pageSize)
  };

  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: keyof AdminUser) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(user => Number(user.id)));
    }
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}м назад`;
    if (diffHours < 24) return `${diffHours}ч назад`;
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays}д назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Crown;
      case 'user': return User;
      default: return User;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-yellow-500';
      case 'user': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBadge = (user: AdminUser) => {
    if (!user.is_active) {
      return <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-full">Banned</span>;
    }
    if (user.subscription.plan === 'Premium' || user.subscription.plan === 'Professional') {
      return <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full">{user.subscription.plan}</span>;
    }
    return <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">Active</span>;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <Users className="h-8 w-8" />
            <span>User Management</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Manage users, roles, and permissions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowCreateAdmin(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать админа
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users by name or email..."
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 bg-gray-900 border-gray-600"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={filters.role || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value || undefined }))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Plan</label>
                <select
                  value={filters.plan || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, plan: e.target.value || undefined }))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">All Plans</option>
                  <option value="Free">Free</option>
                  <option value="Premium">Premium</option>
                  <option value="Professional">Professional</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-400">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">Ban Selected</Button>
              <Button size="sm" variant="outline">Upgrade Selected</Button>
              <Button size="sm" variant="outline">Export Selected</Button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                </th>
                <th 
                  className="p-4 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>User</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th 
                  className="p-4 text-left text-sm font-medium text-gray-300 cursor-pointer hover:text-white"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Role</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Activity</th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Stats</th>
                <th className="p-4 text-left text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paginatedUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <tr key={user.id} className="hover:bg-gray-700/50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(Number(user.id))}
                        onChange={() => handleSelectUser(Number(user.id))}
                        className="rounded border-gray-600 bg-gray-700"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.full_name}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <RoleIcon className={`h-4 w-4 ${getRoleColor(user.role)}`} />
                        <span className="text-gray-300 capitalize">{user.role}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(user)}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="text-gray-300">{formatLastActivity(user.lastActivity)}</p>
                        <p className="text-gray-500">
                          Joined {new Date(user.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-1 text-gray-300">
                          <Activity className="h-3 w-3" />
                          <span>{user.apiCallsCount} calls</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-300">
                          <DollarSign className="h-3 w-3" />
                          <span>${user.totalCosts.toFixed(2)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleToggleUserStatus(user.id)}
                          title={user.is_active ? 'Заблокировать пользователя' : 'Разблокировать пользователя'}
                        >
                          {user.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-900 px-4 py-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} users
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <span className="text-sm text-gray-400">
                Page {currentPage} of {pagination.totalPages}
              </span>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для создания администратора */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Создать администратора</h3>
            
            {createAdminError && (
              <div className="bg-red-900 border border-red-600 text-red-200 p-3 rounded mb-4">
                {createAdminError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email*
                </label>
                <Input
                  type="email"
                  value={createAdminData.email}
                  onChange={(e) => setCreateAdminData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Пароль*
                </label>
                <Input
                  type="password"
                  value={createAdminData.password}
                  onChange={(e) => setCreateAdminData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Минимум 8 символов"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Полное имя*
                </label>
                <Input
                  type="text"
                  value={createAdminData.full_name}
                  onChange={(e) => setCreateAdminData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Иван Петров"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Компания
                </label>
                <Input
                  type="text"
                  value={createAdminData.company}
                  onChange={(e) => setCreateAdminData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Название компании"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Должность
                </label>
                <Input
                  type="text"
                  value={createAdminData.position}
                  onChange={(e) => setCreateAdminData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Системный администратор"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Телефон
                </label>
                <Input
                  type="tel"
                  value={createAdminData.phone}
                  onChange={(e) => setCreateAdminData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateAdmin(false);
                  setCreateAdminError(null);
                  setCreateAdminData({
                    email: '',
                    password: '',
                    full_name: '',
                    company: '',
                    position: '',
                    phone: ''
                  });
                }}
                disabled={isCreatingAdmin}
              >
                Отмена
              </Button>
              <Button
                onClick={handleCreateAdmin}
                disabled={
                  isCreatingAdmin || 
                  !createAdminData.email || 
                  !createAdminData.password || 
                  !createAdminData.full_name
                }
              >
                {isCreatingAdmin ? 'Создание...' : 'Создать администратора'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;