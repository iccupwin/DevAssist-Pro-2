import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { analysisStorage, StoredAnalysis, StoredProject } from '../services/storage/analysisStorage';
import { Clock, FileText, Download, Search, Filter, FolderOpen, Plus, RefreshCw } from 'lucide-react';

interface AnalysisHistoryProps {}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = () => {
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ success: number; failed: number } | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', projectType: 'residential' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analysisHistory, projectList] = await Promise.all([
        analysisStorage.getAnalysisHistory(50),
        analysisStorage.getProjects()
      ]);
      
      setAnalyses(analysisHistory);
      setProjects(projectList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      const result = await analysisStorage.syncPendingData();
      setSyncStatus(result);
      await loadData(); // Перезагружаем данные после синхронизации
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;
    
    try {
      await analysisStorage.saveProject(newProject);
      setNewProject({ name: '', description: '', projectType: 'residential' });
      setShowCreateProject(false);
      await loadData();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesProject = selectedProject === 'all' || analysis.projectId === selectedProject;
    const matchesSearch = searchQuery === '' || 
      analysis.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      analysis.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesProject && matchesSearch;
  });

  const getSyncStatusBadge = (status: StoredAnalysis['syncStatus']) => {
    const variants: Record<StoredAnalysis['syncStatus'], { variant: any; label: string }> = {
      local: { variant: 'secondary', label: 'Локально' },
      synced: { variant: 'default', label: 'Синхронизировано' },
      sync_pending: { variant: 'outline', label: 'Ожидает синхронизации' },
      sync_failed: { variant: 'destructive', label: 'Ошибка синхронизации' }
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProjectTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      residential: 'Жилое строительство',
      commercial: 'Коммерческое строительство',
      industrial: 'Промышленное строительство',
      infrastructure: 'Инфраструктура'
    };
    return types[type] || type;
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Заголовок и управление */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">История анализов</h1>
          <p className="text-gray-600 mt-2">
            Управление проектами и результатами анализа коммерческих предложений
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {syncStatus && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
              Синхронизация: {syncStatus.success} успешно, {syncStatus.failed} ошибок
            </div>
          )}
          
          <Button onClick={handleSync} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Синхронизировать
          </Button>
          
          <Button onClick={() => setShowCreateProject(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Новый проект
          </Button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Поиск по названию проекта или ID анализа..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Фильтр по проекту" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все проекты</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="analyses" className="w-full">
        <TabsList>
          <TabsTrigger value="analyses">
            <FileText className="w-4 h-4 mr-2" />
            Анализы ({filteredAnalyses.length})
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FolderOpen className="w-4 h-4 mr-2" />
            Проекты ({projects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analyses" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Загрузка анализов...</p>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedProject !== 'all' 
                    ? 'Не найдено анализов по заданным критериям'
                    : 'У вас пока нет сохраненных анализов'
                  }
                </p>
                <Button variant="outline" onClick={() => window.location.href = '/kp-analyzer'}>
                  Создать первый анализ
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAnalyses.map((analysis) => (
                <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {analysis.projectName || `Анализ ${analysis.id.slice(-8)}`}
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-1">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDate(analysis.timestamp)}
                          </span>
                          <span>{analysis.documents.length} документ(ов)</span>
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getSyncStatusBadge(analysis.syncStatus)}
                        <Badge variant="outline">
                          {analysis.comparison.overallScore?.toFixed(1) || 'N/A'}/100
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {analysis.comparison.summary && (
                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {analysis.comparison.summary}
                      </p>
                    )}
                    
                    {analysis.comparison.recommendations && analysis.comparison.recommendations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Ключевые рекомендации:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {analysis.comparison.recommendations.slice(0, 2).map((rec, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {analysis.results.length > 0 && (
                          <span>Модель: {analysis.results[0].metadata?.aiProvider || 'N/A'}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-1" />
                          Просмотр
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Экспорт
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">У вас пока нет проектов</p>
                <Button onClick={() => setShowCreateProject(true)}>
                  Создать первый проект
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {getSyncStatusBadge(project.syncStatus)}
                    </div>
                    <CardDescription>
                      {getProjectTypeLabel(project.projectType)}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {project.description && (
                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>Создан: {formatDate(project.createdAt)}</span>
                      <span>{project.analysesCount} анализов</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Открыть
                      </Button>
                      <Button variant="ghost" size="sm">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Модальное окно создания проекта */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Новый проект</CardTitle>
              <CardDescription>
                Создайте проект для группировки связанных анализов
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Название проекта</label>
                <Input
                  placeholder="Например: ЖК Северный квартал"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Описание (необязательно)</label>
                <Input
                  placeholder="Краткое описание проекта"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Тип проекта</label>
                <Select value={newProject.projectType} onValueChange={(value) => setNewProject({...newProject, projectType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Жилое строительство</SelectItem>
                    <SelectItem value="commercial">Коммерческое строительство</SelectItem>
                    <SelectItem value="industrial">Промышленное строительство</SelectItem>
                    <SelectItem value="infrastructure">Инфраструктура</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-3 pt-4">
                <Button onClick={handleCreateProject} className="flex-1">
                  Создать проект
                </Button>
                <Button variant="outline" onClick={() => setShowCreateProject(false)}>
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;