'use client';

import React from 'react';

export function TacticalHeader() {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-border-default/80 shadow-[0_1px_12px_rgba(0,0,0,0.7)]">
      <div className="h-16 px-gutter flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-space-sm">
          {/* Tactical Logo Badge */}
          <div className="w-8 h-8 bg-surface-container-high border border-border-default flex items-center justify-center text-primary font-bold font-headline text-lg">
            G
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline text-base uppercase tracking-wider text-on-surface font-bold">
                GATEHOUSE
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-surface-container-high text-primary-container border border-primary-container/40 font-bold">
                v4.2
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
              </span>
              <span className="font-mono text-[10px] text-secondary tracking-widest uppercase">
                SYS_READY // AIR_GAPPED
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-space-sm">
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-mono text-xs text-on-surface-variant uppercase">
              Control Room Node
            </span>
            <span className="font-mono text-[10px] text-secondary">CLUSTER-US-EAST</span>
          </div>
          <button
            type="button"
            className="min-h-[38px] px-3 bg-surface-container text-primary border border-border-default hover:border-primary font-mono text-xs tracking-wider uppercase flex items-center justify-center transition-colors active:opacity-80"
          >
            COMMAND POST
          </button>
        </div>
      </div>
    </header>
  );
}
