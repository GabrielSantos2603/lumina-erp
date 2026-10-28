import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Trash2,
  Check,
  Clock,
  FileText,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Sparkles
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { MeetingType, ChecklistItem, AgendaItem } from '@/types/meetingTypes';
import { getMeetingTypeConfig } from '@/utils/meetingConfig';

interface MeetingAgendaBuilderProps {
  meetingType: MeetingType;
  onSave: (agenda: AgendaItem[], checklist: ChecklistItem[]) => void;
  onCancel: () => void;
  className?: string;
}

export function MeetingAgendaBuilder({ meetingType, onSave, onCancel, className }: MeetingAgendaBuilderProps) {
  const config = getMeetingTypeConfig(meetingType);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(config.checklist || []);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const addAgendaItem = () => {
    const newItem: AgendaItem = {
      id: Date.now().toString(),
      title: '',
      duration: 15,
      description: '',
      required: true,
      order: agenda.length + 1
    };
    setAgenda([...agenda, newItem]);
  };

  const updateAgendaItem = (id: string, updates: Partial<AgendaItem>) => {
    setAgenda(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeAgendaItem = (id: string) => {
    setAgenda(prev => prev.filter(item => item.id !== id));
  };

  const moveAgendaItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = agenda.findIndex(item => item.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= agenda.length) return;

    const newAgenda = [...agenda];
    [newAgenda[currentIndex], newAgenda[newIndex]] = [newAgenda[newIndex], newAgenda[currentIndex]];
    
    // Atualizar ordem
    newAgenda.forEach((item, index) => {
      item.order = index + 1;
    });
    
    setAgenda(newAgenda);
  };

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: '',
      required: false,
      category: 'Geral',
      description: ''
    };
    setChecklist([...checklist, newItem]);
  };

  const updateChecklistItem = (id: string, updates: Partial<ChecklistItem>) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const generateAIAgenda = async () => {
    setIsGeneratingAI(true);
    
    try {
      // Simular chamada da IA (substituir por chamada real da API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Agenda sugerida baseada no tipo de reunião
      const suggestedAgenda: AgendaItem[] = [
        {
          id: '1',
          title: 'Abertura e Apresentações',
          duration: 5,
          description: 'Boas-vindas e apresentação dos participantes',
          required: true,
          order: 1
        },
        {
          id: '2', 
          title: config.name + ' - Objetivos',
          duration: 10,
          description: `Explicar os objetivos desta reunião de ${config.name.toLowerCase()}`,
          required: true,
          order: 2
        },
        {
          id: '3',
          title: 'Discussão Principal',
          duration: config.defaultDuration - 20,
          description: `Tópicos principais conforme checklist de ${config.name}`,
          required: true,
          order: 3
        },
        {
          id: '4',
          title: 'Próximos Passos',
          duration: 10,
          description: 'Definir ações, responsáveis e prazos',
          required: true,
          order: 4
        }
      ];
      
      setAgenda(suggestedAgenda);
    } catch (error) {
      console.error('Erro ao gerar agenda:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const totalDuration = agenda.reduce((sum, item) => sum + item.duration, 0);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{config.icon}</span>
                Configurar {config.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {config.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateAIAgenda}
                disabled={isGeneratingAI}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isGeneratingAI ? 'Gerando...' : 'Gerar com IA'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Pauta da Reunião */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pauta da Reunião
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {totalDuration}min total
              </Badge>
              <Button size="sm" onClick={addAgendaItem} className="gap-1">
                <Plus className="h-4 w-4" />
                Adicionar Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {agenda.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Nenhum item na pauta ainda</p>
              <Button onClick={addAgendaItem} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Primeiro Item
              </Button>
            </div>
          ) : (
            agenda
              .sort((a, b) => a.order - b.order)
              .map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Ordem e Controles */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveAgendaItem(item.id, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => moveAgendaItem(item.id, 'down')}
                          disabled={index === agenda.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <Label className="text-xs">Título do Item</Label>
                          <Input
                            value={item.title}
                            onChange={(e) => updateAgendaItem(item.id, { title: e.target.value })}
                            placeholder="Ex: Apresentação do conceito criativo"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Duração (min)</Label>
                          <Input
                            type="number"
                            value={item.duration}
                            onChange={(e) => updateAgendaItem(item.id, { duration: parseInt(e.target.value) || 0 })}
                            min="1"
                            max="180"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Descrição / Observações</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateAgendaItem(item.id, { description: e.target.value })}
                          placeholder="Detalhes sobre o que será discutido neste item..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={item.required}
                            onChange={(e) => updateAgendaItem(item.id, { required: e.target.checked })}
                          />
                          Item obrigatório
                        </label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAgendaItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      {/* Checklist da Reunião */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Checklist de Verificação
            </CardTitle>
            <Button size="sm" onClick={addChecklistItem} className="gap-1">
              <Plus className="h-4 w-4" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checklist.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Nenhum item no checklist ainda</p>
                <Button onClick={addChecklistItem} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Primeiro Item
                </Button>
              </div>
            ) : (
              checklist.map((item) => (
                <div key={item.id} className="border rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label className="text-xs">Texto do Item</Label>
                      <Input
                        value={item.text}
                        onChange={(e) => updateChecklistItem(item.id, { text: e.target.value })}
                        placeholder="Ex: Definir orçamento disponível"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Categoria</Label>
                      <Input
                        value={item.category}
                        onChange={(e) => updateChecklistItem(item.id, { category: e.target.value })}
                        placeholder="Ex: Financeiro, Design, Técnico"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <Label className="text-xs">Descrição / Orientação</Label>
                    <Textarea
                      value={item.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateChecklistItem(item.id, { description: e.target.value })}
                      placeholder="Orientações sobre como abordar este item..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.required}
                        onChange={(e) => updateChecklistItem(item.id, { required: e.target.checked })}
                      />
                      Item obrigatório
                    </label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeChecklistItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <div className="text-sm text-muted-foreground">
              <p>Pauta: {agenda.length} itens • {totalDuration} minutos</p>
              <p>Checklist: {checklist.length} itens • {checklist.filter(c => c.required).length} obrigatórios</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="gap-1">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button 
                onClick={() => onSave(agenda, checklist)} 
                className="gap-1"
                disabled={agenda.length === 0 || checklist.length === 0}
              >
                <Save className="h-4 w-4" />
                Salvar Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}