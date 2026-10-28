import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";

export default function ConfirmEmailPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Aguardar um pouco para o Supabase processar o hash da URL
    const timer = setTimeout(async () => {
      try {
        // O Supabase processa automaticamente o hash (#) da URL
        // Verificar se o usuário está autenticado
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Erro ao verificar sessão:", sessionError);
          setStatus("error");
          setMessage("Erro ao confirmar email. Por favor, tente novamente.");
          return;
        }

        if (session?.user) {
          // Usuário autenticado com sucesso!
          setStatus("success");
          setMessage("Email confirmado com sucesso! Redirecionando...");

          // Aguardar 2 segundos e redirecionar para dashboard
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          setStatus("error");
          setMessage("Link de confirmação inválido ou expirado. Por favor, solicite um novo email de confirmação.");
        }
      } catch (error) {
        console.error("Erro inesperado:", error);
        setStatus("error");
        setMessage("Ocorreu um erro inesperado. Tente novamente.");
      }
    }, 1500); // Aguardar 1.5 segundos para o Supabase processar

    // Também escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setStatus("success");
        setMessage("Email confirmado com sucesso! Redirecionando...");
        
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">L</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Confirmação de Email
          </h1>

          {/* Loading State */}
          {status === "loading" && (
            <div className="py-8">
              <Loader2 className="w-16 h-16 mx-auto text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">Confirmando seu email...</p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="py-8">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Email confirmado!
              </p>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex items-center justify-center text-purple-600">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Redirecionando...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="py-8">
              <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Erro na Confirmação
              </p>
              <p className="text-gray-600 mb-6">{message}</p>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  Ir para Login
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Tentar Novamente
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  💡 Dica:
                </p>
                <p className="text-sm text-blue-700">
                  Se o link expirou, você pode solicitar um novo email de
                  confirmação na página de login.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Precisa de ajuda?{" "}
          <a
            href="mailto:suporte@luminaaiarqflow.com"
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Entre em contato
          </a>
        </p>
      </div>
    </div>
  );
}
