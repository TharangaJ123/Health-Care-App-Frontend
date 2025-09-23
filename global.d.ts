// This file helps suppress TypeScript errors from node_modules
declare module 'expo-linear-gradient' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  export interface LinearGradientProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
    style?: ViewStyle;
    children?: React.ReactNode;
  }

  export default class LinearGradient extends Component<LinearGradientProps> {}
}

// Add other module declarations here if needed
