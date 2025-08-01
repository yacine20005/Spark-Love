export const COLORS = {
  // Main colors
  primary: '#FF6B9D', // Pink
  secondary: '#FF8E53', // Orange
  accent: '#9B59B6', // Purple
  
  // Gradients
  gradientPrimary: ['#FF6B9D', '#FF8E53'],
  gradientSecondary: ['#9B59B6', '#E74C3C'],
  gradientBackground: ['#667eea', '#764ba2'],
  gradientCard: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  
  // Background
  background: '#0A0A0A', // Dark
  surface: '#1A1A1A', // Dark
  card: 'rgba(255, 255, 255, 0.08)', // White transparent
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  
  // States
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
  
  // Special
  heart: '#FF4757',
  star: '#FFD700',
  love: '#FF1493',
  
  // Transparencies
  overlay: 'rgba(0, 0, 0, 0.5)',
  glass: 'rgba(255, 255, 255, 0.1)',
  glassDark: 'rgba(0, 0, 0, 0.3)',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.25)',
  shadowLight: 'rgba(255, 255, 255, 0.1)',
} as const;

export const GRADIENTS = {
  primary: [COLORS.primary, COLORS.secondary] as string[],
  secondary: [COLORS.accent, COLORS.primary] as string[],
  background: [COLORS.background, COLORS.surface] as string[],
  card: [COLORS.glass, COLORS.glassDark] as string[],
  love: [COLORS.heart, COLORS.love] as string[],
  sunset: [COLORS.secondary, '#FFB347'] as string[], // Orange to Golden Orange
  movie: ['#8E44AD', '#9B59B6'] as string[], // Purple gradient for movies
  dates: ['#3498DB', '#2980B9'] as string[], // Blue gradient for dates
};