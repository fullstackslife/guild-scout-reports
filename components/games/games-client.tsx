"use client";

import { InfoSection } from '@/components/info-section';
import type { Database } from '@/lib/supabase/database.types';

type GameRow = Database['public']['Tables']['games']['Row'];

type GamesClientProps = {
  games: GameRow[];
};

export function GamesClient({ games }: GamesClientProps) {
  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <section>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Games</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#94a3b8' }}>
          Learn about each game, what types of screenshots are needed, and how scout reports are used.
        </p>
      </section>

      {/* General Information */}
      <InfoSection
        title="About Scout Reports"
        icon="📋"
        items={[
          {
            icon: '🎯',
            title: 'Purpose',
            description:
              'Scout reports help guilds coordinate strategies, track enemy movements, analyze game mechanics, and share important information. Each game has specific types of screenshots that are most valuable.'
          },
          {
            icon: '📸',
            title: 'What to Capture',
            description:
              'Focus on screenshots that contain actionable information: enemy formations, resource locations, battle results, character stats, or strategic information that helps your guild make decisions.'
          },
          {
            icon: '🔍',
            title: 'Text Extraction',
            description:
              'Our system automatically extracts text from screenshots, making it easy to search for specific information later. This is especially useful for finding specific players, coordinates, or game data.'
          },
          {
            icon: '👥',
            title: 'Guild Collaboration',
            description:
              'All screenshots are shared with your guild members in the Gallery. This creates a centralized knowledge base that helps coordinate strategies and track important game information.'
          }
        ]}
      />

      {/* Advanced Scouting Techniques */}
      <div
        style={{
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          background: 'rgba(139, 92, 246, 0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🎓</span>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#a78bfa', fontWeight: 600 }}>
            Advanced Scouting Techniques
          </h3>
        </div>
        <div style={{ display: 'grid', gap: '1.25rem', color: '#cbd5f5', fontSize: '0.95rem', lineHeight: 1.6 }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
              🔍 Detecting Active vs. Offline Status
            </h4>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              There are various tactics for determining if a target is truly active or offline. Look for subtle indicators like recent activity timestamps, resource changes, or building upgrades. Multiple reports over time help establish patterns.
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
              🛡️ Tracking Gear Changes
            </h4>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              Gear changes are tricky to track but crucial for understanding target capabilities. Monitor gear over multiple reports to map out what types of equipment targets can have. Document gear combinations and stat changes to build a comprehensive profile.
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
              📊 Monitoring Stat Fluctuations
            </h4>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              Track various stat fluctuations including power levels, resource counts, and troop numbers. Changes in these metrics can indicate activity, upgrades, or strategic preparations. Compare screenshots over time to identify trends.
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
              📊 Building Target Profiles Over Time
            </h4>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              Compare multiple scout reports over time to track troop count changes, wounded numbers, wall HP fluctuations, and trap damage. Monitor might and kills to infer research progress, building upgrades, healing activity, or recent fights. Take screenshots of gear and observe swap patterns (farm gear → war gear) to detect activity. Build long-term target profiles including coordinates, frontline composition, troop style, gear patterns, and behavior patterns.
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
              🕵️ Optional: Guild Help Activity (Spy Accounts Only)
            </h4>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              <strong>Note:</strong> You cannot see an enemy guild&apos;s help feed directly. However, if your guild has a spy account inside the enemy guild, monitoring help activity can be a useful indicator. The number of helps sent to guild mates can reveal if someone is actually online even if they appear offline. This is an advanced tactic that requires internal access to the target guild.
            </p>
          </div>
        </div>
      </div>

      {/* Games List */}
      {games.length === 0 ? (
        <div
          style={{
            padding: '3rem 2rem',
            borderRadius: '1rem',
            border: '1px dashed rgba(148, 163, 184, 0.4)',
            background: '#0f172a',
            textAlign: 'center'
          }}
        >
          <p style={{ color: '#94a3b8' }}>No games available yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({ game }: { game: GameRow }) {
  return (
    <section
      style={{
        padding: '2rem',
        borderRadius: '1rem',
        border: game.coming_soon
          ? '1px solid rgba(148, 163, 184, 0.3)'
          : '1px solid rgba(148, 163, 184, 0.2)',
        background: game.coming_soon ? '#0f172a' : '#111827',
        opacity: game.coming_soon ? 0.7 : 1
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        {game.icon && <span style={{ fontSize: '2rem' }}>{game.icon}</span>}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#e2e8f0' }}>{game.name}</h2>
            {game.coming_soon && (
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(148, 163, 184, 0.2)',
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Coming Soon
              </span>
            )}
          </div>
          {game.description && (
            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>{game.description}</p>
          )}
        </div>
      </div>

      {game.coming_soon ? (
        <div
          style={{
            padding: '2rem',
            borderRadius: '0.75rem',
            border: '1px dashed rgba(148, 163, 184, 0.4)',
            background: '#0f172a',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '1rem' }}>
            This game is coming soon. Screenshot requirements and usage information will be available when the game is activated.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Screenshot Types */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              background: 'rgba(56, 189, 248, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📸</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#38bdf8', fontWeight: 600 }}>
                Types of Screenshots Needed
              </h3>
            </div>
            {game.screenshot_types ? (
              <div
                style={{
                  color: '#cbd5f5',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {game.screenshot_types}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Information about screenshot types for this game will be added soon.
              </div>
            )}
          </div>

          {/* Usage Guide */}
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              background: 'rgba(52, 211, 153, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📊</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#34d399', fontWeight: 600 }}>
                How Screenshots Are Used
              </h3>
            </div>
            {game.usage_guide ? (
              <div
                style={{
                  color: '#cbd5f5',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {game.usage_guide}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                Information about how screenshots are used for this game will be added soon.
              </div>
            )}
          </div>

          {/* Scout Report Analysis Guide - Lords Mobile Specific */}
          {game.name === 'Lords Mobile' && (
            <ScoutReportAnalysisGuide />
          )}
        </div>
      )}
    </section>
  );
}

function ScoutReportAnalysisGuide() {
  return (
    <div
      style={{
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid rgba(251, 191, 36, 0.3)',
        background: 'rgba(251, 191, 36, 0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.25rem' }}>🎯</span>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fbbf24', fontWeight: 600 }}>
          How to Read a Scout Report (The Interrogation Method)
        </h3>
      </div>
      <p style={{ margin: '0 0 1rem 0', color: '#cbd5f5', fontSize: '0.95rem', lineHeight: 1.6 }}>
        <strong>Good players don&apos;t &quot;read&quot; a scout report—they interrogate it.</strong> Every report exists to answer four core questions:
      </p>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)'
          }}
        >
          <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '0.25rem' }}>1. What&apos;s the frontline + troop comp?</div>
          <div style={{ color: '#cbd5f5', fontSize: '0.9rem' }}>What do I send, and can I even burn them?</div>
        </div>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)'
          }}
        >
          <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '0.25rem' }}>2. Is this a trap or a real offline target?</div>
          <div style={{ color: '#cbd5f5', fontSize: '0.9rem' }}>Critical question before committing troops</div>
        </div>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)'
          }}
        >
          <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '0.25rem' }}>3. Are there reinforcements/boosts that make this a bad idea?</div>
          <div style={{ color: '#cbd5f5', fontSize: '0.9rem' }}>Check for allied troops, coalition forces, and active boons</div>
        </div>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.2)'
          }}
        >
          <div style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '0.25rem' }}>4. Is there enough value (kills/resources) to justify the hit?</div>
          <div style={{ color: '#cbd5f5', fontSize: '0.9rem' }}>Calculate if the risk/reward makes sense</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
            Step 1: Quick Vibe Check
          </h4>
          <div style={{ color: '#cbd5f5', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Castle might vs troop count:</strong> Huge might + low visible troops = research/buildings heavy OR troops hidden (shelter, fake rally, Wonder). Medium might + huge troop count (especially T2 carpet) = probable rally trap.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Leader present?</strong> Leader inside = they&apos;re comfortable (or AFK) and will eat you if you misplay. No leader visible = might be hiding in shelter/prison, or already zeroed.
            </p>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
            Step 2: Troops & Frontline (The Main Course)
          </h4>
          <div style={{ color: '#cbd5f5', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Total troop count:</strong> Under ~3–5M troops and no reinforcements? Usually solo food. 10M+ troops with decent might? Now we&apos;re talking rallies or skip.
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Troop tiers:</strong> A mountain of T2 with some T4/T5 = classic trap-style comp. Mostly T3/T4 with weak T2 = often a normal fighter, more killable.
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Frontline identification:</strong> Whichever type has the largest meat shield at the lowest tier is almost always the frontline. This tells you what counter formation and phalanx to use.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Reinforcements/coalition:</strong> Lots of allied troops from fat accounts in the same family guild = big red flag for a trap. Coalition/rally sitting inside = decide whether to snipe, wait, or walk away.
            </p>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
            Step 3: Wall, Traps, and Heroes (How Hard Is the First Hit?)
          </h4>
          <div style={{ color: '#cbd5f5', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Castle Wall HP:</strong> Big wall = your first hit is mostly just to break the wall. Weak/half-damaged wall = previous fights, easier burn.
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Traps:</strong> Tons of traps + full wall = your first march takes extra losses. After the wall falls, traps are irrelevant.
            </p>
            <p style={{ margin: 0 }}>
              <strong>Heroes & familiars on wall:</strong> Are they running real war heroes and pay-to-play monsters? All gold heroes vs mismatched blue/purple free heroes tells you a lot about their stats. Powerful wall familiars = more dangerous defense.
            </p>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
            Step 4: Boons, Wounded, and &quot;Is This a Trap?&quot;
          </h4>
          <div style={{ color: '#cbd5f5', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Boons/Turf boosts:</strong> Active Army ATK/DEF/HP, Army Size, etc. means they&apos;ve prepared or are currently in war mode. No boons doesn&apos;t guarantee offline, but it&apos;s a softer signal.
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              <strong>Wounded in infirmary:</strong> Lots of wounded = they recently got hit or just ate something. Are they repairing and still online? Or AFK farming and forgot to heal?
            </p>
            <p style={{ margin: 0 }}>
              <strong>Reinforcements/names:</strong> If reinforcements are from strong rally leads, they&apos;re probably trying to bait you into bad trades. This entire step is &quot;is this guy actually asleep, or am I about to walk into a content creator thumbnail?&quot;
            </p>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#e2e8f0', fontWeight: 600 }}>
            Step 5: Resources (Worth Farming or Just for Kills?)
          </h4>
          <div style={{ color: '#cbd5f5', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              Check how much is above vault limit, keeping in mind: Food is often shown as &quot;–&quot; if upkeep is high. There&apos;s a 30% tax when you loot from another castle.
            </p>
            <p style={{ margin: 0 }}>
              Strong players will ignore decent troops if the resources are garbage and they don&apos;t care about kills at that moment (or vice-versa). If your goal is pure troop kills, resources are just a side bonus.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '0.5rem',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}
        >
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#a78bfa', fontWeight: 600 }}>
            Core Scout Report Fields (Data Model)
          </h4>
          <p style={{ margin: '0 0 0.75rem 0', color: '#cbd5f5', fontSize: '0.85rem', fontStyle: 'italic' }}>
            This is the canonical schema for extracting data from scout reports. Use this when entering scout data manually.
          </p>
          <div style={{ color: '#cbd5f5', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#e2e8f0' }}>Target Basics:</p>
            <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Name, guild, coordinates, might</li>
              <li>Leader present (yes/no)</li>
              <li>Anti-Scout active (yes/no)</li>
            </ul>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#e2e8f0' }}>Defensive State:</p>
            <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Wall HP</li>
              <li>Traps total (and types with higher Intel)</li>
              <li>Wall heroes (count, rank, grade)</li>
              <li>Wall familiars</li>
              <li>Active boosts/boons</li>
            </ul>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#e2e8f0' }}>Army Picture:</p>
            <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Total troops</li>
              <li>Troop breakdown by type/tier</li>
              <li>Reinforcements (count and senders)</li>
              <li>Garrisons</li>
              <li>Coalition inside</li>
            </ul>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#e2e8f0' }}>Damage / Recent Combat:</p>
            <ul style={{ margin: '0 0 0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Wounded in infirmary</li>
              <li>Damaged traps / Retrieve Traps info</li>
            </ul>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: '#e2e8f0' }}>Economic Value:</p>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Resources by type (above vault)</li>
              <li>Worth it? (farming vs pure kills indicator)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

