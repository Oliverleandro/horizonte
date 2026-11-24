import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, FileText } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Privacidade & Termos de Uso
              </h3>
              <span className="text-[11px] text-teal-700 font-medium">
                Conformidade com a LGPD (Lei Geral de Proteção de Dados)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl flex items-start gap-3">
            <Lock size={18} className="text-teal-700 shrink-0 mt-0.5" />
            <p className="text-teal-950 font-medium">
              Seus dados financeiros pertencem <strong>exclusivamente a você</strong>. Eles nunca são vendidos, compartilhados ou utilizados para publicidade.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <EyeOff size={15} className="text-slate-500" />
              1. Para que usamos seus dados?
            </h4>
            <p>
              Os dados cadastrados (e-mail, nome, receitas, despesas e metas) são utilizados <strong>estritamente</strong> para o funcionamento do app Horizonte, calculando sua projeção futura de saldo e comparando cenários no simulador.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <Lock size={15} className="text-slate-500" />
              2. Segurança e Row Level Security (RLS)
            </h4>
            <p>
              No banco de dados Supabase, todas as tabelas contam com a política de <strong>Row Level Security (RLS)</strong> ativada. Isso significa que apenas a sua conta autenticada possui permissão técnica para visualizar, adicionar, alterar ou excluir seus registros.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
              <FileText size={15} className="text-slate-500" />
              3. Seus Direitos (LGPD) e Exclusão Total
            </h4>
            <p>
              Você tem total controle sobre suas informações. A qualquer momento, na tela de Perfil, você pode exportar ou <strong>excluir definitivamente sua conta e todos os seus lançamentos</strong> com um único clique.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
            Última atualização: Novembro de 2026. Aplicativo Horizonte - Finanças Futuras.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Entendi e concordo
          </button>
        </div>
      </div>
    </div>
  );
};
