import React, { useState } from 'react';
import {
  Mail,
  LogOut,
  Trash2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrivacyPolicyModal } from '../legal/PrivacyPolicyModal';

export const ProfileTab: React.FC = () => {
  const { user, profile, signOut, updateProfileName, deleteAccount } = useAuth();

  const [name, setName] = useState(profile?.nome || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSavingName(true);
    await updateProfileName(name.trim());
    setIsSavingName(false);
    setIsEditingName(false);
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'EXCLUIR') return;
    await deleteAccount();
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-150">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Meu Perfil & Segurança
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gerencie sua conta e privacidade no Horizonte
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-3xl bg-teal-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-teal-600/20">
            {profile?.nome ? profile.nome.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 truncate">
              {profile?.nome || user?.email?.split('@')[0] || 'Meu Perfil'}
            </h3>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
              <Mail size={13} className="text-slate-400" />
              <span>{user?.email || 'usuario@exemplo.com'}</span>
            </p>
          </div>
        </div>

        {/* Edit Name Form */}
        <div>
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={isSavingName}
                className="min-h-[44px] px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="min-h-[44px] px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold block">Nome exibido</span>
                <span className="text-sm font-bold text-slate-800">
                  {profile?.nome || 'Não informado'}
                </span>
              </div>
              <button
                onClick={() => {
                  setName(profile?.nome || '');
                  setIsEditingName(true);
                }}
                className="min-h-[44px] px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
              >
                Alterar nome
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Privacy & Legal */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Privacidade & LGPD</h4>
            <p className="text-[11px] text-slate-500">
              Seus dados financeiros são criptografados e de acesso exclusivo seu
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPrivacyOpen(true)}
          className="min-h-[44px] w-full py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <ShieldCheck size={15} />
          <span>Ler Política de Privacidade e Termos de Uso</span>
        </button>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Ações da Conta
        </h4>

        {/* Sign Out */}
        <button
          onClick={signOut}
          className="w-full min-h-[48px] py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
        >
          <LogOut size={16} />
          <span>Sair da Minha Conta</span>
        </button>

        {/* Delete Account */}
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          className="w-full min-h-[48px] py-3 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
        >
          <Trash2 size={16} />
          <span>Excluir Minha Conta e Meus Dados</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={26} />
            </div>

            <div className="text-center">
              <h4 className="text-base font-bold text-slate-900">
                Tem certeza que deseja excluir sua conta?
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Essa ação é <strong>irreversível</strong>. Todos os seus lançamentos, metas e perfil serão apagados permanentemente das nossas bases de dados (LGPD).
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 text-center">
                Para confirmar, digite <span className="text-rose-600 font-extrabold">EXCLUIR</span> abaixo:
              </label>
              <input
                type="text"
                autoFocus
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="EXCLUIR"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-bold text-sm text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText('');
                }}
                className="flex-1 min-h-[48px] py-2.5 rounded-2xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText.trim().toUpperCase() !== 'EXCLUIR'}
                onClick={handleConfirmDeleteAccount}
                className="flex-1 min-h-[48px] py-2.5 rounded-2xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                Sim, Excluir Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Modal */}
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};
