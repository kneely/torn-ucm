import { defineConfig, presetWind3 } from 'unocss';

export default defineConfig({
  presets: [
    presetWind3({ prefix: 'u-', preflight: false }),
  ],
  content: {
    pipeline: {
      include: [
        /\.js$/,
      ],
    },
  },
  theme: {
    colors: {
      surface: {
        base: 'var(--ucm-surface-base)',
        panel: 'var(--ucm-surface-panel)',
        strong: 'var(--ucm-surface-strong)',
        muted: 'var(--ucm-surface-muted)',
        soft: 'var(--ucm-surface-soft)',
      },
      border: {
        soft: 'var(--ucm-border-soft)',
        strong: 'var(--ucm-border-strong)',
      },
      text: {
        main: 'var(--ucm-text-main)',
        muted: 'var(--ucm-text-muted)',
        faint: 'var(--ucm-text-faint)',
      },
      accent: {
        DEFAULT: 'var(--ucm-accent)',
        strong: 'var(--ucm-accent-strong)',
        warm: 'var(--ucm-accent-warm)',
      },
      danger: 'var(--ucm-danger)',
      success: 'var(--ucm-success)',
      info: 'var(--ucm-info)',
    },
    borderRadius: {
      'ucm-xs': 'var(--ucm-radius-xs)',
      'ucm-sm': 'var(--ucm-radius-sm)',
      'ucm-md': 'var(--ucm-radius-md)',
      'ucm-lg': 'var(--ucm-radius-lg)',
    },
    spacing: {
      'ucm-1': 'var(--ucm-space-1)',
      'ucm-2': 'var(--ucm-space-2)',
      'ucm-3': 'var(--ucm-space-3)',
      'ucm-4': 'var(--ucm-space-4)',
      'ucm-5': 'var(--ucm-space-5)',
      'ucm-6': 'var(--ucm-space-6)',
    },
    fontFamily: {
      display: 'var(--ucm-font-display)',
      body: 'var(--ucm-font-body)',
    },
    boxShadow: {
      panel: 'var(--ucm-shadow-panel)',
      card: 'var(--ucm-shadow-card)',
    },
  },
});
