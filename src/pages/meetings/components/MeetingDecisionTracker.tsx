import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  FileSignature,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Download,
  Sparkles,
  Target,
  Loader2
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { MeetingDecision } from '@/types/meetingTypes';

interface MeetingDecisionTrackerProps {
  decisions?: MeetingDecision[];
  onDecisionsUpdate?: (decisions: MeetingDecision[]) => void;
  onSignatureRequest?: (decisionId: string) => void;
  transcription?: string;
  className?: string;
}

interface NewDecision {
  description: string;
  responsible: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
}

export function MeetingDecisionTracker({
  decisions = [],
  onDecisionsUpdate,
  onSignatureRequest,
  transcription,
  className
}: MeetingDecisionTrackerProps) {
  const [localDecisions, setLocalDecisions] = useState<MeetingDecision[]>(decisions);
  const [isExtracting, setIsExtracting] = useState(false);
  const [newDecision, setNewDecision] = useState<NewDecision>({
    description: '',
    responsible: '',
    deadline: '',
    priority: 'medium'
  });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<MeetingDecision>>({});

  useEffect(() => {
    setLocalDecisions(decisions);
  }, [decisions]);

  // Extrair decisões da transcrição usando IA
  const extractDecisionsFromTranscription = async () => {
    if (!transcription) return;

    setIsExtracting(true);
    
    try {
      // Simular processamento IA (substituir por chamada real)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const extractedDecisions: MeetingDecision[] = [
        {
          id: 'ai-1',
          description: 'Realizar medições detalhadas da área social',
          responsible: 'Maria Santos (Arquiteta)',
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: 'pending',
          priority: 'high'
        },
        {
          id: 'ai-2',
          description: 'Elaborar proposta técnica e orçamento detalhado',
          responsible: 'Maria Santos (Arquiteta)',
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: 'pending',
          priority: 'high'
        },
        {
          id: 'ai-3',
          description: 'Definir cronograma de execução da reforma',
          responsible: 'João Silva (Cliente)',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: 'pending',
          priority: 'medium'
        },
        {
          id: 'ai-4',
          description: 'Aprovação do orçamento e assinatura do contrato',
          responsible: 'João Silva (Cliente)',
          deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: 'pending',
          priority: 'high'
        }
      ];

      const updatedDecisions = [...localDecisions, ...extractedDecisions];
      setLocalDecisions(updatedDecisions);
      
      if (onDecisionsUpdate) {
        onDecisionsUpdate(updatedDecisions);
      }

    } catch (error) {
      console.error('Erro ao extrair decisões:', error);
      alert('Erro ao processar transcrição');
    } finally {
      setIsExtracting(false);
    }
  };

  // Adicionar nova decisão manual
  const addDecision = () => {
    if (!newDecision.description || !newDecision.responsible) return;

    const decision: MeetingDecision = {
      id: Date.now().toString(),
      description: newDecision.description,
      responsible: newDecision.responsible,
      deadline: newDecision.deadline,
      status: 'pending',
      priority: newDecision.priority
    };

    const updatedDecisions = [...localDecisions, decision];
    setLocalDecisions(updatedDecisions);
    
    if (onDecisionsUpdate) {
      onDecisionsUpdate(updatedDecisions);
    }

    // Limpar formulário
    setNewDecision({
      description: '',
      responsible: '',
      deadline: '',
      priority: 'medium'
    });
  };

  // Atualizar status da decisão
  const updateDecisionStatus = (id: string, status: MeetingDecision['status']) => {
    const updatedDecisions = localDecisions.map(decision =>
      decision.id === id ? { ...decision, status } : decision
    );
    
    setLocalDecisions(updatedDecisions);
    
    if (onDecisionsUpdate) {
      onDecisionsUpdate(updatedDecisions);
    }
  };

  // Editar decisão
  const startEdit = (decision: MeetingDecision) => {
    setIsEditing(decision.id);
    setEditData(decision);
  };

  const saveEdit = () => {
    if (!isEditing || !editData) return;

    const updatedDecisions = localDecisions.map(decision =>
      decision.id === isEditing ? { ...decision, ...editData } : decision
    );
    
    setLocalDecisions(updatedDecisions);
    
    if (onDecisionsUpdate) {
      onDecisionsUpdate(updatedDecisions);
    }

    setIsEditing(null);
    setEditData({});
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditData({});
  };

  // Remover decisão
  const removeDecision = (id: string) => {
    const updatedDecisions = localDecisions.filter(decision => decision.id !== id);
    setLocalDecisions(updatedDecisions);
    
    if (onDecisionsUpdate) {
      onDecisionsUpdate(updatedDecisions);
    }
  };

  // Solicitar assinatura
  const requestSignature = (decisionId: string) => {
    if (onSignatureRequest) {
      onSignatureRequest(decisionId);
    }
    alert('Solicitação de assinatura enviada por email!');
  };

  // Exportar decisões
  const exportDecisions = () => {
    const text = localDecisions
      .map(decision => `
Decisão: ${decision.description}
Responsável: ${decision.responsible}
Prazo: ${decision.deadline ? new Date(decision.deadline).toLocaleDateString() : 'Não definido'}
Prioridade: ${decision.priority}
Status: ${decision.status}
---`)
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decisoes-reuniao-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const pendingCount = localDecisions.filter(d => d.status === 'pending').length;
  const completedCount = localDecisions.filter(d => d.status === 'completed').length;
  const overdueCount = localDecisions.filter(d => d.status === 'overdue').length;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Ficha de Decisões
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {pendingCount} pendentes
              </Badge>
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {completedCount} concluídas
              </Badge>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {overdueCount} atrasadas
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {transcription && (
              <Button
                onClick={extractDecisionsFromTranscription}
                disabled={isExtracting}
                className="gap-2"
              >
                {isExtracting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isExtracting ? 'Extraindo...' : 'Extrair com IA'}
              </Button>
            )}
            <Button onClick={exportDecisions} variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Formulário para Nova Decisão */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Decisão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Descrição da Decisão</Label>
              <Textarea
                value={newDecision.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  setNewDecision(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Descreva a decisão tomada..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Responsável</Label>
                <Input
                  value={newDecision.responsible}
                  onChange={(e) => 
                    setNewDecision(prev => ({ ...prev, responsible: e.target.value }))
                  }
                  placeholder="Nome do responsável"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={newDecision.deadline}
                  onChange={(e) => 
                    setNewDecision(prev => ({ ...prev, deadline: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Prioridade</Label>
                <select
                  value={newDecision.priority}
                  onChange={(e) => 
                    setNewDecision(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm"
                  title="Selecionar prioridade da decisão"
                  aria-label="Selecionar prioridade da decisão"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            <Button 
              onClick={addDecision} 
              className="w-full gap-2"
              disabled={!newDecision.description || !newDecision.responsible}
            >
              <Plus className="h-4 w-4" />
              Adicionar Decisão
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Decisões */}
        <div className="space-y-3">
          {localDecisions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">Nenhuma decisão registrada ainda</p>
              <p className="text-sm">
                {transcription 
                  ? 'Use a IA para extrair decisões da transcrição automaticamente'
                  : 'Adicione decisões manualmente ou use a transcrição com IA'
                }
              </p>
            </div>
          ) : (
            localDecisions.map((decision) => (
              <Card key={decision.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  {isEditing === decision.id ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                          setEditData(prev => ({ ...prev, description: e.target.value }))
                        }
                        rows={2}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          value={editData.responsible || ''}
                          onChange={(e) => 
                            setEditData(prev => ({ ...prev, responsible: e.target.value }))
                          }
                          placeholder="Responsável"
                        />
                        
                        <Input
                          type="date"
                          value={editData.deadline || ''}
                          onChange={(e) => 
                            setEditData(prev => ({ ...prev, deadline: e.target.value }))
                          }
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm" className="gap-1">
                          <Save className="h-3 w-3" />
                          Salvar
                        </Button>
                        <Button onClick={cancelEdit} size="sm" variant="outline" className="gap-1">
                          <X className="h-3 w-3" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium leading-relaxed">
                            {decision.description}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {decision.responsible}
                            </div>
                            
                            {decision.deadline && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(decision.deadline).toLocaleDateString()}
                              </div>
                            )}
                            
                            <Badge className={getPriorityColor(decision.priority)}>
                              {decision.priority === 'high' ? 'Alta' : 
                               decision.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {getStatusIcon(decision.status)}
                          <select
                            value={decision.status}
                            onChange={(e) => updateDecisionStatus(decision.id, e.target.value as MeetingDecision['status'])}
                            className="text-xs px-2 py-1 border rounded"
                            title="Alterar status da decisão"
                            aria-label="Alterar status da decisão"
                          >
                            <option value="pending">Pendente</option>
                            <option value="completed">Concluída</option>
                            <option value="overdue">Atrasada</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => requestSignature(decision.id)}
                            size="sm" 
                            variant="outline" 
                            className="gap-1 text-xs"
                          >
                            <FileSignature className="h-3 w-3" />
                            Solicitar Assinatura
                          </Button>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => startEdit(decision)}
                            size="sm" 
                            variant="ghost" 
                            className="gap-1"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          
                          <Button 
                            onClick={() => removeDecision(decision.id)}
                            size="sm" 
                            variant="ghost" 
                            className="gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}