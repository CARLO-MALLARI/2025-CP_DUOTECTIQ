// src/styles/theme.ts

export const theme = {
  colors: {
    primary: '#2E7D32',      // green
    secondary: '#1B5E20',    // darker green
    accent: '#66BB6A',       // light green accent
    background: '#F5F5F5',   // light gray
    card: '#FFFFFF',
    text: '#212121',
    textMuted: '#757575',
    border: '#E0E0E0',
    danger: '#D32F2F',
    success: '#388E3C',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  font: {
    family: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    size: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20,
      xl: 24,
    },
  },

  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
  },

  radius: {
    sm: 6,
    md: 10,
    lg: 16,
  },
};

