/**
 * Диалог сохранения результатов анализа в проект
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useAnalysisStorage } from '../../hooks/useAnalysisStorage';
import { StoredProject } from '../../services/storage/analysisStorage';
import { AnalysisResult, ComparisonResult, Document } from '../../types/kpAnalyzer';
import { Save, FolderPlus, Check, AlertCircle, X } from 'lucide-react';

interface SaveAnalysisDialogProps {
  documents: Document[];
  results: AnalysisResult[];
  comparison: ComparisonResult;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (analysisId: string) => void;
}

const SaveAnalysisDialog: React.FC<SaveAnalysisDialogProps> = ({
  documents,
  results,
  comparison,
  isOpen,
  onClose,
  onSaved
}) => {
  const {
    saving,
    error,
    saveAnalysisResults,
    createProject,
    getProjects,
    clearError
  } = useAnalysisStorage();

  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    projectType: 'residential'
  });
  const [analysisName, setAnalysisName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
      generateDefaultAnalysisName();
      setSaveSuccess(false);
      clearError();
    }
  }, [isOpen]);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess, onClose]);

  const loadProjects = async () => {
    try {
      const projectList = await getProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const generateDefaultAnalysisName = () => {
    const date = new Date().toLocaleDateString('ru-RU');
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    setAnalysisName(`Анализ КП ${date} ${time}`);
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    try {
      const projectId = await createProject(newProject);
      await loadProjects();
      setSelectedProject(projectId);
      setShowCreateProject(false);
      setNewProject({ name: '', description: '', projectType: 'residential' });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleSave = async () => {
    try {
      const selectedProjectData = projects.find(p => p.id === selectedProject);
      
      const analysisId = await saveAnalysisResults(
        documents,
        results,
        {
          ...comparison,
          name: analysisName.trim() || `Анализ ${new Date().toLocaleString('ru-RU')}`
        },
        selectedProject || undefined,
        selectedProjectData?.name
      );

      setSaveSuccess(true);
      
      if (onSaved) {
        onSaved(analysisId);
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Save className="w-5 h-5 mr-2" />
                Сохранить результаты анализа
              </CardTitle>
              <CardDescription>
                Сохраните анализ в проект для дальнейшего использования и сравнения
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Информация об анализе */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Результаты анализа</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Документов:</span>
                <div className="font-medium">{documents.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Общий балл:</span>
                <div className="font-medium">
                  <Badge variant="outline">
                    {comparison.overallScore?.toFixed(1) || 'N/A'}/100
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Рекомендаций:</span>
                <div className="font-medium">{comparison.recommendations?.length || 0}</div>
              </div>
            </div>
          </div>

          {/* Название анализа */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Название анализа
            </label>
            <Input
              placeholder="Введите название для анализа"
              value={analysisName}
              onChange={(e) => setAnalysisName(e.target.value)}
            />
          </div>

          {/* Выбор проекта */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Проект
            </label>
            
            {!showCreateProject ? (
              <div className="flex items-center space-x-2">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Выберите проект или создайте новый" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Без проекта</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{project.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {getProjectTypeLabel(project.projectType)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateProject(true)}
                >
                  <FolderPlus className="w-4 h-4 mr-1" />
                  Новый
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium">Создать новый проект</h4>
                
                <Input
                  placeholder="Название проекта"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                />
                
                <Input
                  placeholder="Описание (необязательно)"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                />
                
                <Select 
                  value={newProject.projectType} 
                  onValueChange={(value) => setNewProject({...newProject, projectType: value})}
                >
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
                
                <div className="flex items-center space-x-2">
                  <Button onClick={handleCreateProject} size="sm">
                    Создать проект
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCreateProject(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Статус сохранения */}
          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-700">Анализ успешно сохранен!</span>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              Анализ будет сохранен локально и синхронизирован с сервером
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Отмена
              </Button>
              
              <Button 
                onClick={handleSave} 
                disabled={saving || !analysisName.trim()}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaveAnalysisDialog;