import React, { useState } from 'react';
import {
  TrendingUp,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrivacyPolicyModal } from '../legal/PrivacyPolicyModal';

export const AuthScreen: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInAsDemo,
    sendPasswordReset,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const validateForm = (): boolean => {
    setValidationError(null);
    clearError();
    setSuccessMessage(null);

    const emailTrim = email.trim();
    if (!emailTrim) {
      setValidationError('Por favor, informe seu endereço de e-mail.');
      return false;
    }

    if (!emailTrim.includes('@') || !emailTrim.includes('.')) {
      setValidationError('Por favor, digite um e-mail válido (ex: seu.nome@email.com).');
      return false;
    }

    if (mode === 'signup' && !name.trim()) {
      setValidationError('Por favor, diga como prefere ser chamado(a).');
      return false;
    }

    if (mode !== 'forgot') {
      if (!password) {
        setValidationError('Por favor, digite sua senha.');
        return false;
      }
      if (password.length < 6) {
        setValidationError('A senha precisa ter pelo menos 6 caracteres.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (mode === 'login') {
      await signInWithEmail(email, password);
    } else if (mode === 'signup') {
      const res = await signUpWithEmail(email, password, name);
      if (res.success && res.needsEmailConfirmation) {
        setSuccessMessage(
          'Conta criada com sucesso! Enviamos uma confirmação para seu e-mail. Verifique sua caixa de entrada.'
        );
      }
    } else if (mode === 'forgot') {
      const ok = await sendPasswordReset(email);
      if (ok) {
        setSuccessMessage(
          'Se o e-mail estiver cadastrado, enviamos as instruções para redefinir sua senha. Verifique sua caixa de entrada.'
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-900/5">
        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-3xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/30 mb-3">
            <TrendingUp size={30} className="stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Horizonte
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
            {mode === 'login' && 'Entre na sua conta para acompanhar seu saldo futuro'}
            {mode === 'signup' && 'Crie sua nova conta e planeje suas finanças'}
            {mode === 'forgot' && 'Recupere o acesso à sua conta'}
          </p>
        </div>

        {/* Feedback Messages */}
        {(error || validationError) && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 animate-in fade-in duration-150">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{error || validationError}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-950 animate-in fade-in duration-150">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{successMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Seu Nome Completo
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como prefere ser chamado(a)?"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Seu E-mail
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Sua Senha
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      clearError();
                      setValidationError(null);
                    }}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-800"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : mode === 'login' ? (
              <>
                <span>Entrar</span>
                <ArrowRight size={16} />
              </>
            ) : mode === 'signup' ? (
              <>
                <span>Criar Conta</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <span>Enviar Link de Recuperação</span>
            )}
          </button>
        </form>

        {/* Google OAuth & Demo Access */}
        {mode !== 'forgot' && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={signInWithGoogle}
              className="w-full min-h-[48px] py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar com Google</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={signInAsDemo}
              className="w-full min-h-[44px] py-2.5 px-4 bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/80 text-teal-800 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Sparkles size={16} className="text-teal-600" />
              <span>Experimentar com dados de exemplo</span>
            </button>
          </div>
        )}

        {/* Switch Mode Footer */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <p>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  clearError();
                  setValidationError(null);
                }}
                className="font-bold text-teal-700 hover:text-teal-800 underline"
              >
                Criar conta
              </button>
            </p>
          ) : (
            <p>
              Já tem conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearError();
                  setValidationError(null);
                }}
                className="font-bold text-teal-700 hover:text-teal-800 underline"
              >
                Entrar
              </button>
            </p>
          )}
        </div>

        {/* Privacy Policy Link */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(true)}
            className="text-[11px] text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
          >
            <ShieldCheck size={12} />
            <span>Privacidade & Termos de Uso (LGPD)</span>
          </button>
        </div>
      </div>

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};
