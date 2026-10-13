import React, { useState } from 'react';
import { X, QrCode, CreditCard, Wallet, Banknote, ShieldCheck, ArrowLeft, Loader2, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { CartItem, DiningOption, PaymentMethod } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToCart: () => void;
  items: CartItem[];
  diningOption: DiningOption;
  customerName: string;
  totalAmount: number;
  onConfirmOrder: (paymentMethod: PaymentMethod) => Promise<void>;
  isSubmitting: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onBackToCart,
  items,
  diningOption,
  customerName,
  totalAmount,
  onConfirmOrder,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    await onConfirmOrder(paymentMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToCart}
              disabled={isSubmitting}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-30"
              title="Voltar ao carrinho"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold font-display">Confirmar Pedido & Pagamento</h2>
              <div className="text-xs text-neutral-400">
                Verifique os dados e escolha como deseja pagar no totem
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form & Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Summary Box */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-neutral-400">Tipo de consumo:</span>
              <span className="font-bold flex items-center gap-1.5 text-amber-400">
                {diningOption === 'dine_in' ? (
                  <>
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Comer no Local</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Para Levar (Embalagem de Viagem)</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-neutral-400">Identificação:</span>
              <span className="font-semibold text-white">
                {customerName ? customerName : 'Cliente Balcão (Sem nome informado)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-neutral-400">Quantidade total:</span>
              <span className="font-semibold text-white">
                {items.reduce((acc, i) => acc + i.quantity, 0)} itens
              </span>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-300">Valor Total do Pedido:</span>
              <span className="text-2xl font-black text-amber-400 tabular-nums">
                {totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-neutral-200 block">
              Selecione a Forma de Pagamento no Totem:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* PIX */}
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  paymentMethod === 'pix'
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    paymentMethod === 'pix' ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-800 text-amber-400'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Pix Instantâneo</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Aprovação imediata via QR Code na tela
                  </div>
                </div>
              </button>

              {/* Cartão de Crédito */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_credito')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  paymentMethod === 'cartao_credito'
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    paymentMethod === 'cartao_credito'
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-800 text-amber-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Cartão de Crédito</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Aproximação ou chip na máquina do totem
                  </div>
                </div>
              </button>

              {/* Cartão de Débito */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_debito')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  paymentMethod === 'cartao_debito'
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    paymentMethod === 'cartao_debito'
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-800 text-amber-400'
                  }`}
                >
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Cartão de Débito</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Débito à vista com senha no terminal
                  </div>
                </div>
              </button>

              {/* Pagar no Caixa */}
              <button
                type="button"
                onClick={() => setPaymentMethod('balcao')}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  paymentMethod === 'balcao'
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    paymentMethod === 'balcao'
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-800 text-amber-400'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Dinheiro no Balcão</div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Pague ao retirar a senha no caixa físico
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Pix Mockup Box if Pix is selected */}
          {paymentMethod === 'pix' && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-white p-2.5 rounded-xl shrink-0">
                <svg className="w-24 h-24" viewBox="0 0 100 100" fill="currentColor">
                  {/* Visual QR Code representation */}
                  <rect x="5" y="5" width="25" height="25" fill="#000" />
                  <rect x="9" y="9" width="17" height="17" fill="#fff" />
                  <rect x="13" y="13" width="9" height="9" fill="#000" />
                  <rect x="70" y="5" width="25" height="25" fill="#000" />
                  <rect x="74" y="9" width="17" height="17" fill="#fff" />
                  <rect x="78" y="13" width="9" height="9" fill="#000" />
                  <rect x="5" y="70" width="25" height="25" fill="#000" />
                  <rect x="9" y="74" width="17" height="17" fill="#fff" />
                  <rect x="13" y="78" width="9" height="9" fill="#000" />
                  <circle cx="50" cy="50" r="8" fill="#f59e0b" />
                  <rect x="36" y="20" width="8" height="8" fill="#000" />
                  <rect x="48" y="12" width="8" height="8" fill="#000" />
                  <rect x="68" y="44" width="12" height="6" fill="#000" />
                  <rect x="36" y="72" width="16" height="8" fill="#000" />
                  <rect x="68" y="68" width="20" height="20" fill="#000" />
                  <rect x="74" y="74" width="8" height="8" fill="#fff" />
                </svg>
              </div>
              <div className="text-center sm:text-left text-xs text-neutral-400 space-y-1">
                <div className="text-white font-bold text-sm flex items-center justify-center sm:justify-start gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pix Integrado e Seguro</span>
                </div>
                <p>
                  Ao confirmar o pedido, o totem registrará o pedido no Supabase e notificará o webhook do n8n para a equipe da cozinha.
                </p>
                <div className="text-amber-400 font-mono text-[11px] break-all pt-1">
                  00020126580014br.gov.bcb.pix0136totem-burgerlab-kiosk-9892
                </div>
              </div>
            </div>
          )}

          {/* Bottom Confirmation Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-neutral-950 font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Registrando Pedido & Webhook...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                  <span>Confirmar Pedido & Gerar Senha</span>
                </>
              )}
            </button>
            <div className="text-center text-xs text-neutral-500 mt-2">
              Os dados serão gravados no banco Supabase e transmitidos para o n8n.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
