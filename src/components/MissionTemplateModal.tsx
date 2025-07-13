import { useState, useEffect } from 'react';
import { MissionTemplateService } from '../services/missionTemplateService';
import type { MissionTemplate, Mission } from '../types/mission';

interface MissionTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFromTemplate: (template: MissionTemplate, missionName: string) => void;
  currentMission?: Mission; // For saving current mission as template
}

export function MissionTemplateModal({ 
  isOpen, 
  onClose, 
  onCreateFromTemplate,
  currentMission 
}: MissionTemplateModalProps) {
  const [templates, setTemplates] = useState<MissionTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'save' | 'common'>('browse');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [newMissionName, setNewMissionName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MissionTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = () => {
    setTemplates(MissionTemplateService.getTemplates());
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !currentMission) return;

    setIsSaving(true);
    try {
      const template = MissionTemplateService.createTemplateFromMission(
        currentMission,
        templateName.trim(),
        templateDescription.trim() || undefined
      );
      
      setTemplates(prev => [...prev, template]);
      setTemplateName('');
      setTemplateDescription('');
      setActiveTab('browse');
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      MissionTemplateService.deleteTemplate(templateId);
      loadTemplates();
    }
  };

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate || !newMissionName.trim()) return;
    
    onCreateFromTemplate(selectedTemplate, newMissionName.trim());
    setNewMissionName('');
    setSelectedTemplate(null);
    onClose();
  };

  const handleCreateFromCommon = (commonTemplate: Omit<MissionTemplate, 'id' | 'created'>) => {
    if (!newMissionName.trim()) return;

    // Save as template first, then create mission
    const template = MissionTemplateService.saveTemplate(commonTemplate);
    onCreateFromTemplate(template, newMissionName.trim());
    setNewMissionName('');
    onClose();
  };

  if (!isOpen) return null;

  const commonTemplates = MissionTemplateService.getCommonFPFConfigurations();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              <i className="fas fa-save mr-2"></i>
              Mission Templates
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-xl"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'browse'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="fas fa-folder-open mr-2"></i>
              Browse Templates
            </button>
            <button
              onClick={() => setActiveTab('common')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'common'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="fas fa-star mr-2"></i>
              Common Configurations
            </button>
            {currentMission && (
              <button
                onClick={() => setActiveTab('save')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'save'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="fas fa-plus mr-2"></i>
                Save Current Mission
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Browse Templates Tab */}
          {activeTab === 'browse' && (
            <div>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-inbox text-4xl mb-4"></i>
                  <p>No templates saved yet.</p>
                  <p className="text-sm">Save your current mission or use a common configuration.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          {template.description && (
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Created: {template.created.toLocaleDateString()} • 
                            {template.fpfTargets.length} FPF targets • 
                            {template.numberOfGuns} guns
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="text-red-500 hover:text-red-700 ml-4"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Common Configurations Tab */}
          {activeTab === 'common' && (
            <div className="space-y-4">
              {commonTemplates.map((template, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        {template.fpfTargets.length} FPF targets • 
                        {template.numberOfGuns} guns
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (newMissionName.trim()) {
                          handleCreateFromCommon(template);
                        } else {
                          alert('Please enter a mission name first');
                        }
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save Current Mission Tab */}
          {activeTab === 'save' && currentMission && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe this template configuration..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Current Mission Preview:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Position: {currentMission.mortarPosition || 'Not set'}</div>
                  <div>Guns: {currentMission.numberOfGuns}</div>
                  <div>FPF Targets: {currentMission.fpfTargets?.length || 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          {activeTab === 'browse' && selectedTemplate && (
            <div className="flex items-center justify-between">
              <div>
                <input
                  type="text"
                  value={newMissionName}
                  onChange={(e) => setNewMissionName(e.target.value)}
                  placeholder="Enter new mission name..."
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFromTemplate}
                  disabled={!newMissionName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Mission
                </button>
              </div>
            </div>
          )}

          {activeTab === 'common' && (
            <div className="flex items-center justify-between">
              <div>
                <input
                  type="text"
                  value={newMissionName}
                  onChange={(e) => setNewMissionName(e.target.value)}
                  placeholder="Enter mission name for template..."
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          )}

          {activeTab === 'save' && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim() || isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
