export const COLORS = {
  // Main colors
  primary: '#ff6b6b', // Spark Red/Pink
  primaryDark: '#ae2f34',
  secondary: '#844981', // Romantic Plum/Purple
  accent: '#ffd93d', // Golden Match Accent
  tertiary: '#9c4143', // Soft Rose
  tertiaryLight: '#e87b7c',
  
  // Gradients
  gradientPrimary: ['#ff6b6b', '#ffd93d'],
  gradientSecondary: ['#844981', '#ff6b6b'],
  gradientBackground: ['#fdf9f0', '#f7f3ea'],
  gradientCard: ['#ffffff', '#fdf9f0'],
  
  // Background
  background: '#fdf9f0', // Warm Cream Sunset
  surface: '#ffffff', // Pure white for cards/surfaces
  surfaceContainer: '#f1eee5', // Soft warm beige container
  surfaceContainerLow: '#f7f3ea', // Lighter container
  card: '#ffffff',
  
  // Text
  textPrimary: '#1c1c17', // High-contrast deep dark brown
  textSecondary: '#584140', // Muted rose-tinted dark gray
  textTertiary: '#8c706f', // Warm outline border color
  
  // States
  success: '#2ecc71',
  warning: '#ffd93d',
  error: '#ba1a1a',
  info: '#3498db',
  
  // Special
  heart: '#ff6b6b',
  star: '#ffd93d',
  love: '#ae2f34',
  
  // Transparencies
  overlay: 'rgba(28, 28, 23, 0.4)',
  glass: 'rgba(255, 255, 255, 0.8)',
  glassDark: 'rgba(28, 28, 23, 0.08)',
  
  // Shadows & Borders
  outline: '#8c706f',
  outlineVariant: '#e0bfbd',
  shadow: 'rgba(74, 21, 75, 0.08)',
  shadowLight: 'rgba(74, 21, 75, 0.04)',
} as const;

export const GRADIENTS = {
  primary: [COLORS.primary, '#ff8e8e'] as string[],
  secondary: [COLORS.secondary, COLORS.primary] as string[],
  background: [COLORS.background, COLORS.surfaceContainerLow] as string[],
  card: ['#ffffff', '#fdf9f0'] as string[],
  love: [COLORS.heart, COLORS.love] as string[],
  sunset: ['#ff6b6b', '#ffd93d'] as string[], // Spark to Golden match
  movie: ['#4a154b', '#844981'] as string[], // Romantic deep purple gradient for movies
  dates: ['#9c4143', '#e87b7c'] as string[], // Rose red gradient for dates
};