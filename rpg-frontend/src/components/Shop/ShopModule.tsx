import React, { useState } from 'react';
import { ShopItem, UserProfile } from '../../types';
import { AvatarPreview } from './AvatarPreview';
import {
  ShoppingBag,
  Coins,
  Gem,
  Check,
  Sparkles,
  Shield,
  Palette,
  Award,
  Layers,
  Lock,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface ShopModuleProps {
  shopItems: ShopItem[];
  profile: UserProfile;
  ownedItemIds: string[];
  onBuyItem: (item: ShopItem) => void;
  onEquipItem: (item: ShopItem) => void;
}

export const ShopModule: React.FC<ShopModuleProps> = ({
  shopItems,
  profile,
  ownedItemIds,
  onBuyItem,
  onEquipItem,
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');
  const [filterType, setFilterType] = useState<'all' | 'skin' | 'theme' | 'border' | 'title'>('all');

  const filteredItems = shopItems.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    return true;
  });

  const ownedItems = shopItems.filter((item) => ownedItemIds.includes(item.id));

  const handleBuy = (item: ShopItem) => {
    soundFx.playCoin();
    onBuyItem(item);
  };

  const handleEquip = (item: ShopItem) => {
    soundFx.playQuestComplete();
    onEquipItem(item);
  };

  const rarityColor = {
    Comum: 'border-slate-700 bg-slate-900 text-slate-300',
    Raro: 'border-blue-700 bg-blue-950/40 text-blue-300',
    Épico: 'border-purple-700 bg-purple-950/40 text-purple-300',
    Lendário: 'border-amber-500 bg-amber-950/40 text-amber-300 animate-pulse',
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-950 border border-amber-800 rounded-xl text-amber-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
              Loja de Cosméticos & Inventário
            </h2>
            <p className="text-xs text-slate-400">
              Desbloqueie Skins de Avatar, Temas Visuais e Títulos com suas conquistas.
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'shop'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-black shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Vitrine
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-slate-100 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Inventário ({ownedItems.length})
          </button>
        </div>
      </div>

      {/* Item Type Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
            filterType === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          Todos os Itens
        </button>
        <button
          onClick={() => setFilterType('skin')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
            filterType === 'skin'
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          Skins de Avatar
        </button>
        <button
          onClick={() => setFilterType('theme')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
            filterType === 'theme'
              ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          Temas
        </button>
        <button
          onClick={() => setFilterType('title')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
            filterType === 'title'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          Títulos
        </button>
      </div>

      {/* SHOP VIEW */}
      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isOwned = ownedItemIds.includes(item.id);
            const isEquipped =
              profile.equippedSkinId === item.id ||
              profile.equippedThemeId === item.id ||
              profile.equippedTitle === item.name;

            const canAffordCoins = item.priceCoins !== undefined && profile.coins >= item.priceCoins;
            const canAffordGems = item.priceGems !== undefined && profile.gems >= item.priceGems;
            const canAfford = canAffordCoins || canAffordGems || item.priceCoins === 0;

            return (
              <div
                key={item.id}
                className={`bg-slate-900/80 border rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-3 transition-all ${
                  rarityColor[item.rarity]
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800">
                      {item.rarity}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {item.type}
                    </span>
                  </div>

                  {/* Visual Preview */}
                  {item.type === 'skin' ? (
                    <div className="flex justify-center my-2 scale-90">
                      <AvatarPreview
                        skinId={item.id}
                        borderId={profile.equippedBorderId}
                        title={item.name}
                        rank={profile.rank}
                        level={profile.level}
                        size="md"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full h-16 rounded-xl border border-slate-800 flex items-center justify-center my-2 relative overflow-hidden"
                      style={{ backgroundColor: item.previewColor || '#0F172A' }}
                    >
                      <Sparkles className="w-6 h-6 text-slate-100 opacity-60" />
                    </div>
                  )}

                  <h3 className="font-extrabold text-sm text-slate-100 mt-2">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                </div>

                {/* Price & Action Button */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 font-mono font-black text-sm">
                    {item.priceCoins !== undefined && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        {item.priceCoins === 0 ? 'Grátis' : item.priceCoins}
                      </span>
                    )}
                    {item.priceGems !== undefined && (
                      <span className="text-purple-400 flex items-center gap-1">
                        <Gem className="w-4 h-4" />
                        {item.priceGems}
                      </span>
                    )}
                  </div>

                  {isOwned ? (
                    <button
                      onClick={() => handleEquip(item)}
                      disabled={isEquipped}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1 ${
                        isEquipped
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Equipado
                        </>
                      ) : (
                        'Equipar'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition flex items-center gap-1 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Comprar' : 'Sem Saldo'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INVENTORY VIEW */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ownedItems.length === 0 ? (
            <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Você ainda não possui cosméticos adicionais. Adquira na aba da Vitrine!
            </div>
          ) : (
            ownedItems.map((item) => {
              const isEquipped =
                profile.equippedSkinId === item.id ||
                profile.equippedThemeId === item.id ||
                profile.equippedTitle === item.name;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-lg space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-950 text-slate-400">
                        {item.type}
                      </span>
                      {isEquipped && (
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3" /> EQUIPADO
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-100">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                  </div>

                  <button
                    onClick={() => handleEquip(item)}
                    disabled={isEquipped}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isEquipped
                        ? 'bg-slate-950 text-slate-500 border border-slate-800'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    {isEquipped ? 'Já Equipado' : 'Equipar no Personagem'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
