import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Database, 
  Webhook, 
  Printer, 
  Clock, 
  UtensilsCrossed, 
  ShoppingBag, 
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { Order } from '../types';

interface OrderConfirmationProps {
  order: Order;
  onNewOrder: () => void;
  restaurantName: string;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  order,
  onNewOrder,
  restaurantName,
}) => {
  const [countdown, setCountdown] = useState(35);

  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ffffff'],
      });
    } catch (err) {
      console.log('Confetti effect:', err);
    }

    // Auto-reset kiosk timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onNewOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onNewOrder]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 bg-neutral-950 text-white animate-fadeIn">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top celebratory header */}
        <div className="bg-gradient-to-b from-emerald-950/60 to-neutral-900 p-6 sm:p-8 text-center border-b border-neutral-800 relative">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-display">
            Pedido Realizado com Sucesso!
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Seu pedido já foi encaminhado para a linha de produção da cozinha.
          </p>

          {/* Huge Senha Identification Number */}
          <div className="mt-5 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 max-w-xs mx-auto shadow-inner">
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold block">
              Sua Senha de Chamada
            </span>
            <div className="text-4xl sm:text-5xl font-black text-amber-400 font-display tracking-tight tabular-nums mt-1">
              {order.orderNumber}
            </div>
            <div className="mt-2 text-xs font-semibold text-neutral-300 flex items-center justify-center gap-1.5">
              {order.diningOption === 'dine_in' ? (
                <>
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                  <span>Comer no Local</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Embalagem para Levar</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Integration Status Badges */}
        <div className="p-4 sm:p-6 bg-neutral-900 border-b border-neutral-800 space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Status das Integrações de Dados:
          </span>

          {/* Supabase Status */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium ${
              order.supabaseSynced
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Banco de Dados Supabase</span>
            </div>
            <div className="flex items-center gap-1 font-bold">
              {order.supabaseSynced ? (
                <span className="text-emerald-400">Gravado com Sucesso ✓</span>
              ) : (
                <span className="text-amber-400/90 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Salvo Localmente (Configurar Supabase)</span>
                </span>
              )}
            </div>
          </div>

          {/* n8n Webhook Status */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-medium ${
              order.n8nSynced
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Webhook className="w-4 h-4 text-amber-400" />
              <span>Webhook n8n</span>
            </div>
            <div className="flex items-center gap-1 font-bold">
              {order.n8nSynced ? (
                <span className="text-emerald-400">Disparado com Sucesso ✓</span>
              ) : (
                <span className="text-neutral-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>{order.n8nError ? 'Erro no envio' : 'Pendente de Configuração'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Digital Receipt Breakdown */}
        <div className="p-5 sm:p-6 bg-neutral-950 flex-1 space-y-4">
          <div className="border-b border-neutral-800/80 pb-3 flex justify-between items-center text-xs text-neutral-400 font-mono">
            <span>{restaurantName}</span>
            <span>{new Date(order.createdAt).toLocaleTimeString('pt-BR')}</span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="font-semibold text-white">
                    {item.quantity}x {item.product.name}
                  </div>
                  {item.selectedExtras.length > 0 && (
                    <div className="text-xs text-neutral-400">
                      Extras: {item.selectedExtras.map((e) => e.name).join(', ')}
                    </div>
                  )}
                  {item.observations && (
                    <div className="text-xs text-neutral-400 italic">
                      Obs: {item.observations}
                    </div>
                  )}
                </div>
                <div className="font-bold text-neutral-300 tabular-nums">
                  {item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-neutral-800 space-y-1 text-sm">
            <div className="flex justify-between text-neutral-400 text-xs">
              <span>Forma de Pagamento</span>
              <span className="font-bold text-white uppercase">{order.paymentMethod}</span>
            </div>
            {order.customerName && (
              <div className="flex justify-between text-neutral-400 text-xs">
                <span>Cliente / Mesa</span>
                <span className="font-bold text-white">{order.customerName}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-neutral-800">
              <span>Total Pago</span>
              <span className="text-amber-400 tabular-nums">
                {order.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions & Auto-reset footer */}
        <div className="p-4 sm:p-6 bg-neutral-900 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cupom</span>
          </button>

          <button
            onClick={onNewOrder}
            className="w-full sm:flex-1 bg-amber-500 hover:bg-amber-400 active:scale-98 text-neutral-950 font-black px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm sm:text-base transition-all shadow-lg shadow-amber-500/20"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>Fazer Novo Pedido ({countdown}s)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
