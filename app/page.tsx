'use client';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useSendTransaction } from 'wagmi';
import { toHex, parseEther } from 'viem';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

// 🌟 [配置] 国库收款地址
const TREASURY_ADDRESS = "0xb49d859f99c3090613d2aeb80ef522b75b1b5f4e";

// 🌟 [配置] 市场开关：手动修改这里即可开启/关闭市场
const IS_MARKET_ENABLED = false; 

// 从环境变量获取后端地址
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const locales = {
  zh: {
    tabMint: '🚀 轨道发射',
    tabMarket: '🛒 星际枢纽',
    mintProgress: '发射舱容量',
    minted: '已注入',
    total: '总配额',
    connectTop: '连接终端',
    connectWallet: '连接星际终端',
    connectToTrade: '连接终端以进入市场',
    myBalance: '我的燃料舱',
    mintLimit: '铸造限制',
    unit: 'ASTEROID',
    unitK: 'k',
    mintBtn: '点火发射 (0.0005 ETH)',
    deployBtn: '+ 部署卖单',
    noOrders: '太空深处静悄悄，暂无挂单...',
    marketClosed: '⚠️ 轨道纠偏中：交易大厅暂时关闭',
    seller: '指挥官:',
    cancelBtn: '终止',
    buyBtn: '对接',
    modalTitle: '部署 ASTEROID 卖单',
    available: '可用储备:',
    sellAmountLabel: '卖出数量 (单位: k)',
    sellAmountPlaceholder: '输入 k 数 (1 = 1000)',
    priceLabel: '目标售价 (ETH)',
    pricePlaceholder: '例如: 0.01',
    cancel: '取消',
    confirmList: '确认部署',
    toastMintSent: '点火信号已发送! Hash: ',
    toastMintFail: '发射中止',
    toastInputReq: '请完善参数',
    toastPriceZero: '售价必须大于 0',
    toastNoBalance: '燃料不足',
    toastListSent: '部署信号已广播!',
    toastListFail: '部署取消',
    toastBuySent: '对接请求已发送，等待确认!',
    toastBuyFail: '对接取消',
    toastCancelSent: '撤回指令已上传!',
    toastCancelFail: '撤回已取消',
    toastMaxFail: '储备不足 1k ASTEROID'
  },
  en: {
    tabMint: '🚀 ORBITAL LAUNCH',
    tabMarket: '🛒 NEXUS MARKET',
    mintProgress: 'PAYLOAD CAPACITY',
    minted: 'EXTRACTED',
    total: 'TOTAL',
    connectTop: 'CONNECT',
    connectWallet: 'CONNECT TERMINAL',
    connectToTrade: 'CONNECT TO TRADE',
    myBalance: 'CARGO HOLD',
    mintLimit: 'MINT LIMIT',
    unit: 'ASTEROID',
    unitK: 'k',
    mintBtn: 'IGNITE (0.0005 ETH)',
    deployBtn: '+ DEPLOY ORDER',
    noOrders: 'DEEP SPACE IS QUIET...',
    marketClosed: '⚠️ Maintenance: Market is currently closed',
    seller: 'CMDR:',
    cancelBtn: 'ABORT',
    buyBtn: 'DOCK',
    modalTitle: 'DEPLOY ASTEROID',
    available: 'RESERVE:',
    sellAmountLabel: 'AMOUNT (UNIT: k)',
    sellAmountPlaceholder: 'e.g., 1 (for 1000)',
    priceLabel: 'PRICE (ETH)',
    pricePlaceholder: 'e.g., 0.01',
    cancel: 'CANCEL',
    confirmList: 'DEPLOY',
    toastMintSent: 'Ignition sent! Hash: ',
    toastMintFail: 'Launch aborted',
    toastInputReq: 'Parameters missing',
    toastPriceZero: 'Price > 0 required',
    toastNoBalance: 'Insufficient cargo',
    toastListSent: 'Order broadcasted!',
    toastListFail: 'Listing aborted',
    toastBuySent: 'Docking request sent!',
    toastBuyFail: 'Docking aborted',
    toastCancelSent: 'Abort command sent!',
    toastCancelFail: 'Abort cancelled',
    toastMaxFail: 'Cargo < 1k ASTEROID'
  }
};

