import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2 } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nome: "",
    empresa: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(
          formData.email,
          formData.password,
          formData.nome,
          formData.empresa
        );
        // Toast já exibido no authStore
        // Redirecionar para página de boas-vindas após cadastro
        navigate("/welcome");
      } else {
        await signIn(formData.email, formData.password);
        // Toast já exibido no authStore
        navigate("/");
      }
    } catch (error) {
      // Toast de erro já foi exibido no authStore
      console.error("Erro na autenticação:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lumina-600 via-purple-600 to-indigo-700 p-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-lumina-400/10 rounded-full blur-2xl"></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 relative z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <CardHeader className="space-y-6 text-center pb-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-lumina-500 to-purple-600 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-lumina-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Building2 className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-lumina-600 to-purple-600 bg-clip-text text-transparent">
              Lumina AI ERP
            </CardTitle>
            <CardDescription className="text-base">
              {isSignUp
                ? "Crie sua conta e comece grátis por 14 dias"
                : "Bem-vindo de volta! Faça login para continuar"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium">
                    Nome Completo *
                  </Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Maria Silva"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    required={isSignUp}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa" className="text-sm font-medium">
                    Empresa / Escritório
                  </Label>
                  <Input
                    id="empresa"
                    type="text"
                    placeholder="Meu Escritório de Arquitetura"
                    value={formData.empresa}
                    onChange={(e) =>
                      setFormData({ ...formData, empresa: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="maria@exemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha *
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="h-11"
              />
              {isSignUp && (
                <p className="text-xs text-muted-foreground mt-1">
                  Mínimo de 6 caracteres
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-lumina-600 to-purple-600 hover:from-lumina-700 hover:to-purple-700 text-white font-medium shadow-md" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {isSignUp ? "Criar Conta Grátis" : "Entrar"}
            </Button>

            {isSignUp && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                <p className="text-xs text-center text-blue-900 dark:text-blue-100">
                  🎉 <strong>14 dias grátis</strong> para testar todas as funcionalidades
                </p>
              </div>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-muted-foreground">
                  {isSignUp ? "Já tem uma conta?" : "Novo no Lumina?"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-sm text-lumina-600 dark:text-lumina-400 hover:text-lumina-700 dark:hover:text-lumina-300 font-medium transition-colors"
            >
              {isSignUp
                ? "Fazer login em uma conta existente"
                : "Criar uma nova conta grátis"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}






