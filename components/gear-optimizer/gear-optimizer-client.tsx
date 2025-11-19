"use client";

import { useState, useMemo } from "react";
import type { Database } from "@/lib/supabase/database.types";

type GearItem = Database['public']['Tables']['gear_items']['Row'];
type GearSet = Database['public']['Tables']['gear_sets']['Row'];

type GearRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
type GearCategory = 'legs' | 'armor' | 'helmet' | 'main_hand' | 'off_hand' | 'accessory';

interface OwnedGear {
  gearId: string;
  rarity: GearRarity;
}

interface GearOptimizerClientProps {
  initialGearItems: GearItem[];
  initialGearSets: GearSet[];
}

const RARITY_ORDER: GearRarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
const RARITY_LABELS: Record<GearRarity, string> = {
  common: 'Grey',
  rare: 'Green',
  epic: 'Blue',
  legendary: 'Purple',
  mythic: 'Gold'
};

export function GearOptimizerClient({
  initialGearItems,
  initialGearSets
}: GearOptimizerClientProps) {
  const [ownedGear, setOwnedGear] = useState<Map<string, OwnedGear>>(new Map());
  const [numberOfAccessories, setNumberOfAccessories] = useState(3);

  // Group gear by category
  const gearByCategory = useMemo(() => {
    const grouped: Record<GearCategory, GearItem[]> = {
      legs: [],
      armor: [],
      helmet: [],
      main_hand: [],
      off_hand: [],
      accessory: []
    };

    initialGearItems.forEach(item => {
      const category = item.category.toLowerCase() as GearCategory;
      if (category in grouped) {
        grouped[category].push(item);
      }
    });

    return grouped;
  }, [initialGearItems]);

  const toggleGearOwnership = (gearId: string, rarity: GearRarity) => {
    const key = `${gearId}-${rarity}`;
    const newOwned = new Map(ownedGear);
    
    if (newOwned.has(key)) {
      newOwned.delete(key);
    } else {
      newOwned.set(key, { gearId, rarity });
    }
    
    setOwnedGear(newOwned);
  };

  const clearCategory = (category: GearCategory) => {
    const newOwned = new Map(ownedGear);
    gearByCategory[category].forEach(item => {
      RARITY_ORDER.forEach(rarity => {
        newOwned.delete(`${item.id}-${rarity}`);
      });
    });
    setOwnedGear(newOwned);
  };

  const clearAll = () => {
    setOwnedGear(new Map());
  };

  const isGearOwned = (gearId: string, rarity: GearRarity): boolean => {
    return ownedGear.has(`${gearId}-${rarity}`);
  };

  const getOwnedGearForCategory = (category: GearCategory): OwnedGear[] => {
    const owned: OwnedGear[] = [];
    gearByCategory[category].forEach(item => {
      RARITY_ORDER.forEach(rarity => {
        if (isGearOwned(item.id, rarity)) {
          owned.push({ gearId: item.id, rarity });
        }
      });
    });
    return owned;
  };

  return (
    <div style={{ maxWidth: "1600px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>Gear Optimizer</h1>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          Select the equipment you own to find your best war gear combinations.
        </p>
      </div>

      {/* Number of Accessories */}
      <div style={{ marginBottom: "2rem", padding: "1rem", background: "#111827", borderRadius: "0.5rem", border: "1px solid rgba(148, 163, 184, 0.2)" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", color: "#cbd5f5", fontWeight: 600 }}>
          Number of accessories you can wear:
        </label>
        <select
          value={numberOfAccessories}
          onChange={(e) => setNumberOfAccessories(Number(e.target.value))}
          style={{
            padding: "0.5rem",
            borderRadius: "0.25rem",
            background: "#0f172a",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            color: "#e2e8f0",
            fontSize: "1rem"
          }}
        >
          {[1, 2, 3, 4, 5].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {/* Clear All Button */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={clearAll}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            background: "#475569",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Equipment Clear All
        </button>
      </div>

      {/* Equipment Categories */}
      <div style={{ display: "grid", gap: "2rem", marginBottom: "3rem" }}>
        {(['legs', 'armor', 'helmet', 'main_hand', 'off_hand', 'accessory'] as GearCategory[]).map(category => (
          <GearCategorySection
            key={category}
            category={category}
            gearItems={gearByCategory[category]}
            ownedGear={getOwnedGearForCategory(category)}
            isGearOwned={isGearOwned}
            onToggleGear={toggleGearOwnership}
            onClear={() => clearCategory(category)}
          />
        ))}
      </div>

      {/* Gear Recommendations */}
      <GearRecommendations
        ownedGear={Array.from(ownedGear.values())}
        allGearItems={initialGearItems}
        gearSets={initialGearSets}
        numberOfAccessories={numberOfAccessories}
      />
    </div>
  );
}

interface GearCategorySectionProps {
  category: GearCategory;
  gearItems: GearItem[];
  ownedGear: OwnedGear[];
  isGearOwned: (gearId: string, rarity: GearRarity) => boolean;
  onToggleGear: (gearId: string, rarity: GearRarity) => void;
  onClear: () => void;
}

function GearCategorySection({
  category,
  gearItems,
  ownedGear,
  isGearOwned,
  onToggleGear,
  onClear
}: GearCategorySectionProps) {
  const categoryLabels: Record<GearCategory, string> = {
    legs: 'Legs',
    armor: 'Armours',
    helmet: 'Helmets',
    main_hand: 'Main Hands',
    off_hand: 'Off Hands',
    accessory: 'Accessories'
  };

  return (
    <div style={{
      background: "#111827",
      borderRadius: "0.75rem",
      border: "1px solid rgba(148, 163, 184, 0.2)",
      overflow: "hidden"
    }}>
      {/* Category Header */}
      <div style={{
        padding: "1rem 1.5rem",
        background: "#1e293b",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(148, 163, 184, 0.2)"
      }}>
        <h2 style={{ margin: 0, fontSize: "1.25rem", textTransform: "capitalize" }}>
          {categoryLabels[category]} 
          <button
            onClick={onClear}
            style={{
              marginLeft: "1rem",
              padding: "0.25rem 0.75rem",
              borderRadius: "0.25rem",
              background: "transparent",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "0.875rem"
            }}
          >
            clear
          </button>
        </h2>
      </div>

      <div style={{ padding: "1.5rem" }}>
        {/* Available Gear */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#cbd5f5" }}>Available</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {gearItems.map(item => (
              <GearItemCard
                key={item.id}
                item={item}
                isOwned={isGearOwned}
                onToggle={onToggleGear}
              />
            ))}
          </div>
        </div>

        {/* Owned Gear */}
        <div>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#cbd5f5" }}>Owned</h3>
          {ownedGear.length === 0 ? (
            <p style={{ color: "#94a3b8", fontStyle: "italic" }}>No equipment selected yet</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
              {ownedGear.map(owned => {
                const item = gearItems.find(i => i.id === owned.gearId);
                if (!item) return null;
                return (
                  <GearItemCard
                    key={`${item.id}-${owned.rarity}`}
                    item={item}
                    isOwned={isGearOwned}
                    onToggle={onToggleGear}
                    highlightRarity={owned.rarity}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface GearItemCardProps {
  item: GearItem;
  isOwned: (gearId: string, rarity: GearRarity) => boolean;
  onToggle: (gearId: string, rarity: GearRarity) => void;
  highlightRarity?: GearRarity;
}

function GearItemCard({ item, isOwned, onToggle, highlightRarity }: GearItemCardProps) {
  const rarityColors: Record<GearRarity, string> = {
    common: '#9ca3af',
    rare: '#22c55e',
    epic: '#3b82f6',
    legendary: '#a855f7',
    mythic: '#f59e0b'
  };

  return (
    <div style={{
      padding: "1rem",
      background: highlightRarity ? "rgba(59, 130, 246, 0.1)" : "#0f172a",
      borderRadius: "0.5rem",
      border: highlightRarity 
        ? `2px solid ${rarityColors[highlightRarity]}` 
        : "1px solid rgba(148, 163, 184, 0.2)"
    }}>
      <div style={{ marginBottom: "0.5rem" }}>
        {item.tier && (
          <span style={{
            display: "inline-block",
            padding: "0.25rem 0.5rem",
            background: "#1e293b",
            borderRadius: "0.25rem",
            fontSize: "0.75rem",
            color: "#cbd5f5",
            marginBottom: "0.5rem"
          }}>
            {item.tier}
          </span>
        )}
      </div>
      <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem", color: "#e2e8f0" }}>
        {item.name}
      </h4>
      
      {/* Rarity Buttons */}
      <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
        {RARITY_ORDER.map(rarity => {
          const owned = isOwned(item.id, rarity);
          return (
            <button
              key={rarity}
              onClick={() => onToggle(item.id, rarity)}
              style={{
                flex: "1",
                minWidth: "60px",
                padding: "0.375rem 0.5rem",
                borderRadius: "0.25rem",
                background: owned ? rarityColors[rarity] : "transparent",
                border: `1px solid ${rarityColors[rarity]}`,
                color: owned ? "#fff" : rarityColors[rarity],
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: owned ? 600 : 400,
                transition: "all 0.2s"
              }}
              title={RARITY_LABELS[rarity]}
            >
              {RARITY_LABELS[rarity].charAt(0)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface GearRecommendationsProps {
  ownedGear: OwnedGear[];
  allGearItems: GearItem[];
  gearSets: GearSet[];
  numberOfAccessories: number;
}

function GearRecommendations({
  ownedGear,
  allGearItems,
  gearSets,
  numberOfAccessories
}: GearRecommendationsProps) {
  // This would contain the optimization logic
  // For now, showing a placeholder
  
  if (ownedGear.length === 0) {
    return (
      <div style={{
        padding: "2rem",
        background: "#111827",
        borderRadius: "0.75rem",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        textAlign: "center"
      }}>
        <p style={{ color: "#94a3b8" }}>Select equipment to see gear recommendations</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: "2rem",
      background: "#111827",
      borderRadius: "0.75rem",
      border: "1px solid rgba(148, 163, 184, 0.2)"
    }}>
      <h2 style={{ margin: "0 0 1.5rem 0", fontSize: "1.5rem" }}>Gears</h2>
      
      <div style={{ marginBottom: "1rem", color: "#94a3b8", fontSize: "0.9rem" }}>
        Mixed gear maximum distance: <span style={{ color: "#3b82f6", cursor: "pointer" }}>what&apos;s this?</span>
      </div>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        {(['infantry', 'ranged', 'cavalry', 'mixed'] as const).map(troopType => (
          <TroopTypeGearSet
            key={troopType}
            troopType={troopType}
            ownedGear={ownedGear}
            allGearItems={allGearItems}
            numberOfAccessories={numberOfAccessories}
          />
        ))}
      </div>
    </div>
  );
}

interface TroopTypeGearSetProps {
  troopType: 'infantry' | 'ranged' | 'cavalry' | 'mixed';
  ownedGear: OwnedGear[];
  allGearItems: GearItem[];
  numberOfAccessories: number;
}

function TroopTypeGearSet({
  troopType,
  ownedGear,
  allGearItems,
  numberOfAccessories
}: TroopTypeGearSetProps) {
  const troopLabels = {
    infantry: 'Infantry',
    ranged: 'Ranged',
    cavalry: 'Cavalry',
    mixed: 'Mixed'
  };

  return (
    <div style={{
      padding: "1.5rem",
      background: "#0f172a",
      borderRadius: "0.5rem",
      border: "1px solid rgba(148, 163, 184, 0.2)"
    }}>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", textTransform: "capitalize" }}>
        {troopLabels[troopType]}
      </h3>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <div style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
            INF/RNG/CAV + ARMY (ATK %)
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "#e2e8f0" }}>
            {/* Calculate based on gear */}
            --
          </div>
        </div>
        <div>
          <div style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
            INF/RNG/CAV + ARMY (HP %)
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "#e2e8f0" }}>
            {/* Calculate based on gear */}
            --
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem" }}>
        {(['legs', 'armor', 'helmet', 'main_hand', 'off_hand'] as const).map(slot => (
          <div key={slot} style={{ textAlign: "center" }}>
            <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "0.5rem", textTransform: "capitalize" }}>
              {slot === 'main_hand' ? 'Main Hand' : slot === 'off_hand' ? 'Off Hand' : slot}
            </div>
            <div style={{
              padding: "1rem",
              background: "#111827",
              borderRadius: "0.25rem",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              minHeight: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: "0.875rem"
            }}>
              --
            </div>
          </div>
        ))}
        
        {/* Accessories */}
        {Array.from({ length: numberOfAccessories }).map((_, idx) => (
          <div key={`accessory-${idx}`} style={{ textAlign: "center" }}>
            <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
              {idx === 0 ? 'First' : idx === 1 ? 'Second' : idx === 2 ? 'Third' : `${idx + 1}th`} Accessory
            </div>
            <div style={{
              padding: "1rem",
              background: "#111827",
              borderRadius: "0.25rem",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              minHeight: "60px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: "0.875rem"
            }}>
              --
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

