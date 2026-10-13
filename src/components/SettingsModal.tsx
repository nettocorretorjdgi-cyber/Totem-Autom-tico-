import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Webhook, 
  Copy, 
  Download,
  Check, 
  Store, 
  ListOrdered, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppConfig, Order } from '../types';
import { 
  getSupabaseSchemaSql, 
  getSupabaseClient, 
  getSavedOrders 
} from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'integrations' | 'sql' | 'orders'>('integrations');
  const [supabaseUrl, setSupabaseUrl] = useState(config.supabaseUrl);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(config.supabaseAnonKey);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState(config.n8nWebhookUrl);
  const [restaurantName, setRestaurantName] = useState(config.restaurantName);

  const [copiedSql, setCopiedSql] = useState(false);
  const [testSupabaseStatus, setTestSupabaseStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testSupabaseMsg, setTestSupabaseMsg] = useState('');

  const [testWebhookStatus, setTestWebhookStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testWebhookMsg, setTestWebhookMsg] = useState('');

  const savedOrders: Order[] = getSavedOrders();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      n8nWebhookUrl: n8nWebhookUrl.trim(),
      restaurantName: restaurantName.trim() || 'BURGER LAB ARTESANAL',
    });
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSupabaseSchemaSql());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSql = () => {
    const element = document.createElement('a');
    const file = new Blob([getSupabaseSchemaSql()], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'supabase_schema.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      setTestSupabaseStatus('error');
      setTestSupabaseMsg('Preencha a URL e a Chave Anon antes de testar.');
      return;
    }

    setTestSupabaseStatus('testing');
    setTestSupabaseMsg('Conectando ao Supabase...');

    try {
      const client = getSupabaseClient({
        supabaseUrl,
        supabaseAnonKey,
        n8nWebhookUrl,
        restaurantName,
      });

      if (!client) {
        setTestSupabaseStatus('error');
        setTestSupabaseMsg('Erro ao instanciar cliente do Supabase.');
        return;
      }

      // Quick query on orders table
      const { data, error } = await client.from('orders').select('id').limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet
          setTestSupabaseStatus('error');
          setTestSupabaseMsg('Conectado, mas a tabela "orders" não existe! Execute o Script SQL na aba "Script SQL".');
        } else {
          setTestSupabaseStatus('error');
          setTestSupabaseMsg(`Erro do Supabase: ${error.message}`);
        }
      } else {
        setTestSupabaseStatus('success');
        setTestSupabaseMsg('Conexão com Supabase realizada com sucesso! Tabela "orders" encontrada.');
      }
    } catch (err: unknown) {
      setTestSupabaseStatus('error');
      setTestSupabaseMsg(err instanceof Error ? err.message : 'Falha na conexão.');
    }
  };

  const handleTestWebhook = async () => {
    if (!n8nWebhookUrl) {
      setTestWebhookStatus('error');
      setTestWebhookMsg('Preencha a URL do Webhook do n8n.');
      return;
    }

    setTestWebhookStatus('testing');
    setTestWebhookMsg('Disparando ping de teste para o n8n...');

    try {
      const payload = {
        event: 'test_ping',
        totemId: 'TOTEM-01',
        message: 'Teste de conexão com webhook n8n do restaurante',
        timestamp: new Date().toISOString(),
      };

      const res = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTestWebhookStatus('success');
        setTestWebhookMsg(`Sucesso! Webhook n8n respondeu com status ${res.status}.`);
      } else {
        setTestWebhookStatus('error');
        setTestWebhookMsg(`n8n retornou status ${res.status}: ${res.statusText}`);
      }
    } catch (err: unknown) {
      setTestWebhookStatus('error');
      setTestWebhookMsg(
        err instanceof Error
          ? `${err.message} (Verifique se o webhook n8n está ativo e permite CORS)`
          : 'Falha ao conectar com webhook'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90">
          <div>
            <h2 className="text-xl font-bold font-display">Painel de Configurações do Totem</h2>
            <p className="text-xs text-neutral-400">
              Gerencie integrações com Supabase, Webhook n8n e dados do terminal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 px-5 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'integrations'
                ? 'border-amber-500 text-amber-400 font-extrabold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase & n8n</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'sql'
                ? 'border-amber-500 text-amber-400 font-extrabold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Script SQL Supabase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-amber-500 text-amber-400 font-extrabold'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Histórico de Pedidos ({savedOrders.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === 'integrations' && (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Restaurant Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-500" />
                  <span>Nome do Restaurante</span>
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="BURGER LAB ARTESANAL"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Supabase Section */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm text-white">Banco de Dados Supabase</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={testSupabaseStatus === 'testing'}
                    className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${testSupabaseStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>Testar Conexão</span>
                  </button>
                </div>

                <p className="text-xs text-neutral-400">
                  Os pedidos serão salvos automaticamente nas tabelas <code className="text-amber-400 font-mono">orders</code> e <code className="text-amber-400 font-mono">order_items</code>.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="url"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyzproject.supabase.co"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      Supabase Anon / Public API Key
                    </label>
                    <input
                      type="password"
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {testSupabaseStatus !== 'idle' && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      testSupabaseStatus === 'success'
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : testSupabaseStatus === 'error'
                        ? 'bg-red-950/40 border-red-500/30 text-red-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    {testSupabaseStatus === 'success' && <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />}
                    {testSupabaseStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
                    <span>{testSupabaseMsg}</span>
                  </div>
                )}
              </div>

              {/* n8n Webhook Section */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-sm text-white">Webhook n8n</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={testWebhookStatus === 'testing'}
                    className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold px-3 py-1.5 rounded-lg border border-neutral-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${testWebhookStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>Testar Webhook</span>
                  </button>
                </div>

                <p className="text-xs text-neutral-400">
                  Após a confirmação do cliente, o totem dispara uma requisição POST contendo todos os dados do pedido para seu fluxo de automação no n8n.
                </p>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1">
                    URL do Webhook do n8n (Production ou Test)
                  </label>
                  <input
                    type="url"
                    value={n8nWebhookUrl}
                    onChange={(e) => setN8nWebhookUrl(e.target.value)}
                    placeholder="https://seu-n8n.com/webhook/restaurant-order"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {testWebhookStatus !== 'idle' && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      testWebhookStatus === 'success'
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : testWebhookStatus === 'error'
                        ? 'bg-red-950/40 border-red-500/30 text-red-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    {testWebhookStatus === 'success' && <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />}
                    {testWebhookStatus === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
                    <span>{testWebhookMsg}</span>
                  </div>
                )}
              </div>

              {/* Bottom Save Button */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-neutral-400 hover:text-white bg-neutral-800 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm shadow-md"
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Estrutura SQL & Políticas de Armazenamento (Supabase)</h3>
                  <p className="text-xs text-neutral-400">
                    Cria tabelas <code className="text-amber-400 font-mono">orders</code>, <code className="text-amber-400 font-mono">order_items</code>, buckets no Supabase Storage (<code className="text-emerald-400 font-mono">restaurant-media</code>, <code className="text-emerald-400 font-mono">order-receipts</code>) e todas as políticas RLS.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSql}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-neutral-700"
                    title="Baixar arquivo supabase_schema.sql"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Baixar .sql</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar SQL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <pre className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-xs font-mono text-neutral-300 overflow-x-auto max-h-[380px] leading-relaxed selection:bg-amber-500 selection:text-neutral-950">
                {getSupabaseSchemaSql()}
              </pre>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <span>Últimos pedidos registrados neste totem</span>
                <span>{savedOrders.length} pedidos</span>
              </div>

              {savedOrders.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-sm">
                  Nenhum pedido registrado ainda nesta sessão.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-amber-400 text-sm font-display">
                            {ord.orderNumber}
                          </span>
                          <span className="text-neutral-300 font-semibold">
                            {ord.customerName || 'Balcão'}
                          </span>
                          <span className="text-neutral-500">·</span>
                          <span className="text-neutral-400">
                            {ord.diningOption === 'dine_in' ? 'Local' : 'Viagem'}
                          </span>
                        </div>
                        <div className="text-neutral-400 mt-1">
                          {ord.items.length} itens · {new Date(ord.createdAt).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white text-sm tabular-nums">
                          {ord.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.supabaseSynced ? 'bg-emerald-950 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            Supabase: {ord.supabaseSynced ? 'OK' : 'Local'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.n8nSynced ? 'bg-emerald-950 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            n8n: {ord.n8nSynced ? 'Enviado' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
