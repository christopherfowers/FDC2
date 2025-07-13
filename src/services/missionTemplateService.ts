import type { MissionTemplate, Mission, CreateMissionData } from '../types/mission';

/**
 * Service for managing mission templates - saved mission configurations
 * that can be reused for quick mission setup
 */
export class MissionTemplateService {
  private static readonly STORAGE_KEY = 'fdc-mission-templates';

  /**
   * Get all saved mission templates
   */
  static getTemplates(): MissionTemplate[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const templates = JSON.parse(stored) as Array<Omit<MissionTemplate, 'created'> & { created: string }>;
      return templates.map((template) => ({
        ...template,
        created: new Date(template.created)
      }));
    } catch (error) {
      console.warn('Failed to load mission templates:', error);
      return [];
    }
  }

  /**
   * Save a new mission template
   */
  static saveTemplate(template: Omit<MissionTemplate, 'id' | 'created'>): MissionTemplate {
    const newTemplate: MissionTemplate = {
      ...template,
      id: Date.now().toString(),
      created: new Date()
    };

    const templates = this.getTemplates();
    templates.push(newTemplate);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    return newTemplate;
  }

  /**
   * Create mission template from existing mission
   */
  static createTemplateFromMission(mission: Mission, templateName: string, description?: string): MissionTemplate {
    return this.saveTemplate({
      name: templateName,
      description,
      mortarPosition: mission.mortarPosition,
      numberOfGuns: mission.numberOfGuns,
      selectedSystem: mission.selectedSystem,
      availableRounds: mission.availableRounds,
      fpfTargets: mission.fpfTargets.map(target => ({
        name: target.name,
        targetGrid: target.targetGrid,
        priority: target.priority,
        sector: target.sector,
        notes: target.notes
      })),
      createdBy: mission.createdBy
    });
  }

  /**
   * Create new mission from template
   */
  static createMissionFromTemplate(template: MissionTemplate, missionName: string): CreateMissionData {
    return {
      name: missionName,
      description: `Created from template: ${template.name}`,
      mortarPosition: template.mortarPosition || '',
      numberOfGuns: template.numberOfGuns,
      selectedSystem: template.selectedSystem,
      availableRounds: template.availableRounds,
      initialFOPosition: undefined,
      fpfTargets: template.fpfTargets.map(fpfTarget => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: fpfTarget.name,
        targetGrid: fpfTarget.targetGrid,
        priority: fpfTarget.priority,
        sector: fpfTarget.sector,
        notes: fpfTarget.notes,
        created: new Date()
      }))
    };
  }

  /**
   * Delete a mission template
   */
  static deleteTemplate(templateId: string): boolean {
    try {
      const templates = this.getTemplates();
      const filteredTemplates = templates.filter(t => t.id !== templateId);
      
      if (filteredTemplates.length === templates.length) {
        return false; // Template not found
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTemplates));
      return true;
    } catch (error) {
      console.warn('Failed to delete mission template:', error);
      return false;
    }
  }

  /**
   * Update an existing mission template
   */
  static updateTemplate(templateId: string, updates: Partial<Omit<MissionTemplate, 'id' | 'created'>>): MissionTemplate | null {
    try {
      const templates = this.getTemplates();
      const templateIndex = templates.findIndex(t => t.id === templateId);
      
      if (templateIndex === -1) {
        return null; // Template not found
      }
      
      const updatedTemplate = {
        ...templates[templateIndex],
        ...updates
      };
      
      templates[templateIndex] = updatedTemplate;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
      
      return updatedTemplate;
    } catch (error) {
      console.warn('Failed to update mission template:', error);
      return null;
    }
  }

  /**
   * Get common FPF configurations as built-in templates
   */
  static getCommonFPFConfigurations(): Omit<MissionTemplate, 'id' | 'created'>[] {
    return [
      {
        name: 'Standard Defensive FPF',
        description: 'Standard 3-point defensive FPF configuration',
        mortarPosition: '',
        numberOfGuns: 2,
        selectedSystem: '1', // M252 81mm
        availableRounds: ['1', '2'], // HE and Illumination
        fpfTargets: [
          {
            name: 'FPF Alpha',
            targetGrid: '',
            priority: 'primary',
            sector: 'North',
            notes: 'Primary defensive line'
          },
          {
            name: 'FPF Bravo',
            targetGrid: '',
            priority: 'alternate',
            sector: 'Northeast',
            notes: 'Alternate defensive position'
          },
          {
            name: 'FPF Charlie',
            targetGrid: '',
            priority: 'supplemental',
            sector: 'Northwest',
            notes: 'Supplemental coverage'
          }
        ],
        createdBy: 'System'
      },
      {
        name: 'Urban Operations FPF',
        description: 'Urban environment FPF with precision targets',
        mortarPosition: '',
        numberOfGuns: 1,
        selectedSystem: '1', // M252 81mm
        availableRounds: ['1'], // HE only for precision
        fpfTargets: [
          {
            name: 'FPF Urban Alpha',
            targetGrid: '',
            priority: 'primary',
            sector: 'East',
            notes: 'Building complex entry point'
          },
          {
            name: 'FPF Urban Bravo',
            targetGrid: '',
            priority: 'alternate',
            sector: 'South',
            notes: 'Street intersection'
          }
        ],
        createdBy: 'System'
      },
      {
        name: 'Training Exercise Basic',
        description: 'Basic training setup with single FPF target',
        mortarPosition: '',
        numberOfGuns: 1,
        selectedSystem: '1', // M252 81mm
        availableRounds: ['4'], // Practice rounds
        fpfTargets: [
          {
            name: 'Training Target',
            targetGrid: '',
            priority: 'primary',
            sector: 'Range',
            notes: 'Training range target'
          }
        ],
        createdBy: 'System'
      }
    ];
  }
}