export default function Home() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { sendTransaction } = useSendTransaction();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const t = locales[lang];

  const [activeTab, setActiveTab] = useState('mint');
  const [progress, setProgress] = useState({ minted: 0, max: 1000000 });
  const [orders, setOrders] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [mintCount, setMintCount] = useState(0);
  const [sellAmount, setSellAmount] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  useEffect(() => {
    if (!mounted || !API_URL) return;
    const fetchData = async () => {
      try {
        // 🚀 配置跳过 Ngrok 警告页的 Header
        const commonHeaders = {
          'ngrok-skip-browser-warning': 'true'
        };

        // 1. 获取铸造进度
        const resProgress = await fetch(`${API_URL}/api/token/asteroid`, { headers: commonHeaders });
        const jsonProgress = await resProgress.json();
        if (jsonProgress.data) setProgress({ minted: jsonProgress.data.minted, max: jsonProgress.data.max });

        // 2. 只有市场开启时才抓取订单
        if (IS_MARKET_ENABLED) {
          const resOrders = await fetch(`${API_URL}/api/market/orders`, { headers: commonHeaders });
          const jsonOrders = await resOrders.json();
          if (jsonOrders.data) setOrders(jsonOrders.data);
        }
        
        // 3. 获取用户余额
        if (address) {
          const resBalance = await fetch(`${API_URL}/api/balance/${address}`, { headers: commonHeaders });
          const jsonBalance = await resBalance.json();
          if (jsonBalance.success) {
            setUserBalance(jsonBalance.balance);
            setMintCount(jsonBalance.mintCount || 0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [address, mounted]);

  // ---------------- 逻辑函数 ----------------
  const handleMint = () => {
    if (mintCount >= 10) return toast.error("已达到 10 次铸造上限");
    const mintData = 'data:,{"p":"base-20","op":"mint","tick":"asteroid","amt":"1000"}';
    sendTransaction(
      { to: TREASURY_ADDRESS, value: parseEther('0.0005'), data: toHex(mintData) },
      {
        onSuccess: (hash) => toast.success(`${t.toastMintSent}${hash.slice(0,6)}...`),
        onError: () => toast.error(t.toastMintFail)
      }
    );
  };

  const handleList = () => {
    if (!IS_MARKET_ENABLED) return toast.error("市场暂未开放");
    const amountInK = parseInt(sellAmount);
    const actualAmount = amountInK * 1000;
    const priceNum = parseFloat(sellPrice);

    if (!sellAmount || !sellPrice) return toast.error(t.toastInputReq);
    if (priceNum <= 0) return toast.error(t.toastPriceZero);
    if (actualAmount > userBalance) return toast.error(t.toastNoBalance);

    const listData = `data:,{"p":"base-20","op":"list","tick":"asteroid","amt":"${actualAmount}","price":"${priceNum}"}`;
    sendTransaction({ to: address, value: parseEther('0'), data: toHex(listData) }, {
        onSuccess: () => { toast.success(t.toastListSent); setIsModalOpen(false); setSellAmount(''); setSellPrice(''); },
        onError: () => toast.error(t.toastListFail)
    });
  };

  const handleBuy = (order: any) => {
    if (!IS_MARKET_ENABLED) return toast.error("市场暂未开放");
    const buyData = `data:,{"p":"base-20","op":"buy","tick":"asteroid","id":"${order.listTx}"}`;
    sendTransaction({ to: order.seller, value: parseEther(order.price), data: toHex(buyData) }, {
        onSuccess: () => toast.success(t.toastBuySent),
        onError: () => toast.error(t.toastBuyFail)
    });
  };

  const handleCancel = (order: any) => {
    const cancelData = `data:,{"p":"base-20","op":"cancel","tick":"asteroid","id":"${order.listTx}"}`;
    sendTransaction({ to: address, value: parseEther('0'), data: toHex(cancelData) }, {
        onSuccess: () => toast.success(t.toastCancelSent),
        onError: () => toast.error(t.toastCancelFail)
    });
  };

  const percent = progress.max > 0 ? ((progress.minted / progress.max) * 100).toFixed(2) : "0.00";

  return (
    <main className="min-h-screen bg-[#030303] text-white flex flex-col items-center pt-28 p-6 font-sans relative overflow-hidden selection:bg-orange-500/30">
      
      {/* 🚀 左上角 Logo */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
        <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full p-[2px] bg-gradient-to-tr from-orange-500 to-red-600 shadow-[0_0_20px_rgba(249,115,22,0.3)] border border-white/10">
          <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/39880.png" alt="Asteroid" className="w-full h-full rounded-full object-cover animate-[spin_60s_linear_infinite]" />
        </div>
        <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-white uppercase">ASTEROID</span>
      </div>

      {/* 🌟 右上角组合 */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2 md:gap-3">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg flex p-1">
          <button onClick={() => setLang('en')} className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold rounded transition-all ${lang === 'en' ? 'bg-orange-500 text-white' : 'text-gray-500'}`}>EN</button>
          <button onClick={() => setLang('zh')} className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold rounded transition-all ${lang === 'zh' ? 'bg-orange-500 text-white' : 'text-gray-500'}`}>中</button>
        </div>
        <button onClick={() => open()} className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 hover:border-orange-500/50 px-3 md:px-4 py-2 rounded-lg transition-all shadow-xl">
          {mounted && isConnected ? (
            <><span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></span><span className="text-[10px] md:text-xs font-mono font-bold tracking-widest">{address?.slice(0, 6)}...{address?.slice(-4)}</span></>
          ) : (
            <><span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span><span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{t.connectTop}</span></>
          )}
        </button>
      </div>

      <Toaster position="top-center" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #333' } }} />

      {/* 选项卡 */}
      <div className="flex bg-white/5 backdrop-blur-md rounded-2xl p-1 mb-10 w-full max-w-md border border-white/10 relative z-10">
        <button onClick={() => setActiveTab('mint')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'mint' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{t.tabMint}</button>
        <button onClick={() => setActiveTab('market')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'market' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{t.tabMarket}</button>
      </div>

      {/* 主面板 */}
      <div className="max-w-md w-full bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative z-10">
        {activeTab === 'mint' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-8 p-6 bg-black/40 rounded-3xl border border-white/5">
              <div className="flex justify-between text-xs mb-4 font-mono text-gray-400 uppercase tracking-widest">
                <span>{t.mintProgress}</span>
                <span className="text-orange-400 font-bold">{percent}%</span>
              </div>
              <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                <div className="bg-gradient-to-r from-orange-600 to-yellow-500 h-full transition-all duration-1000 shadow-[0_0_20px_rgba(249,115,22,0.4)]" style={{ width: `${percent}%` }}></div>
              </div>
              <div className="mt-4 flex justify-between text-[10px] text-gray-500 font-mono uppercase">
                <span>{progress.minted.toLocaleString()} {t.minted}</span>
                <span>{t.total} {progress.max.toLocaleString()}</span>
              </div>
            </div>

            {mounted && !isConnected ? (
              <button onClick={() => open()} className="w-full bg-white text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-wider">{t.connectWallet}</button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">{t.myBalance}</p>
                    <p className="text-lg font-black text-orange-400 font-mono">{userBalance.toLocaleString()}</p>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">{t.mintLimit}</p>
                    <p className="text-lg font-black text-white font-mono">{mintCount} / 10</p>
                  </div>
                </div>
                <button onClick={handleMint} className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-black py-4 rounded-2xl hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all active:scale-95 uppercase">{t.mintBtn}</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'market' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {!IS_MARKET_ENABLED ? (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <span className="text-2xl">🚧</span>
                </div>
                <p className="text-sm font-mono text-gray-500 uppercase tracking-widest leading-relaxed">
                  {t.marketClosed}
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-6">
                  {mounted && isConnected && (
                    <button onClick={() => setIsModalOpen(true)} className="bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-lg">
                      {t.deployBtn}
                    </button>
                  )}
                </div>

                <div className="space-y-3 h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {orders.length === 0 ? (
                    <div className="text-center text-gray-600 text-xs font-mono mt-20 uppercase tracking-widest">{t.noOrders}</div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.listTx} className="bg-black/40 border border-white/5 p-5 rounded-3xl flex justify-between items-center hover:border-orange-500/30 transition-all">
                        <div>
                          <div className="text-base font-black text-white">{order.amount / 1000}{t.unitK} <span className="text-[10px] text-gray-500 font-normal">{t.unit}</span></div>
                          <div className="text-[9px] text-gray-600 font-mono mt-1">{t.seller} {order.seller.slice(0,6)}...</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-orange-400 font-mono mb-2">{order.price} ETH</div>
                          {mounted && isConnected && address?.toLowerCase() === order.seller.toLowerCase() ? (
                            <button onClick={() => handleCancel(order)} className="bg-white/5 text-gray-400 text-[10px] px-4 py-1.5 rounded-lg border border-white/10 hover:bg-red-500/10 hover:text-red-500 transition-all">{t.cancelBtn}</button>
                          ) : (
                            <button onClick={() => handleBuy(order)} className="bg-white text-black text-[10px] font-black px-5 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition-all uppercase">{t.buyBtn}</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 挂单弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tight">{t.modalTitle}</h2>
            <div className="bg-white/5 p-4 rounded-2xl mb-6 flex justify-between items-center border border-white/5">
              <span className="text-[10px] text-gray-500 uppercase">{t.available}</span>
              <span className="text-orange-400 font-black font-mono">{userBalance / 1000}{t.unitK}</span>
            </div>
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-[10px] text-gray-500 mb-2 uppercase font-mono">{t.sellAmountLabel}</label>
                <div className="relative">
                  <input type="number" value={sellAmount} onChange={(e) => setSellAmount(e.target.value)} className="w-full bg-black border border-white/10 focus:border-orange-500 rounded-xl py-3.5 px-4 text-white outline-none font-mono text-sm [appearance:textfield]" placeholder={t.sellAmountPlaceholder} />
                  <button onClick={() => {
                      const maxK = Math.floor(userBalance / 1000);
                      if (maxK === 0) toast.error(t.toastMaxFail);
                      else setSellAmount(maxK.toString());
                    }} className="absolute right-2 top-2.5 bg-white/10 hover:bg-orange-500 text-white text-[10px] px-3 py-1.5 rounded-lg transition-all font-bold">MAX</button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-2 uppercase font-mono">{t.priceLabel}</label>
                <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="w-full bg-black border border-white/10 focus:border-orange-500 rounded-xl py-3.5 px-4 text-white outline-none font-mono text-sm [appearance:textfield]" placeholder={t.pricePlaceholder} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-xl bg-white/5 text-gray-500 font-bold text-xs uppercase">{t.cancel}</button>
              <button onClick={handleList} className="flex-1 py-3.5 rounded-xl bg-orange-500 text-white font-black text-xs hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all uppercase">{t.confirmList}</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `.custom-scrollbar::-webkit-scrollbar{width:4px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(249,115,22,0.5)}`}} />
    </main>
  );
}