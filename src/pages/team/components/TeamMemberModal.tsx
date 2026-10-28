import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, UserPlus, Save, Trash2 } from "lucide-react";
import type { TeamMember, CreateTeamMemberData } from "@/services/teamService";

interface TeamMemberModalProps {
  member?: TeamMember | null;
  onClose: () => void;
  onSave: (data: CreateTeamMemberData) => Promise<void>;
  onDelete?: (memberId: string, memberName: string) => void;
  isLoading?: boolean;
}

export function TeamMemberModal({ member, onClose, onSave, onDelete, isLoading }: TeamMemberModalProps) {
  const isEditing = !!member;
  
  const [formData, setFormData] = useState<CreateTeamMemberData>({
    name: member?.name || "",
    email: member?.email || "",
    phone: member?.phone || "",
    role: member?.role || "other",
    department: member?.department || "",
    specialty: member?.specialty || "",
    status: member?.status || "active",
    salary: member?.salary || undefined,
    weekly_hours: member?.weekly_hours || 40,
    hire_date: member?.hire_date || "",
    notes: member?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const handleChange = (field: keyof CreateTeamMemberData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {isEditing ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              {isEditing ? "Editar Membro" : "Adicionar Novo Membro"}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@lumina.com.br"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(51) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Cargo *</Label>
                <select
                  id="role"
                  title="Selecione o cargo"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={formData.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  required
                  disabled={isLoading}
                >
                  <option value="">Selecione...</option>
                  <option value="architect">🏛️ Arquiteto(a)</option>
                  <option value="designer">🎨 Designer</option>
                  <option value="engineer">⚙️ Engenheiro(a)</option>
                  <option value="manager">📊 Gerente</option>
                  <option value="assistant">📋 Assistente</option>
                  <option value="intern">🎓 Estagiário(a)</option>
                  <option value="other">👤 Outro</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  placeholder="Ex: Projetos Residenciais"
                  value={formData.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Input
                  id="specialty"
                  placeholder="Ex: Design de Interiores"
                  value={formData.specialty}
                  onChange={(e) => handleChange("specialty", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Salário (R$)</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="8000"
                  value={formData.salary || ""}
                  onChange={(e) => handleChange("salary", parseFloat(e.target.value) || undefined)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekly_hours">Horas/Semana</Label>
                <Input
                  id="weekly_hours"
                  type="number"
                  placeholder="40"
                  value={formData.weekly_hours}
                  onChange={(e) => handleChange("weekly_hours", parseInt(e.target.value) || 40)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hire_date">Data de Admissão</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleChange("hire_date", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                title="Selecione o status"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                disabled={isLoading}
              >
                <option value="active">Ativo</option>
                <option value="vacation">Férias</option>
                <option value="leave">Afastado</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[80px]"
                placeholder="Observações adicionais sobre o membro..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              {isEditing && member && onDelete && (
                <Button 
                  type="button" 
                  variant="destructive"
                  onClick={() => onDelete(member.id, member.name)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              )}
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Adicionar Membro"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
